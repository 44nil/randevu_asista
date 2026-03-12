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
    title?: string // Added
    customer_ids?: string[]
    instructor_id?: string
    appointment_date: string
    duration_minutes: number
    type: string
    recurring_weeks: number
    capacity?: number
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
    if (data.instructor_id && data.instructor_id !== userData.id) {
        // If it looks like a Clerk ID (user_...), we need to find the DB UUID
        if (data.instructor_id.startsWith('user_')) {
            const { data: targetUser } = await supabase
                .from('users')
                .select('id')
                .eq('clerk_id', data.instructor_id)
                .single();

            if (targetUser) {
                targetInstructorId = targetUser.id;
            }
        } else {
            // It's already a UUID (hopefully)
            targetInstructorId = data.instructor_id;
        }
    }

    const baseStartTime = new Date(data.appointment_date);
    const defaultCapacity = data.capacity || (data.type === 'private' ? 1 : 3);
    const recurringCount = data.recurring_weeks || 1;

    const sessionInserts = [];
    const appointmentInserts = [];

    // Loop for Weeks (Recurrence)
    for (let i = 0; i < recurringCount; i++) {
        const currentStartTime = new Date(baseStartTime);
        currentStartTime.setDate(baseStartTime.getDate() + (i * 7));

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
                    error: `${dateStr} tarihinde işletme kapalıdır.`
                };
            }
        }

        // --- AVAILABILITY CHECK ---
        const availability = await checkInstructorAvailability(targetInstructorId, currentStartTime, currentEndTime);
        if (!availability.available) {
            const dateStr = currentStartTime.toLocaleDateString('tr-TR');
            return {
                success: false,
                error: recurringCount > 1
                    ? `${dateStr} tarihindeki ders için çakışma: ${availability.reason}`
                    : availability.reason
            };
        }

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

export async function updateClassSession(sessionId: string, data: {
    instructor_id?: string
    start_time?: string
    duration_minutes?: number
    type?: string
    capacity?: number
}) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { data: userData } = await supabaseAdmin
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, error: "No organization found" };

    // Resolve instructor UUID if Clerk ID
    let instructorId = data.instructor_id;
    if (instructorId?.startsWith('user_')) {
        const { data: u } = await supabaseAdmin.from('users').select('id').eq('clerk_id', instructorId).single();
        if (u) instructorId = u.id;
    }

    const updatePayload: any = { service_id: data.type, capacity: data.capacity };
    if (instructorId) updatePayload.instructor_id = instructorId;

    if (data.start_time && data.duration_minutes) {
        const start = new Date(data.start_time);
        const end = new Date(start.getTime() + data.duration_minutes * 60000);
        updatePayload.start_time = start.toISOString();
        updatePayload.end_time = end.toISOString();
    }

    const { error } = await supabaseAdmin
        .from('class_sessions')
        .update(updatePayload)
        .eq('id', sessionId)
        .eq('organization_id', userData.organization_id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/program');
    revalidatePath('/reservations');
    return { success: true };
}

export async function deleteClassSession(sessionId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { data: userData } = await supabaseAdmin
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, error: "No organization found" };

    // Cancel all appointments in session first
    await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('session_id', sessionId);

    const { error } = await supabaseAdmin
        .from('class_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('organization_id', userData.organization_id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/program');
    revalidatePath('/reservations');    return { success: true };
}