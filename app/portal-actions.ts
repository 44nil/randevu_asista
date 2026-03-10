"use server"

import { getSession } from "./actions"

export async function getCustomerDashboardData() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get User Role & Organization
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('role, organization_id, email, full_name')
        .eq('clerk_id', userId)
        .single();

    if (userError || !user) {
        return { success: false, error: "User profile not found" };
    }

    if (user.role !== 'customer') {
        return { success: false, error: "Not a customer account" };
    }

    // 2. Find Customer Record
    const { data: customerRecord, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('organization_id', user.organization_id)
        .eq('email', user.email)
        .single();

    if (!customerRecord) {
        return {
            success: true,
            data: {
                user: user,
                activePackage: null,
                nextClass: null,
                stats: { attended: 0, calorie: 0 }
            }
        }
    }

    // 3. Parallel Fetch for Dashboard Data
    const today = new Date().toISOString();

    const [activePackageRes, upcomingClassesRes, historyRes, recentlyCompletedRes] = await Promise.all([
        // Active Package: Find valid package with credits
        supabase.from('customer_packages')
            .select('*')
            .eq('customer_id', customerRecord.id)
            .eq('status', 'active')
            .gt('remaining_credits', 0)
            .order('expiry_date', { ascending: true }) // Expiring soonest first
            .limit(1)
            .limit(1)
            .single(),

        // Upcoming Classes
        supabase.from('appointments')
            .select(`
                id,
                start_time,
                end_time,
                status,
                service_id,
                staff:users(full_name)
            `)
            .eq('customer_id', customerRecord.id)
            .eq('status', 'confirmed')
            .gte('start_time', today)
            .order('start_time', { ascending: true })
            .limit(5),

        // History count
        supabase.from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerRecord.id)
            .eq('status', 'completed'),

        // Recently Completed (Last 3)
        supabase.from('appointments')
            .select(`
                id,
                start_time,
                status,
                service_id,
                staff:users(full_name)
            `)
            .eq('customer_id', customerRecord.id)
            .in('status', ['completed', 'confirmed'])
            .order('start_time', { ascending: false })
            .limit(3)
    ]);

    const activePackage = activePackageRes.data;
    const upcomingClasses = upcomingClassesRes.data || [];

    return {
        success: true,
        data: {
            user: user,
            activePackage: activePackage ? {
                name: activePackage.package_name,
                remainingCredits: activePackage.remaining_credits,
                totalCredits: activePackage.initial_credits,
                expiryDate: activePackage.expiry_date
            } : null,
            nextClass: upcomingClasses.length > 0 ? upcomingClasses[0] : null,
            upcomingClasses: upcomingClasses,
            stats: {
                attended: historyRes.count || 0,
                // Mock calorie: 450 per session
                calorie: (historyRes.count || 0) * 450
            },
            lastUsage: recentlyCompletedRes.data || []
        }
    };
}

// -----------------------------------------------------------------------------
// Reservation System Actions
// -----------------------------------------------------------------------------

export async function getAvailableClasses(startDate: string, endDate: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id, email')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, error: "No org found" };

    // Get current customer ID
    let currentCustomerId = null;
    const { data: cust } = await supabase.from('customers')
        .select('id')
        .eq('organization_id', userData.organization_id)
        .eq('email', userData.email)
        .single();
    currentCustomerId = cust?.id;

    // FETCH CLASS SESSIONS
    const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select(`
            id,
            start_time,
            end_time,
            service_id,
            capacity,
            staff:instructor_id(full_name, id),
            appointments(id, customer_id, status)
        `)
        .eq('organization_id', userData.organization_id)
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .order('start_time', { ascending: true });

    if (error) {
        console.error("Error fetching sessions:", error);
        return { success: false, error: error.message };
    }

    // Check waitlist status for each session if user exists
    let waitlistMap: Record<string, any> = {};
    if (currentCustomerId) {
        const { data: waitlistData } = await supabase
            .from('waitlist')
            .select('session_id, position')
            .eq('customer_id', currentCustomerId);

        if (waitlistData) {
            waitlistData.forEach(w => {
                waitlistMap[w.session_id] = w;
            });
        }
    }

    // Transform data
    const formattedSessions = sessions?.map(session => {
        const activeAppointments = session.appointments.filter((a: any) => a.status !== 'cancelled');
        const bookedCount = activeAppointments.length;
        const userAppointment = currentCustomerId ? activeAppointments.find((a: any) => a.customer_id === currentCustomerId) : null;
        const isBookedByMe = !!userAppointment;
        const isFull = bookedCount >= session.capacity;

        return {
            id: session.id,
            start_time: session.start_time,
            end_time: session.end_time,
            service_id: session.service_id,
            totalSlots: session.capacity,
            bookedSlots: bookedCount,
            availableSlots: Math.max(0, session.capacity - bookedCount),
            isFull,
            isBookedByMe: isBookedByMe,
            myAppointmentId: userAppointment?.id,
            staff: session.staff,
            customer: isBookedByMe ? [{ id: currentCustomerId }] : [],
            isOnWaitlist: !!waitlistMap[session.id],
            waitlistPosition: waitlistMap[session.id]?.position || null
        };
    });

    return { success: true, data: formattedSessions, currentCustomerId };
}

