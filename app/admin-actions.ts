
"use server"

import { getSession } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { promoteFromWaitlist } from "@/app/waitlist-actions";

export async function processCancellation(appointmentId: string, approved: boolean) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    // 1. Get User Role (Security)
    const { data: user } = await supabase.from('users').select('role, organization_id').eq('clerk_id', userId).single();
    if (user?.role === 'customer') {
        return { success: false, error: "Unauthorized" };
    }

    // 2. Get Appointment — session_id dahil
    const { data: appointment } = await supabase
        .from('appointments')
        .select('id, customer_id, status, session_id')
        .eq('id', appointmentId)
        .single();

    if (!appointment) return { success: false, error: "Appointment not found" };

    if (approved) {
        // APPROVE: Cancel Appointment & Refund Credit

        // A. Cancel Appointment
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', appointmentId);

        if (updateError) return { success: false, error: "Failed to update status" };

        // B. Refund Credit
        const { data: pkg } = await supabase
            .from('customer_packages')
            .select('*')
            .eq('customer_id', appointment.customer_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (pkg) {
            const newCredits = pkg.remaining_credits + 1;
            const newStatus = newCredits > 0 ? 'active' : pkg.status;

            await supabase
                .from('customer_packages')
                .update({
                    remaining_credits: newCredits,
                    status: newStatus
                })
                .eq('id', pkg.id);
        }

        // C. Waitlist'ten otomatik terfi (grup seans modeli)
        if (appointment.session_id) {
            await promoteFromWaitlist(appointment.session_id);
        }

    } else {
        // REJECT: Revert to confirmed
        const { error: updateError } = await supabase
            .from('appointments')
            .update({
                status: 'confirmed',
                cancellation_reason: null
            })
            .eq('id', appointmentId);

        if (updateError) return { success: false, error: "Failed to reject" };
    }

    revalidatePath('/');
    return { success: true };
}
