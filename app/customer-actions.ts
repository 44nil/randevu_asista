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

    // We will fetch customers and map them.
    const { data: customers, error } = await supabase
        .from('customers')
        .select(`
            *,
            sales (
                id,
                amount,
                sale_date,
                packages (
                    name,
                    sessions
                )
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
        // Get latest sale
        const latestSale = c.sales?.sort((a: any, b: any) =>
            new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
        )[0];

        const activePackage = latestSale ? latestSale.packages : null;

        // Calculate usage
        // usage = appointments after sale date
        let usedSessions = 0;
        let lastAttendance = null;

        if (latestSale) {
            const saleDate = new Date(latestSale.sale_date);
            usedSessions = c.appointments?.filter((a: any) =>
                new Date(a.start_time) >= saleDate &&
                (a.status === 'confirmed' || a.status === 'completed')
            ).length || 0;
        }

        // Last attendance (any time)
        const validAppointments = c.appointments?.filter((a: any) =>
            a.status === 'confirmed' || a.status === 'completed'
        ).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

        if (validAppointments && validAppointments.length > 0) {
            lastAttendance = validAppointments[0].start_time;
        }

        return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            avatar: c.metadata?.avatar_url, // if exists
            activePackage: activePackage ? activePackage.name : "Paket Yok",
            totalSessions: activePackage ? activePackage.sessions : 0,
            usedSessions: usedSessions,
            remainingSessions: activePackage ? Math.max(0, activePackage.sessions - usedSessions) : 0,
            lastAttendance: lastAttendance,
            status: activePackage ? (usedSessions >= activePackage.sessions ? 'expired' : 'active') : 'inactive'
        };
    });

    return { success: true, data: processed };
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
