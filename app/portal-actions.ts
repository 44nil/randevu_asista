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
        // Just in case, though middleware might handle this
        return { success: false, error: "Not a customer account" };
    }

    // 2. Find the Customer Record linked to this User
    // Assumption: 'customers' table has an email that matches the user's email
    // OR we should ideally have a user_id foreign key in customers table. 
    // For MVP, matching by Email within the organization is a common pattern if they aren't strictly linked keys yet.
    // Let's try to match by email + org_id

    const { data: customerRecord, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('organization_id', user.organization_id)
        .eq('email', user.email)
        .single();

    if (!customerRecord) {
        // Fallback: If no customer record found (maybe created via dashboard without email sync), return empty state
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

    const [activePackageRes, upcomingClassesRes, salesRes] = await Promise.all([
        // Active Package: Look for sales that are recent and link to packages
        // We'll take the most recent sale as "Active Package" for MVP logic
        supabase.from('sales')
            .select(`
                id,
                sale_date,
                package:packages(*)
            `)
            .eq('customer_id', customerRecord.id)
            .order('sale_date', { ascending: false })
            .limit(1)
            .single(),

        // Upcoming Classes: Confirmed appointments starting after now
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
            .limit(5), // Fetch next 5 classes

        // Sales/Usage stats (Total attendance count)
        supabase.from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerRecord.id)
            .eq('status', 'completed')
    ]);

    // Calculate usage for package
    let packageUsage = 0;
    if (activePackageRes.data) {
        // Count appointments AFTER the sale date of this package
        const usageRes = await supabase.from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerRecord.id)
            .gte('created_at', activePackageRes.data.sale_date)
            .neq('status', 'cancelled');
        packageUsage = usageRes.count || 0;
    }

    const upcomingClasses = upcomingClassesRes.data || [];

    return {
        success: true,
        data: {
            user: user,
            activePackage: activePackageRes.data ? {
                ...activePackageRes.data.package,
                saleDate: activePackageRes.data.sale_date,
                usedSessions: packageUsage
            } : null,
            nextClass: upcomingClasses.length > 0 ? upcomingClasses[0] : null,
            upcomingClasses: upcomingClasses,
            stats: {
                attended: salesRes.count || 0,
                // Mock calorie calculation: 450 cal per session average
                calorie: (salesRes.count || 0) * 450
            }
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
    // We need: Session Details + Booked Count + If Current User Booked
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

    // Transform data to match UI expectations + Add stats
    const formattedSessions = sessions?.map(session => {
        const activeAppointments = session.appointments.filter((a: any) => a.status !== 'cancelled');
        const bookedCount = activeAppointments.length;
        const userAppointment = currentCustomerId ? activeAppointments.find((a: any) => a.customer_id === currentCustomerId) : null;
        const isBookedByMe = !!userAppointment;

        return {
            id: session.id, // This is SESSION ID now
            start_time: session.start_time,
            end_time: session.end_time,
            service_id: session.service_id,
            totalSlots: session.capacity,
            bookedSlots: bookedCount,
            isBookedByMe: isBookedByMe,
            myAppointmentId: userAppointment?.id, // The actual appointment ID for cancellation
            staff: session.staff,
            // Legacy field for UI compatibility (customer array)
            customer: isBookedByMe ? [{ id: currentCustomerId }] : [],
            availableSlots: Math.max(0, session.capacity - bookedCount)
        };
    });

    return { success: true, data: formattedSessions, currentCustomerId };
}

export async function bookAppointment(
    classDetails: {
        session_id?: string, // NEW: Required for new logic
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
        // Auto-create Logic (Simplification: Allow here)
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
    // If session_id provided (Old appointments might not have it, but new flow uses it)
    if (classDetails.session_id) {
        const { data: sessionData } = await supabase
            .from('class_sessions')
            .select('capacity, appointments(count)') // Subquery count
            .eq('id', classDetails.session_id)
            .single();

        if (sessionData) {
            // Need accurate count of confirmed/active
            const { count } = await supabase.from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('session_id', classDetails.session_id)
                .neq('status', 'cancelled');

            if ((count || 0) >= sessionData.capacity) {
                return { success: false, error: "Ders kontenjanı dolu." };
            }
        }
    }

    // 3. LOGIC: Credit Check (New Task)
    // Check if user has active package AND usage < package limit
    const { data: activePackages } = await supabase.from('sales')
        .select(`
            id, sale_date, package:packages(sessions)
        `)
        .eq('customer_id', customer.id)
        .order('sale_date', { ascending: false });

    // Calculate total credits (Sum of all package sessions)
    const totalCredits = activePackages?.reduce((sum, sale: any) => {
        const pkg = Array.isArray(sale.package) ? sale.package[0] : sale.package;
        return sum + (pkg?.sessions || 0);
    }, 0) || 0;

    // Calculate total usage
    const { count: usedCredits } = await supabase.from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customer.id)
        .neq('status', 'cancelled');

    const remaining = totalCredits - (usedCredits || 0);

    if (remaining <= 0) {
        return { success: false, error: "Hakkınız kalmadı. Lütfen yeni paket satın alınız." };
    }

    // 4. Booking
    // Find staff if missing
    let staffId = classDetails.staff_id;
    if (!staffId && classDetails.session_id) {
        // Get from session
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
            session_id: classDetails.session_id, // Link to session
            status: 'confirmed'
        });

    if (insertError) {
        console.error("Booking error:", insertError);
        // Clean error message for user
        if (insertError.message.includes('violates foreign key')) return { success: false, error: "Sistem hatası: Oturum bulunamadı." };
        return { success: false, error: "Randevu oluşturulamadı." };
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

    // Parallel Fetch: History, Packages, Stats
    const [history, packages, stats] = await Promise.all([
        // 1. Appointment History (Past & Future)
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

        // 2. Active Packages (From Sales)
        supabase.from('sales')
            .select(`
                id,
                amount,
                sale_date,
                package:packages(*)
            `)
            .eq('customer_id', customer.id)
            .order('sale_date', { ascending: false }),

        // 3. Completed Sessions Count
        supabase.from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customer.id)
            .eq('status', 'completed')
    ]);

    // Calculate aggregated stats
    const totalSessionsCompleted = stats.count || 0;

    // Calculate Credits (Simplified logic based on packages)
    // Assume each package adds N sessions. We subtract used sessions (completed/confirmed).
    // This logic duplicates 'activePackage' logic but for all.
    // Ideally we should have a 'balance' column or complex calculation.
    // For MVP: Sum of all package sessions - Sum of all non-cancelled appointments.

    const totalPurchasedSessions = packages.data?.reduce((acc, sale) => acc + (sale.package?.sessions || 0), 0) || 0;
    const totalUsedSessions = history.data?.filter(a => a.status !== 'cancelled').length || 0;
    const remainingCredits = Math.max(0, totalPurchasedSessions - totalUsedSessions);

    return {
        success: true,
        data: {
            history: history.data || [],
            packages: packages.data || [],
            stats: {
                totalCredits: remainingCredits,
                activePackages: packages.data?.length || 0, // Should filter by expiry date ideally
                completedSessions: totalSessionsCompleted
            }
        }
    };
}

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
        // Check for common constraint error
        if (error.message?.includes('check constraint') || error.code === '23514') {
            return { success: false, error: "Sistem güncellemesi gerekiyor (Status Check). Lütfen yöneticiye bildiriniz." };
        }
        // Check for missing column error (if migration wasn't run)
        if (error.message?.includes('cancellation_reason')) {
            return { success: false, error: "Sistem güncelleniyor. Lütfen yöneticiye 'cancellation_reason' kolonunu eklemesini söyleyiniz." };
        }
        return { success: false, error: "Talep gönderilemedi. Lütfen daha sonra tekrar deneyiniz." };
    }

    return { success: true };
}

export async function cancelAppointment(appointmentId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get User Org
    const { data: user } = await supabase.from('users').select('organization_id, email').eq('clerk_id', userId).single();
    if (!user) return { success: false, error: "User not found" };

    // 2. Verify Ownership (Security)
    // We need to make sure the appointment belongs to a customer that belongs to this user.
    // Or simpler: match Organization ID and Appointment ID. 
    // Ideally we also check if the customer email matches user email.

    // Find customer for this user
    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('email', user.email)
        .single();

    if (!customer) return { success: false, error: "Customer record not found." };

    // 3. Update Status
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('customer_id', customer.id) // Security check
        .eq('organization_id', user.organization_id); // Security check

    if (error) {
        console.error("Cancellation error:", error);
        return { success: false, error: "İptal işlemi başarısız oldu." };
    }

    return { success: true };
}
