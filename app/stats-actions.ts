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

    const [
        membersCount,
        todaysAppointments,
        monthlyPackages,
        activePackagesCount,
        recentSales,
        upcomingAppointments,
        cancelledToday,
    ] = await Promise.all([
        // 1. Toplam müşteri
        supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId),

        // 2. Bugünkü randevular (takvim widgeti için)
        supabase
            .from('appointments')
            .select(`id, start_time, end_time, status, customer:customers(name)`)
            .eq('organization_id', orgId)
            .gte('start_time', today)
            .lt('start_time', tomorrow)
            .order('start_time', { ascending: true }),

        // 3. Aylık ciro — customer_packages.price_paid
        supabase
            .from('customer_packages')
            .select('price_paid')
            .eq('organization_id', orgId)
            .gte('created_at', firstDayOfMonth),

        // 4. Aktif paket sayısı — customer_packages.status
        supabase
            .from('customer_packages')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'active'),

        // 5. Son satışlar (satış paneli için)
        supabase
            .from('customer_packages')
            .select(`id, price_paid, created_at, package_name, customer:customers(name)`)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(5),

        // 6. Yaklaşan randevular (hatırlatıcı paneli için)
        supabase
            .from('appointments')
            .select(`id, start_time, customer:customers(name)`)
            .eq('organization_id', orgId)
            .gte('start_time', new Date().toISOString())
            .lt('start_time', tomorrow)
            .eq('status', 'confirmed')
            .limit(5),

        // 7. Bugün iptal edilenler
        supabase
            .from('appointments')
            .select(`id, start_time, customer:customers(name)`)
            .eq('organization_id', orgId)
            .gte('start_time', today)
            .lt('start_time', tomorrow)
            .eq('status', 'cancelled'),
    ]);

    const totalRevenue = monthlyPackages.data?.reduce(
        (sum, pkg) => sum + (Number(pkg.price_paid) || 0), 0
    ) || 0;

    return {
        success: true,
        data: {
            stats: {
                totalMembers: membersCount.count || 0,
                todayAttendance: todaysAppointments.data?.length || 0,
                monthlyRevenue: totalRevenue,
                activePackages: activePackagesCount.count || 0,
            },
            dailySchedule: todaysAppointments.data || [],
            recentSales: recentSales.data || [],
            upcomingReminders: upcomingAppointments.data || [],
            cancellationRequests: cancelledToday.data || [],
        }
    };
}
