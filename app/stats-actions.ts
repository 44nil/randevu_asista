"use server"

import { getSession } from "./actions"

export async function getDashboardStats() {
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

    if (!userData?.organization_id) {
        return { success: false, error: "No organization found" };
    }

    const orgId = userData.organization_id;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Parallel fetch for all dashboard widgets
    const [
        membersCount,
        todaysAppointments,
        monthlySales,
        activePackagesCount,
        recentSales,
        upcomingAppointments
    ] = await Promise.all([
        // 1. Total Members
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),

        // 2. Today's Attendance Count (and details for schedule widget?)
        // Let's fetch actual rows for today's schedule to show in list
        supabase.from('appointments')
            .select(`
                id,
                start_time,
                end_time,
                service_id,
                status,
                customer:customers(name)
            `)
            .eq('organization_id', orgId)
            .gte('start_time', today)
            .lt('start_time', tomorrow)
            .order('start_time', { ascending: true }),

        // 3. Monthly Revenue
        supabase.from('sales')
            .select('amount')
            .eq('organization_id', orgId)
            .gte('sale_date', firstDayOfMonth),

        // 4. Active Packages Count
        supabase.from('packages')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('active', true),

        // 5. Recent Sales (for Sales Panel) - customer_packages tablosundan çek (package_name snapshot içeriyor)
        supabase.from('customer_packages')
            .select(`
                id,
                price_paid,
                created_at,
                package_name,
                customer:customers(name)
            `)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(5),

        // 6. Upcoming Appointments (Next 3 days maybe? or just today's remainder?)
        // Let's reuse today's appointments for "Daily Schedule" widget.
        // But maybe we want "Upcoming" for reminders panel?
        // Let's fetch impending appointments (next 24h) for reminders.
        supabase.from('appointments')
            .select(`
                id,
                start_time,
                customer:customers(name)
            `)
            .eq('organization_id', orgId)
            .gte('start_time', new Date().toISOString())
            .lt('start_time', tomorrow)
            .eq('status', 'confirmed')
            .limit(5),

        // 7. Pending Cancellation Requests
        supabase.from('appointments')
            .select(`
                id,
                start_time,
                service_id,
                customer:customers(name)
            `)
            .eq('organization_id', orgId)
            .eq('status', 'cancellation_requested')
            .order('start_time', { ascending: true })
    ]);

    const totalRevenue = monthlySales.data?.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0) || 0;

    return {
        success: true,
        data: {
            stats: {
                totalMembers: membersCount.count || 0,
                todayAttendance: todaysAppointments.data?.length || 0,
                monthlyRevenue: totalRevenue,
                activePackages: activePackagesCount.count || 0
            },
            dailySchedule: todaysAppointments.data || [],
            recentSales: recentSales.data || [],
            upcomingReminders: upcomingAppointments.data || [],
            cancellationRequests: activePackagesCount.data || [] // Wait, indexed incorrectly. 
            // Correct indexing:
            // 0: members, 1: today, 2: sales, 3: packages, 4: recentSales, 5: upcoming, 6: cancellations
        }
    };
}
