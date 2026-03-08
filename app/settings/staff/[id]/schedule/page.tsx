import { getStaffSchedule, getStaffTimeOffs, getUserProfile } from "@/app/actions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ScheduleEditor } from "./schedule-editor";
import { TimeOffEditor } from "./time-off-editor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function StaffSchedulePage({ params }: { params: Promise<{ id: string }> }) {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    const staffId = resolvedParams.id;

    // 1. Verify caller has permissions (Handled in page to prevent unauthorized viewing)
    const profile = await getUserProfile();
    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        redirect('/');
    }

    // 2. Fetch the target staff member
    const { data: staffMember } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', staffId)
        .eq('organization_id', profile.organization_id)
        .single();

    if (!staffMember) {
        return (
            <div className="p-8 max-w-2xl mx-auto space-y-4">
                <h1 className="text-2xl font-bold">Personel Bulunamadı</h1>
                <Link href="/settings"><Button variant="outline">Ayarlara Dön</Button></Link>
            </div>
        );
    }

    // 3. Fetch current schedules and time offs
    const { data: rawSchedules } = await getStaffSchedule(staffMember.id);
    const { data: rawTimeOffs } = await getStaffTimeOffs(staffMember.id);

    // Ensure we send a valid 7-day structure down to exactly match the editor needs
    const defaultSchedules = Array.from({ length: 7 }).map((_, idx) => ({
        day_of_week: idx, // 0 = Sunday, 1 = Monday, etc.
        start_time: '09:00',
        end_time: '18:00',
        is_working_day: idx !== 0, // Sunday off by default
    }));

    // Merge DB schedule with default structure
    const schedules = defaultSchedules.map(defaultDay => {
        const dbDay = rawSchedules?.find(s => s.day_of_week === defaultDay.day_of_week);
        if (dbDay) {
            // Trim seconds off postgres time ('09:00:00' -> '09:00')
            return {
                day_of_week: dbDay.day_of_week,
                start_time: dbDay.start_time.substring(0, 5),
                end_time: dbDay.end_time.substring(0, 5),
                is_working_day: dbDay.is_working_day
            };
        }
        return defaultDay;
    });

    return (
        <DashboardLayout title="Çalışma Saatleri" role={profile.role}>
            <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full pt-4 pb-12">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h3 className="text-lg font-medium tracking-tight">
                            Çalışma Saatleri: {staffMember.full_name}
                        </h3>
                        <p className="text-sm text-slate-500">
                            Personelin sistem üzerinden randevu alabileceği gün ve saatleri belirleyin.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <ScheduleEditor staffId={staffMember.id} initialSchedules={schedules} />
                </div>

                <div className="bg-white rounded-xl border p-6 shadow-sm mt-6">
                    <TimeOffEditor staffId={staffMember.id} initialTimeOffs={rawTimeOffs || []} />
                </div>
            </div>
        </DashboardLayout>
    );
}
