"use server"

import { getSession } from "./actions"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function getDashboardStats() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

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

        // 2. Bugünkü randevular — class_sessions üzerinden hekim + hizmet bilgisiyle
        supabase
            .from('class_sessions')
            .select(`
                id, start_time, end_time, service_id,
                staff:instructor_id(full_name),
                appointments(id, status, customer:customers(name))
            `)
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

    // class_sessions verisini DailySchedule'ın beklediği formata dönüştür
    const dailySchedule = (todaysAppointments.data || []).flatMap((session: any) => {
        const apts = session.appointments || []
        if (apts.length === 0) return [{
            id: session.id,
            start_time: session.start_time,
            end_time: session.end_time,
            service_id: session.service_id,
            status: 'confirmed',
            staff_name: session.staff?.full_name || null,
            customer: null,
        }]
        return apts.map((apt: any) => ({
            id: apt.id,
            start_time: session.start_time,
            end_time: session.end_time,
            service_id: session.service_id,
            status: apt.status,
            staff_name: session.staff?.full_name || null,
            customer: apt.customer,
        }))
    })

    return {
        success: true,
        data: {
            stats: {
                totalMembers: membersCount.count || 0,
                todayAttendance: dailySchedule.filter((a: any) => a.status !== 'cancelled').length,
                monthlyRevenue: totalRevenue,
                activePackages: activePackagesCount.count || 0,
            },
            dailySchedule,
            recentSales: recentSales.data || [],
            upcomingReminders: upcomingAppointments.data || [],
            cancellationRequests: cancelledToday.data || [],
        }
    };
}
