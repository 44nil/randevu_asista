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

    const { data: user } = await supabase.from('users').select('organization_id').eq('clerk_id', userId).single();
    if (!user) return { success: false, error: "No org" };

    // Calculate Date Range
    const now = new Date();
    let startDate = new Date();

    if (period === 'month') {
        // Last 6 months
        startDate.setMonth(now.getMonth() - 5);
        startDate.setDate(1);
    } else {
        // Last 12 months (or this year)
        startDate.setFullYear(now.getFullYear() - 1);
    }

    const { data: sales, error } = await supabase
        .from('sales')
        .select('amount, sale_date')
        .eq('organization_id', user.organization_id)
        .gte('sale_date', startDate.toISOString())
        .order('sale_date', { ascending: true });

    if (error) return { success: false, error: error.message };

    // Group by Month
    // Format: "Jan 2024", "Feb 2024"
    const groupedData: Record<string, number> = {};

    // Initialize months to 0 to show gaps
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const key = d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' }); // e.g. "Ocak 2025"
        groupedData[key] = 0;
    }
    // Need to reverse keys or sort later. Object keys order isn't guaranteed but usually insertion order works in modern JS for simple string.
    // Better to use array for chart.

    // Let's build a sparse array map
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const key = d.toLocaleString('tr-TR', { month: 'short' }); // "Oca"
        chartData.push({ name: key, value: 0, fullDate: d }); // value to be filled
    }

    sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        const name = date.toLocaleString('tr-TR', { month: 'short' });
        // Find in chartData
        // Note: This matches "Jan" of any year if we don't check year. 
        // For simpler logic in last 6 months, matching Month Name is risky if we span across same month.
        // Better to match Month Index or YYYY-MM
        const monthIndex = date.getMonth();
        const year = date.getFullYear();

        // Find matching item in chartData using direct date comparison could be safer but let's stick to approximate for MVP
        const target = chartData.find(d => d.fullDate.getMonth() === monthIndex && d.fullDate.getFullYear() === year);
        if (target) {
            target.value += Number(sale.amount);
        }
    });

    return {
        success: true,
        data: chartData.map(d => ({ name: d.name, value: d.value }))
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

    const { data: user } = await supabase.from('users').select('organization_id').eq('clerk_id', userId).single();

    // Fetch appointments grouped by staff
    // Since Supabase doesn't support complex "GROUP BY" with count easily via JS client without RPC,
    // we fetch raw data and aggregate in JS (assuming reasonable scale for MVP).
    // Or we use .select('staff_id, count', { count: 'exact', head: false })? No, that counts total.

    // Fetch all completed appointments
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            end_time,
            status,
            staff:users(full_name, id)
        `)
        .eq('organization_id', user.organization_id)
        .eq('status', 'completed'); // Only count completed classes

    if (error) return { success: false, error: error.message };

    const stats: Record<string, { name: string, classes: number, hours: number }> = {};

    appointments.forEach(app => {
        // Safe check for staff
        const staffName = Array.isArray(app.staff) ? app.staff[0]?.full_name : app.staff?.full_name;
        const staffId = Array.isArray(app.staff) ? app.staff[0]?.id : app.staff?.id;

        if (!staffId || !staffName) return; // Skip if no staff assigned

        if (!stats[staffId]) {
            stats[staffId] = { name: staffName, classes: 0, hours: 0 };
        }

        stats[staffId].classes += 1;

        // Calculate hours
        const start = new Date(app.start_time);
        const end = new Date(app.end_time);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Hours
        stats[staffId].hours += duration;
    });

    return {
        success: true,
        data: Object.values(stats)
    };
}
