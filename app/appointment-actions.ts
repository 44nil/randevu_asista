"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "./actions"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function getAppointments(startDate?: string, endDate?: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, data: [], error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, data: [], error: "No organization found" };
    }

    let query = supabase
        .from('class_sessions')
        .select(`
            id,
            start_time,
            end_time,
            service_id,
            capacity,
            staff:instructor_id(full_name),
            appointments(
                id,
                status,
                customer:customers(name)
            )
        `)
        .eq('organization_id', userData.organization_id);

    if (startDate) {
        query = query.gte('start_time', startDate);
    } else {
        query = query.gte('start_time', new Date().toISOString().split('T')[0]);
    }

    if (endDate) {
        query = query.lte('end_time', endDate); // Use end_time for safer bounds
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) {
        console.error(error);
        return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
}

// RENAMED/REFACTORED: Creates a Class Session (and optionally books users)
export async function createClassSession(data: {
    customer_ids?: string[] // Optional now
    appointment_date: string // ISO string start time
    duration_minutes: number
    type: string // "reformer" | "mat" | "private"
    recurring_weeks: number // Default 1
    capacity?: number // Default 1 or 3 depending on type
}) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    // Get Staff/Org info
    const { data: userData } = await supabase
        .from('users')
        .select('organization_id, id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, error: "No organization found" };
    }

    console.log('🎯 Creating class session:', {
        organization_id: userData.organization_id,
        instructor_id: userData.id,
        data
    })

    const baseStartTime = new Date(data.appointment_date);
    const defaultCapacity = data.capacity || (data.type === 'private' ? 1 : 3); // Simple default logic

    const sessionInserts = [];
    const appointmentInserts = [];

    // Loop for Weeks (Recurrence)
    for (let i = 0; i < data.recurring_weeks; i++) {
        const currentStartTime = new Date(baseStartTime);
        currentStartTime.setDate(baseStartTime.getDate() + (i * 7)); // Add 7 days per week

        const currentEndTime = new Date(currentStartTime.getTime() + data.duration_minutes * 60000);

        // 1. Prepare Session Data
        // We need the ID before inserting appointments, so we might need single inserts or a procedure.
        // Supabase/Postgres allows `insert().select()` to get IDs back.
        // But for bulk recursion it's tricky.
        // Let's do a loop with await for now to ensure we get IDs. It's safer.

        const { data: session, error: sessionError } = await supabase
            .from('class_sessions')
            .insert({
                organization_id: userData.organization_id,
                instructor_id: userData.id, // The creator is the instructor for now
                service_id: data.type,
                start_time: currentStartTime.toISOString(),
                end_time: currentEndTime.toISOString(),
                capacity: defaultCapacity
            })
            .select('id')
            .single();

        if (sessionError || !session) {
            console.error("❌ Session create error:", {
                error: sessionError,
                message: sessionError?.message,
                details: sessionError?.details,
                hint: sessionError?.hint,
                code: sessionError?.code
            });
            // Return error instead of continuing
            return {
                success: false,
                error: `Failed to create session: ${sessionError?.message || 'Unknown error'}`
            };
        }

        console.log('✅ Session created:', session);

        // 2. Prepare Appointments (if customers provided)
        if (data.customer_ids && data.customer_ids.length > 0) {
            for (const customerId of data.customer_ids) {
                appointmentInserts.push({
                    organization_id: userData.organization_id,
                    customer_id: customerId,
                    staff_id: userData.id,
                    service_id: data.type,
                    start_time: currentStartTime.toISOString(),
                    end_time: currentEndTime.toISOString(),
                    status: 'confirmed',
                    session_id: session.id // Link to the session
                });
            }
        }
    }

    // Bulk Insert Appointments
    if (appointmentInserts.length > 0) {
        const { error: apptError } = await supabase.from('appointments').insert(appointmentInserts);
        if (apptError) {
            console.error("Appointment create error", apptError);
            return { success: false, error: "Sessions created but failed to book customers." };
        }
    }

    revalidatePath('/');
    revalidatePath('/program');
    return { success: true };
}
