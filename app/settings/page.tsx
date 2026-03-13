"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "@/components/settings/general-settings"
import { WorkingHours } from "@/components/settings/working-hours"
import { CancelPolicy } from "@/components/settings/cancel-policy"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { SecurityProfile } from "@/components/settings/security-profile"
import { StaffList } from "@/components/settings/staff-list"
import { LunchBreakSettings } from "@/components/settings/lunch-break-settings"
import { getOrganizationSettings } from "@/app/settings/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState<any>(null)

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true)
            const result = await getOrganizationSettings()

            // Check if user is customer (based on result error OR data structure)
            // Unfortunately getOrganizationSettings logic implicitly assumes admin rights for fetching org data
            // But let's check if the returned data implies a customer role or if we need a separate check.
            // Actually, getOrganizationSettings fetches 'users' table. 
            // Better approach: Check session role first or handle the 'Unauthorized' / 'Role' check.

            // Simpler: If we can't get settings or if it's a customer, redirect.
            // However, getOrganizationSettings might return success even for customers if not strictly role-gated yet.
            // Let's rely on the profile-actions logic we used elsewhere or just check the returned user part of the settings if available.

            // Let's do a direct role check here for safety.
            const { getUserProfile } = await import("@/app/profile-actions")
            const profile = await getUserProfile()

            if (profile.success) {
                if (profile.data.role === 'customer') {
                    window.location.href = '/profile'
                    return
                }
                if (profile.data.role === 'staff') {
                    // Redirect staff to dashboard or program
                    window.location.href = '/program'
                    return
                }
            }

            if (result.success) {
                setSettings(result.data)
            } else {
                toast.error("Ayarlar yüklenemedi")
            }
            setLoading(false)
        }
        loadSettings()
    }, [])

    if (loading) {
        return (
            <DashboardLayout title="Sistem Ayarları">
                <div className="p-8 text-center text-slate-500">Ayarlar yükleniyor...</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout
            title="Sistem Ayarları"
            subtitle="Salon bilgilerini ve operasyonel kuralları buradan yönetebilirsiniz."
            headerAction={
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    Değişiklikleri Kaydet
                </Button>
            }
        >
            <Tabs defaultValue="general" className="w-full space-y-6">
                <TabsList className="bg-white p-1 border rounded-lg h-auto">
                    <TabsTrigger value="team" className="px-4 py-2 text-sm">Ekip Yönetimi</TabsTrigger>
                    <TabsTrigger value="general" className="px-4 py-2 text-sm">Salon Bilgileri</TabsTrigger>
                    <TabsTrigger value="hours" className="px-4 py-2 text-sm">Çalışma Saatleri</TabsTrigger>
                    <TabsTrigger value="lunch" className="px-4 py-2 text-sm">Öğle Arası</TabsTrigger>
                    <TabsTrigger value="policy" className="px-4 py-2 text-sm">İptal Politikası</TabsTrigger>
                    <TabsTrigger value="notifications" className="px-4 py-2 text-sm">Bildirimler</TabsTrigger>
                    <TabsTrigger value="profile" className="px-4 py-2 text-sm">Profil</TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="space-y-6">
                    <StaffList />
                </TabsContent>

                <TabsContent value="general" className="space-y-6">
                    <GeneralSettings defaultValues={settings} />
                </TabsContent>

                <TabsContent value="hours" className="space-y-6">
                    <WorkingHours settings={settings?.organization?.settings} />
                </TabsContent>

                <TabsContent value="lunch" className="space-y-6">
                    {settings?.organization?.id ? (
                        <LunchBreakSettings 
                            orgId={settings.organization.id}
                            initialSettings={{
                                lunch_break_enabled: settings?.organization?.lunch_break_enabled ?? true,
                                lunch_break_start: settings?.organization?.lunch_break_start ?? "12:00:00",
                                lunch_break_end: settings?.organization?.lunch_break_end ?? "13:00:00"
                            }}
                        />
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                            <p className="text-yellow-800">Organizasyon bilgileri yükleniyor...</p>
                            <p className="text-sm text-yellow-600 mt-2">
                                Settings data: {JSON.stringify(settings?.organization, null, 2)}
                            </p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="policy" className="space-y-6 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CancelPolicy settings={settings?.organization?.settings} />
                        {/* Other policy widgets could go here */}
                    </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <NotificationSettings settings={settings?.organization?.settings} />
                </TabsContent>

                <TabsContent value="profile" className="space-y-6">
                    <SecurityProfile />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    )
}
