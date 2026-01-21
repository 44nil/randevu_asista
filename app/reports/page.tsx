import { getRevenueStats, getInstructorStats } from "@/app/report-actions"
import { getUserProfile } from "@/app/actions"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { InstructorStats } from "@/components/reports/instructor-stats"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Calendar } from "lucide-react"

export default async function ReportsPage() {
    // 1. Verify Role
    const userProfile = await getUserProfile()

    if (!userProfile) {
        return (
            <DashboardLayout title="Raporlar">
                <div className="p-8 text-center text-slate-500">Oturum açmanız gerekiyor.</div>
            </DashboardLayout>
        )
    }

    if (userProfile.role !== 'owner' && userProfile.role !== 'admin') {
        return (
            <DashboardLayout title="Erişim Engellendi">
                <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                    <h2 className="text-xl font-semibold text-slate-800">Bu sayfaya erişim yetkiniz yok.</h2>
                    <p className="text-slate-500">Raporları sadece stüdyo yöneticileri görüntüleyebilir.</p>
                </div>
            </DashboardLayout>
        )
    }

    // 2. Fetch Data
    const revenueData = await getRevenueStats('month')
    const instructorData = await getInstructorStats()

    if (!revenueData.success || !instructorData.success) {
        return (
            <DashboardLayout title="Raporlar">
                <div className="p-8 text-center text-red-500">Veriler yüklenirken bir hata oluştu.</div>
            </DashboardLayout>
        )
    }

    // 3. Prepare Data
    const revenueStats = revenueData.data || [];
    const instructorStats = instructorData.data || [];

    const totalRevenue = revenueStats.reduce((acc: number, curr: any) => acc + curr.value, 0)
    const totalClasses = instructorStats.reduce((acc: number, curr: any) => acc + curr.classes, 0)

    // 4. Render
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
                            <CardTitle className="text-sm font-medium">Verilen Dersler</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalClasses}</div>
                            <p className="text-xs text-muted-foreground">Tamamlanan seanslar</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aktif Eğitmen</CardTitle>
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
                        <TabsTrigger value="instructors">Eğitmen Performansı</TabsTrigger>
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
