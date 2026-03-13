"use server"

import { getSession } from "./actions"

export async function getRevenueStats(period: 'month' | 'year' = 'month') {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!user) return { success: false, error: "No org" };

    const now = new Date();
    const monthCount = period === 'year' ? 12 : 6;
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);

    // Gelir: customer_packages.price_paid (sales tablosu yok)
    const { data: packages, error } = await supabase
        .from('customer_packages')
        .select('price_paid, created_at')
        .eq('organization_id', user.organization_id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

    if (error) return { success: false, error: error.message };

    // Son N ayı oluştur, sıfırla başlat
    const chartData: { name: string; value: number; month: number; year: number }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartData.push({
            name: d.toLocaleString('tr-TR', { month: 'short' }),
            value: 0,
            month: d.getMonth(),
            year: d.getFullYear(),
        });
    }

    packages?.forEach(pkg => {
        const d = new Date(pkg.created_at);
        const target = chartData.find(c => c.month === d.getMonth() && c.year === d.getFullYear());
        if (target) target.value += Number(pkg.price_paid) || 0;
    });

    return {
        success: true,
        data: chartData.map(d => ({ name: d.name, value: d.value }))
    };
}

export async function getAppointmentStats() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!user) return { success: false, error: "No org" };

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('start_time, status')
        .eq('organization_id', user.organization_id)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: true });

    if (error) return { success: false, error: error.message };

    const chartData: { name: string; completed: number; cancelled: number; month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartData.push({
            name: d.toLocaleString('tr-TR', { month: 'short' }),
            completed: 0,
            cancelled: 0,
            month: d.getMonth(),
            year: d.getFullYear(),
        });
    }

    appointments?.forEach(apt => {
        const d = new Date(apt.start_time);
        const target = chartData.find(c => c.month === d.getMonth() && c.year === d.getFullYear());
        if (!target) return;
        if (apt.status === 'completed') target.completed++;
        if (apt.status === 'cancelled') target.cancelled++;
    });

    return {
        success: true,
        data: chartData.map(d => ({ name: d.name, completed: d.completed, cancelled: d.cancelled }))
    };
}

export async function getInstructorStats() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!user) return { success: false, error: "User not found" };

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`id, start_time, end_time, status, staff:users(full_name, id)`)
        .eq('organization_id', user.organization_id)
        .eq('status', 'completed');

    if (error) return { success: false, error: error.message };

    const stats: Record<string, { name: string; classes: number; hours: number }> = {};

    appointments?.forEach(app => {
        const staffRel = app.staff as any;
        const staffName = Array.isArray(staffRel) ? staffRel[0]?.full_name : staffRel?.full_name;
        const staffId = Array.isArray(staffRel) ? staffRel[0]?.id : staffRel?.id;
        if (!staffId || !staffName) return;

        if (!stats[staffId]) stats[staffId] = { name: staffName, classes: 0, hours: 0 };
        stats[staffId].classes += 1;

        const start = new Date(app.start_time);
        const end = new Date(app.end_time);
        stats[staffId].hours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    });

    return {
        success: true,
        data: Object.values(stats).sort((a, b) => b.classes - a.classes)
    };
}

export async function getOverallStats() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!user) return { success: false, error: "No org" };

    const orgId = user.organization_id;
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const firstDayOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();

    const [thisMonthPkgs, lastMonthPkgs, totalApts, thisMonthApts, cancelledApts, totalCustomers] = await Promise.all([
        supabase.from('customer_packages').select('price_paid').eq('organization_id', orgId).gte('created_at', firstDayOfMonth),
        supabase.from('customer_packages').select('price_paid').eq('organization_id', orgId).gte('created_at', firstDayOfLastMonth).lt('created_at', firstDayOfMonth),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('start_time', firstDayOfMonth),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'cancelled').gte('start_time', firstDayOfMonth),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    ]);

    const thisMonthRevenue = thisMonthPkgs.data?.reduce((s, p) => s + (Number(p.price_paid) || 0), 0) || 0;
    const lastMonthRevenue = lastMonthPkgs.data?.reduce((s, p) => s + (Number(p.price_paid) || 0), 0) || 0;
    const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;

    const thisMonthTotal = thisMonthApts.count || 0;
    const cancelledCount = cancelledApts.count || 0;
    const cancellationRate = thisMonthTotal > 0 ? Math.round((cancelledCount / thisMonthTotal) * 100) : 0;

    return {
        success: true,
        data: {
            thisMonthRevenue,
            revenueGrowth,
            totalCompletedApts: totalApts.count || 0,
            thisMonthApts: thisMonthTotal,
            cancellationRate,
            totalCustomers: totalCustomers.count || 0,
        }
    };
}
