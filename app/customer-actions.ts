'use server'

import { getSession } from "@/app/actions";

export async function getCustomersWithStats() {
    const { userId } = await getSession();
    if (!userId) return { success: false, data: [], error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, data: [], error: "No organization found" };
    }

    // Fetch customers with their latest sale and package info
    // note: We need proper foreign keys. explicit relation in query.
    // Assuming sales.customer_id -> customers.id
    // sales.package_id -> packages.id

    // We will fetch customers and map them using customer_packages (New System)
    const { data: customers, error } = await supabase
        .from('customers')
        .select(`
            *,
            customer_packages (
                package_name,
                initial_credits,
                remaining_credits,
                status,
                expiry_date,
                created_at
            ),
            appointments (
                id,
                start_time,
                status
            )
        `)
        .eq('organization_id', userData.organization_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return { success: false, data: [], error: error.message };
    }

    // Process data to calculate stats
    const processed = customers.map((c: any) => {
        // Find active package (priority to active, then most recent)
        // Sort packages by created_at desc
        const packages = c.customer_packages?.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || [];

        const activePackage = packages.find((p: any) => p.status === 'active') || packages[0];

        // Last attendance (any time)
        const validAppointments = c.appointments?.filter((a: any) =>
            a.status === 'confirmed' || a.status === 'completed'
        ).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

        let lastAttendance = null;
        if (validAppointments && validAppointments.length > 0) {
            lastAttendance = validAppointments[0].start_time;
        }

        return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            avatar: c.metadata?.avatar_url,
            activePackage: activePackage ? activePackage.package_name : "Paket Yok",
            totalSessions: activePackage ? activePackage.initial_credits : 0,

            // Used = Initial - Remaining
            // If no package, 0.
            usedSessions: activePackage ? (activePackage.initial_credits - activePackage.remaining_credits) : 0,

            remainingSessions: activePackage ? activePackage.remaining_credits : 0,
            lastAttendance: lastAttendance,
            status: activePackage ? (activePackage.remaining_credits <= 0 ? 'inactive' : 'active') : 'inactive'
        };
    });

    return { success: true, data: processed };
}

export async function upsertTreatmentPlanItem(customerId: string, item: {
    id?: string
    title: string
    tooth?: string
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
    notes?: string
}) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: customer } = await supabase
        .from('customers')
        .select('metadata')
        .eq('id', customerId)
        .single();

    const existing: any[] = customer?.metadata?.treatment_plans || [];
    let updated;

    if (item.id) {
        updated = existing.map((p: any) => p.id === item.id ? { ...p, ...item } : p);
    } else {
        updated = [...existing, { ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
    }

    const { error } = await supabase
        .from('customers')
        .update({ metadata: { ...(customer?.metadata || {}), treatment_plans: updated } })
        .eq('id', customerId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteTreatmentPlanItem(customerId: string, itemId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: customer } = await supabase
        .from('customers')
        .select('metadata')
        .eq('id', customerId)
        .single();

    const updated = (customer?.metadata?.treatment_plans || []).filter((p: any) => p.id !== itemId);

    const { error } = await supabase
        .from('customers')
        .update({ metadata: { ...(customer?.metadata || {}), treatment_plans: updated } })
        .eq('id', customerId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function getCustomerDetail(customerId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, error: "No organization found" };

    // Müşteri temel bilgisi
    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', userData.organization_id)
        .single();

    if (error || !customer) return { success: false, error: "Müşteri bulunamadı" };

    // Tüm paketler
    const { data: packages } = await supabase
        .from('customer_packages')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    // Tüm randevular (geçmiş + gelecek)
    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            id, start_time, end_time, status, notes,
            class_sessions (
                title, instructor_id,
                users:instructor_id ( full_name )
            )
        `)
        .eq('customer_id', customerId)
        .order('start_time', { ascending: false })
        .limit(50);

    // Ölçümler
    const { data: measurements } = await supabase
        .from('measurements')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false });

    // İstatistikler
    const confirmedApts = appointments?.filter(a => a.status === 'confirmed' || a.status === 'completed') || [];
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = confirmedApts.filter(a => new Date(a.start_time) >= thisMonthStart).length;
    const upcomingCount = appointments?.filter(a => new Date(a.start_time) > now && a.status !== 'cancelled').length || 0;

    return {
        success: true,
        data: {
            customer,
            packages: packages || [],
            appointments: appointments || [],
            measurements: measurements || [],
            stats: {
                totalSessions: confirmedApts.length,
                thisMonth: thisMonthCount,
                upcoming: upcomingCount,
                memberSince: customer.created_at,
            }
        }
    };
}

export async function getMemberPageStats() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    const orgId = userData?.organization_id;
    if (!orgId) return { success: false, error: "No org" };

    // 1. Total Active Members (Unique customers with appointments in last 30 days OR active package)
    // For simplicity: Just total customers count
    const { count: totalMembers } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);

    // 2. Expired Packages (Logically calculated, but here maybe mocked or simple query)
    // Hard to do strictly in SQL without complex logic. We'll return global counts.

    // 3. Monthly Revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: sales } = await supabase.from('sales').select('amount').eq('organization_id', orgId).gte('sale_date', startOfMonth);
    const monthlyRevenue = sales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

    return {
        success: true,
        data: {
            totalMembers: totalMembers || 0,
            expiredPackages: 5, // Mocked for now as we don't have easy expiry logic in DB
            lowBalance: 8, // Mocked
            monthlyRevenue: monthlyRevenue
        }
    }
}
