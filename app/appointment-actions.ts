"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "./actions"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function getAppointments(startDate?: string, endDate?: string, staffId?: string) {
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
            staff:instructor_id(full_name, id),
            appointments(
                id,
                status,
                customer:customers(name)
            )
        `)
        .eq('organization_id', userData.organization_id);

    if (staffId) {
        query = query.eq('instructor_id', staffId);
    }

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


/**
 * Helper to check if an instructor is available for a given time slot.
 * Checks against:
 * 1. Weekly schedule (working hours)
 * 2. Registered time-offs / holidays
 * 3. Existing overlapping class sessions
 */
export async function checkInstructorAvailability(instructorId: string, startTime: Date, endTime: Date) {
    const supabase = supabaseAdmin;
    const dayOfWeek = startTime.getDay(); // 0 = Sunday, 1 = Monday
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // 0. Check Organization Schedule (Master Switch)
    const { data: userData } = await supabase
        .from('users')
        .select('organization:organizations(settings)')
        .eq('id', instructorId)
        .single();

    const orgSettings = (userData as any)?.organization?.settings;
    if (orgSettings?.working_hours) {
        const orgDayConfig = orgSettings.working_hours[dayName];
        if (orgDayConfig && orgDayConfig.isOpen === false) {
            return { available: false, reason: "İşletme bu gün kapalıdır." };
        }
    }

    // 1. Check Schedule (Staff level)
    const { data: schedule } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('user_id', instructorId)
        .eq('day_of_week', dayOfWeek)
        .single();

    if (schedule) {
        if (!schedule.is_working_day) {
            return { available: false, reason: "Personelin bu gün çalışma günü değil." };
        }

        const pad = (n: number) => n.toString().padStart(2, '0');
        const startStr = `${pad(startTime.getHours())}:${pad(startTime.getMinutes())}:00`;
        const endStr = `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}:00`;

        // Postgres TIME comparison
        if (startStr < schedule.start_time || endStr > schedule.end_time) {
            return {
                available: false,
                reason: `Mesai saatleri dışında (${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)})`
            };
        }
    }

    // 2. Check Time Offs (Any overlap)
    const { data: timeOffs } = await supabase
        .from('staff_time_offs')
        .select('*')
        .eq('user_id', instructorId)
        .lt('start_date', endTime.toISOString()) // Start of time-off is before session ends
        .gt('end_date', startTime.toISOString()); // End of time-off is after session starts

    if (timeOffs && timeOffs.length > 0) {
        return { available: false, reason: "Personel bu tarihlerde izinli." };
    }

    // 3. Check Overlapping Sessions
    const { data: overlappingSessions } = await supabase
        .from('class_sessions')
        .select('id')
        .eq('instructor_id', instructorId)
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString())
        .limit(1);

    if (overlappingSessions && overlappingSessions.length > 0) {
        return { available: false, reason: "Personelin bu saatte başka bir dersi bulunuyor." };
    }

    // 4. Check Overlapping Standalone Appointments
    const { data: overlappingAppts } = await supabase
        .from('appointments')
        .select('id')
        .eq('staff_id', instructorId)
        .is('session_id', null) // Only standalone appointments (sessions are checked above)
        .neq('status', 'cancelled')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString())
        .limit(1);

    if (overlappingAppts && overlappingAppts.length > 0) {
        return { available: false, reason: "Personelin bu saatte bireysel bir randevusu bulunuyor." };
    }

    return { available: true };
}

// RENAMED/REFACTORED: Creates a Class Session (and optionally books users)
export async function createClassSession(data: {
    customer_ids?: string[] // Optional now
    instructor_id?: string // Added: Optional instructor override
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
        .select(`
            organization_id, 
            id, 
            role,
            organization:organizations(settings)
        `)
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, error: "No organization found" };
    }

    // Determine target instructor (default to self, but allow override if owner/admin)
    let targetInstructorId = userData.id;
    if (data.instructor_id && ['owner', 'admin'].includes(userData.role)) {
        targetInstructorId = data.instructor_id;
    }

    console.log('🎯 Creating class session:', {
        organization_id: userData.organization_id,
        instructor_id: targetInstructorId,
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

        // --- ORGANIZATION LEVEL CHECK ---
        const orgSettings = (userData as any)?.organization?.settings;
        if (orgSettings?.working_hours) {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[currentStartTime.getDay()];
            const orgDayConfig = orgSettings.working_hours[dayName];
            if (orgDayConfig && orgDayConfig.isOpen === false) {
                const dateStr = currentStartTime.toLocaleDateString('tr-TR');
                return {
                    success: false,
                    error: `${dateStr} tarihinde işletme kapalıdır (Haftalık Çalışma Saatleri).`
                };
            }
        }

        // --- AVAILABILITY CHECK ---
        const availability = await checkInstructorAvailability(targetInstructorId, currentStartTime, currentEndTime);
        if (!availability.available) {
            const dateStr = currentStartTime.toLocaleDateString('tr-TR');
            return {
                success: false,
                error: data.recurring_weeks > 1
                    ? `${dateStr} tarihindeki ders için çakışma: ${availability.reason}`
                    : availability.reason
            };
        }

        // 1. Prepare Session Data
        // We need the ID before inserting appointments, so we might need single inserts or a procedure.
        // Supabase/Postgres allows `insert().select()` to get IDs back.
        // But for bulk recursion it's tricky.
        // Let's do a loop with await for now to ensure we get IDs. It's safer.

        const { data: session, error: sessionError } = await supabase
            .from('class_sessions')
            .insert({
                organization_id: userData.organization_id,
                instructor_id: targetInstructorId,
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
                    staff_id: targetInstructorId,
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
