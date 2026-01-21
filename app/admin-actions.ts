"use server"

import { getSession } from "./actions"

export async function processCancellation(appointmentId: string, approved: boolean) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify Admin/Staff Role
    const { data: user } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!user || (user.role !== 'owner' && user.role !== 'staff')) {
        return { success: false, error: "Yetkisiz işlem." };
    }

    // 2. Update Appointment Status
    // If approved -> 'cancelled' (Credits returned logic handled by simple counting usually, or we might need explicit refund if logic is complex)
    // If rejected -> 'confirmed' (Reverts to original state)

    const newStatus = approved ? 'cancelled' : 'confirmed';

    const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)
        .eq('organization_id', user.organization_id);

    if (error) {
        console.error("Process cancellation error:", error);
        return { success: false, error: "İşlem kaydedilemedi." };
    }

    return { success: true };
}
