"use client"

import { useEffect, useState } from "react"
import { getRevenueStats, getInstructorStats } from "@/app/report-actions"
import { getUserProfile } from "@/app/actions"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { InstructorStats } from "@/components/reports/instructor-stats"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Calendar } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"
import { Loader2 } from "lucide-react"

export default function ReportsPage() {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [accessDenied, setAccessDenied] = useState(false)
    const [revenueStats, setRevenueStats] = useState<any[]>([])
    const [instructorStats, setInstructorStats] = useState<any[]>([])

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Verify Role
                const userProfile = await getUserProfile()

                if (!userProfile) {
                    setError("Oturum açmanız gerekiyor.")
                    setLoading(false)
                    return
                }

                if (userProfile.role !== 'owner' && userProfile.role !== 'admin') {
                    setAccessDenied(true)
                    setLoading(false)
                    return
                }

                // 2. Fetch Data
                const [revenueRes, instructorRes] = await Promise.all([
                    getRevenueStats('month'),
                    getInstructorStats()
                ])

                if (!revenueRes.success || !instructorRes.success) {
                    setError("Veriler yüklenirken bir hata oluştu.")
                } else {
                    setRevenueStats(revenueRes.data || [])
                    setInstructorStats(instructorRes.data || [])
                }
            } catch (err) {
                setError("Beklenmeyen bir hata oluştu")
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) {
        return (
            <DashboardLayout title="Raporlar">
                <div className="h-96 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        )
    }

    if (accessDenied) {
        return (
            <DashboardLayout title="Erişim Engellendi">
                <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                    <h2 className="text-xl font-semibold text-slate-800">Bu sayfaya erişim yetkiniz yok.</h2>
                    <p className="text-slate-500">Raporları sadece yönetici yetkisine sahip kullanıcılar görüntüleyebilir.</p>
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout title="Raporlar">
                <div className="p-8 text-center text-red-500">{error}</div>
            </DashboardLayout>
        )
    }

    const totalRevenue = revenueStats.reduce((acc: number, curr: any) => acc + curr.value, 0)
    const totalClasses = instructorStats.reduce((acc: number, curr: any) => acc + curr.classes, 0)

    return (
        <DashboardLayout title="Raporlar">
            <div className="space-y-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Toplam Gelir (Son 6 Ay)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">+20% geçen döneme göre</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Verilen {config.labels.appointment}lar</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalClasses}</div>
                            <p className="text-xs text-muted-foreground">Tamamlanan {config.labels.session?.toLowerCase()}lar</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aktif {config.labels.instructor}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{instructorStats.length}</div>
                            <p className="text-xs text-muted-foreground">Performans gösteren</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="revenue" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="revenue">Gelir Analizi</TabsTrigger>
                        <TabsTrigger value="instructors">{config.labels.instructor} Performansı</TabsTrigger>
                    </TabsList>

                    <TabsContent value="revenue" className="space-y-4">
                        <RevenueChart data={revenueStats} />
                    </TabsContent>

                    <TabsContent value="instructors" className="space-y-4">
                        <InstructorStats data={instructorStats} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