export async function bookAppointment(
    classDetails: {
        session_id?: string,
        service_id: string,
        start_time: string,
        end_time: string,
        staff_id?: string
    }
) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get User/Customer
    const { data: user } = await supabase.from('users').select('organization_id, email, full_name').eq('clerk_id', userId).single();
    if (!user) return { success: false, error: "User not found" };

    let { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .eq('organization_id', user.organization_id)
        .eq('email', user.email)
        .single();

    if (!customer) {
        // Auto-create Logic
        const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
                organization_id: user.organization_id,
                email: user.email,
                name: user.full_name || user.email.split('@')[0],
            })
            .select()
            .single();
        customer = newCustomer;
        if (!customer) return { success: false, error: "Could not create profile." };
    }

    // 2. LOGIC: Capacity Check
    if (classDetails.session_id) {
        const { data: sessionData } = await supabase
            .from('class_sessions')
            .select('capacity')
            .eq('id', classDetails.session_id)
            .single();

        if (sessionData) {
            const { count } = await supabase.from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('session_id', classDetails.session_id)
                .neq('status', 'cancelled');

            if ((count || 0) >= sessionData.capacity) {
                return { success: false, error: "Ders kontenjanı dolu." };
            }
        }
    }

    // 3. LOGIC: Credit Check (UPDATED for customer_packages)
    const { data: validPackages } = await supabase.from('customer_packages')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('status', 'active')
        .gt('remaining_credits', 0)
        .order('expiry_date', { ascending: true }) // Use oldest expiring first
        .limit(1);

    const packageToUse = validPackages && validPackages.length > 0 ? validPackages[0] : null;

    if (!packageToUse) {
        return { success: false, error: "Aktif paketiniz veya ders hakkınız bulunmamaktadır. Lütfen paket satın alınız." };
    }

    // 4. Booking
    let staffId = classDetails.staff_id;
    if (!staffId && classDetails.session_id) {
        const { data: sess } = await supabase.from('class_sessions').select('instructor_id').eq('id', classDetails.session_id).single();
        staffId = sess?.instructor_id;
    }

    const { error: insertError } = await supabase
        .from('appointments')
        .insert({
            organization_id: user.organization_id,
            customer_id: customer.id,
            service_id: classDetails.service_id,
            start_time: classDetails.start_time,
            end_time: classDetails.end_time,
            staff_id: staffId,
            session_id: classDetails.session_id,
            status: 'confirmed'
        });

    if (insertError) {
        console.error("Booking error:", insertError);
        return { success: false, error: "Randevu oluşturulamadı." };
    }

    // 5. DEDUCT CREDIT
    const { error: creditError } = await supabase
        .from('customer_packages')
        .update({ remaining_credits: packageToUse.remaining_credits - 1 })
        .eq('id', packageToUse.id);

    if (creditError) {
        console.error("Credit deduction failed but appointment booked:", creditError);
    }

    // Check if package is finished
    if (packageToUse.remaining_credits - 1 <= 0) {
        await supabase.from('customer_packages')
            .update({ status: 'completed' })
            .eq('id', packageToUse.id);
    }

    return { success: true };
}

// -----------------------------------------------------------------------------
// History & Package Actions
// -----------------------------------------------------------------------------

export async function getCustomerHistory() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get User & Customer ID
    const { data: user } = await supabase.from('users').select('organization_id, email').eq('clerk_id', userId).single();
    if (!user) return { success: false, error: "User not found" };

    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('email', user.email)
        .single();

    if (!customer) return { success: false, error: "Customer not found" };

    // Parallel Fetch
    const [history, packages, stats] = await Promise.all([
        // 1. History
        supabase.from('appointments')
            .select(`
                id,
                start_time,
                end_time,
                service_id,
                status,
                staff:users(full_name)
            `)
            .eq('customer_id', customer.id)
            .order('start_time', { ascending: false }),

        // 2. Packages (UPDATED)
        supabase.from('customer_packages')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false }),

        // 3. Stats
        supabase.from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customer.id)
            .eq('status', 'completed')
    ]);

    // Calculate Credits
    const totalRemaining = packages.data?.reduce((acc, pkg) => {
        return pkg.status === 'active' ? acc + pkg.remaining_credits : acc;
    }, 0) || 0;

    return {
        success: true,
        data: {
            history: history.data || [],
            packages: packages.data || [],
            stats: {
                totalCredits: totalRemaining,
                activePackages: packages.data?.filter(p => p.status === 'active').length || 0,
                completedSessions: stats.count || 0
            }
        }
    };
}

// Re-export cancellation functions as is (they are fine)
export async function requestCancellation(appointmentId: string, reason: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get Customer ID to verify ownership
    const { data: user } = await supabase.from('users').select('organization_id, email').eq('clerk_id', userId).single();
    if (!user) return { success: false, error: "User not found" };

    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('email', user.email)
        .single();

    if (!customer) return { success: false, error: "Customer not found" };

    // 2. Verify Appointment belongs to customer
    const { data: appointment } = await supabase
        .from('appointments')
        .select('id, status, start_time')
        .eq('id', appointmentId)
        .eq('customer_id', customer.id)
        .single();

    if (!appointment) return { success: false, error: "Appointment not found or access denied" };

    // 3. Check if it's too late to cancel (must be > 24 hours before start)
    const startTime = new Date(appointment.start_time);
    const now = new Date();
    const hoursDifference = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
        return { success: false, error: "Ders saatine 24 saatten az kaldığı için iptal talebi oluşturulamaz. Lütfen iletişime geçiniz." };
    }

    // 4. Update Status and Reason
    const { error } = await supabase
        .from('appointments')
        .update({
            status: 'cancellation_requested',
            cancellation_reason: reason
        })
        .eq('id', appointmentId);

    if (error) {
        console.error("Cancel request error:", error);
        return { success: false, error: "Talep gönderilemedi." };
    }

    return { success: true };
}

export async function cancelAppointment(appointmentId: string) {
    // This is mostly for Admin, but if customer calls it directly... 
    // Usually customers call requestCancellation.
    // Let's keep it secure.
    return { success: false, error: "Müşteriler doğrudan iptal edemez, talep oluşturmalıdır." };
}
