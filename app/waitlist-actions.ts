"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "./actions"

// ============================================================================
// WAITLIST & CAPACITY MANAGEMENT
// ============================================================================

/**
 * Check if a class session has available capacity
 */
export async function checkSessionCapacity(sessionId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get session capacity
    const { data: session, error: sessionError } = await supabase
        .from('class_sessions')
        .select('capacity')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
        return { success: false, error: "Session not found" };
    }

    // Count current bookings
    const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .in('status', ['confirmed', 'pending']);

    if (countError) {
        return { success: false, error: "Failed to check capacity" };
    }

    const currentBookings = count || 0;
    const available = session.capacity - currentBookings;
    const isFull = available <= 0;

    return {
        success: true,
        data: {
            capacity: session.capacity,
            currentBookings,
            available,
            isFull
        }
    };
}

/**
 * Add customer to waitlist
 */
export async function addToWaitlist(sessionId: string, customerId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user's organization
    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, error: "No organization found" };
    }

    // Check if already on waitlist
    const { data: existing } = await supabase
        .from('waitlist')
        .select('id, position')
        .eq('session_id', sessionId)
        .eq('customer_id', customerId)
        .single();

    if (existing) {
        return {
            success: false,
            error: "Already on waitlist",
            position: existing.position
        };
    }

    // Get next position
    const { data: nextPos } = await supabase
        .rpc('get_next_waitlist_position', { p_session_id: sessionId });

    const position = nextPos || 1;

    // Add to waitlist
    const { data, error } = await supabase
        .from('waitlist')
        .insert({
            session_id: sessionId,
            customer_id: customerId,
            organization_id: userData.organization_id,
            position
        })
        .select()
        .single();

    if (error) {
        console.error("Waitlist add error:", error);
        return { success: false, error: "Failed to join waitlist" };
    }

    revalidatePath('/reservations');
    return { success: true, data: { position } };
}

/**
 * Remove customer from waitlist
 */
export async function removeFromWaitlist(waitlistId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', waitlistId);

    if (error) {
        console.error("Waitlist remove error:", error);
        return { success: false, error: "Failed to leave waitlist" };
    }

    revalidatePath('/reservations');
    return { success: true };
}

/**
 * Get waitlist for a session
 */
export async function getWaitlist(sessionId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase
        .from('waitlist')
        .select(`
            id,
            position,
            created_at,
            notified,
            customer:customer_id (
                id,
                name,
                email,
                phone
            )
        `)
        .eq('session_id', sessionId)
        .order('position', { ascending: true });

    if (error) {
        console.error("Get waitlist error:", error);
        return { success: false, error: "Failed to get waitlist" };
    }

    return { success: true, data: data || [] };
}

/**
 * Move first person from waitlist to confirmed appointment
 * Called when someone cancels their reservation
 */
export async function promoteFromWaitlist(sessionId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user's organization
    const { data: userData } = await supabase
        .from('users')
        .select('organization_id, id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, error: "No organization found" };
    }

    // Get first person on waitlist
    const { data: waitlistEntry, error: waitlistError } = await supabase
        .from('waitlist')
        .select('id, customer_id')
        .eq('session_id', sessionId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

    if (waitlistError || !waitlistEntry) {
        return { success: false, error: "No one on waitlist" };
    }

    // Get session details
    const { data: session } = await supabase
        .from('class_sessions')
        .select('service_id, start_time, end_time')
        .eq('id', sessionId)
        .single();

    if (!session) {
        return { success: false, error: "Session not found" };
    }

    // Create appointment
    const { error: apptError } = await supabase
        .from('appointments')
        .insert({
            organization_id: userData.organization_id,
            customer_id: waitlistEntry.customer_id,
            staff_id: userData.id,
            service_id: session.service_id,
            start_time: session.start_time,
            end_time: session.end_time,
            status: 'confirmed',
            session_id: sessionId
        });

    if (apptError) {
        console.error("Promote appointment error:", apptError);
        return { success: false, error: "Failed to create appointment" };
    }

    // Remove from waitlist
    await supabase
        .from('waitlist')
        .delete()
        .eq('id', waitlistEntry.id);

    revalidatePath('/reservations');
    revalidatePath('/program');

    return { success: true, customerId: waitlistEntry.customer_id };
}
