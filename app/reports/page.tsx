"use client"

import { useEffect, useState } from "react"
import { getRevenueStats, getInstructorStats, getAppointmentStats, getOverallStats } from "@/app/report-actions"
import { getUserProfile } from "@/app/actions"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { InstructorStats } from "@/components/reports/instructor-stats"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Calendar, BarChart2, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"
import { Loader2 } from "lucide-react"

export default function ReportsPage() {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [accessDenied, setAccessDenied] = useState(false)
    const [revenueStats, setRevenueStats] = useState<any[]>([])
    const [aptStats, setAptStats] = useState<any[]>([])
    const [instructorStats, setInstructorStats] = useState<any[]>([])
    const [overall, setOverall] = useState<any>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                const userProfile = await getUserProfile()
                if (!userProfile) { setError("Oturum açmanız gerekiyor."); setLoading(false); return }
                if (userProfile.role !== 'owner' && userProfile.role !== 'admin') { setAccessDenied(true); setLoading(false); return }

                const [revenueRes, aptRes, instructorRes, overallRes] = await Promise.all([
                    getRevenueStats('month'),
                    getAppointmentStats(),
                    getInstructorStats(),
                    getOverallStats(),
                ])

                if (revenueRes.success) setRevenueStats(revenueRes.data || [])
                if (aptRes.success) setAptStats(aptRes.data || [])
                if (instructorRes.success) setInstructorStats(instructorRes.data || [])
                if (overallRes.success) setOverall(overallRes.data)
            } catch {
                setError("Beklenmeyen bir hata oluştu")
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) return (
        <DashboardLayout title="Raporlar">
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2E66F1' }} />
            </div>
        </DashboardLayout>
    )

    if (accessDenied) return (
        <DashboardLayout title="Raporlar">
            <div className="flex h-96 flex-col items-center justify-center gap-3 text-center">
                <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                    <BarChart2 className="h-6 w-6 text-red-400" />
                </div>
                <h2 className="text-lg font-black text-slate-800">Erişim Engellendi</h2>
                <p className="text-slate-400 text-sm">Raporları sadece yöneticiler görüntüleyebilir.</p>
            </div>
        </DashboardLayout>
    )

    if (error) return (
        <DashboardLayout title="Raporlar">
            <div className="p-8 text-center text-red-500">{error}</div>
        </DashboardLayout>
    )

    const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
    const totalRevenue = revenueStats.reduce((a, c) => a + c.value, 0)
    const totalCompleted = aptStats.reduce((a, c) => a + c.completed, 0)
    const totalCancelled = aptStats.reduce((a, c) => a + c.cancelled, 0)

    const summaryCards = [
        {
            label: 'Bu Ay Ciro',
            value: fmt(overall?.thisMonthRevenue || 0),
            icon: TrendingUp,
            color: '#10B981',
            growth: overall?.revenueGrowth,
        },
        {
            label: 'Toplam Tamamlanan',
            value: overall?.totalCompletedApts || 0,
            icon: Calendar,
            color: '#2E66F1',
            sub: `Bu ay ${overall?.thisMonthApts || 0} randevu`,
        },
        {
            label: 'İptal Oranı',
            value: `%${overall?.cancellationRate || 0}`,
            icon: BarChart2,
            color: overall?.cancellationRate > 20 ? '#EF4444' : '#F59E0B',
            sub: 'Bu ay',
        },
        {
            label: `Aktif ${config.labels.instructor || 'Personel'}`,
            value: instructorStats.length,
            icon: Users,
            color: '#8B5CF6',
            sub: 'Performans gösteren',
        },
    ]

    return (
        <DashboardLayout title="Raporlar">
            <div className="max-w-5xl mx-auto space-y-5 pb-16">

                {/* Özet Kartları */}
                <div className="grid grid-cols-4 gap-3">
                    {summaryCards.map(({ label, value, icon: Icon, color, growth, sub }) => (
                        <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
                                    <Icon className="h-4 w-4" style={{ color }} />
                                </div>
                                {growth != null && (
                                    <span className={`flex items-center gap-0.5 text-[10px] font-black ${growth > 0 ? 'text-emerald-600' : growth < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : growth < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                        {Math.abs(growth)}%
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                            {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
                        </div>
                    ))}
                </div>

                {/* Sekmeler */}
                <Tabs defaultValue="revenue">
                    <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl w-full flex gap-1 h-auto mb-4">
                        {[
                            { value: 'revenue', label: 'Gelir' },
                            { value: 'appointments', label: `${config.labels.appointment || 'Randevu'} Analizi` },
                            { value: 'instructors', label: `${config.labels.instructor || 'Personel'} Performansı` },
                        ].map(t => (
                            <TabsTrigger key={t.value} value={t.value} className="flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Gelir */}
                    <TabsContent value="revenue" className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Son 6 Ay</p>
                                    <p className="text-2xl font-black text-slate-900">{fmt(totalRevenue)}</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#10B98118' }}>
                                    <TrendingUp className="h-5 w-5" style={{ color: '#10B981' }} />
                                </div>
                            </div>
                            <RevenueChart data={revenueStats} />
                        </div>
                    </TabsContent>

                    {/* Randevu Analizi */}
                    <TabsContent value="appointments" className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Son 6 Ay</p>
                                    <p className="text-2xl font-black text-slate-900">{totalCompleted} tamamlandı</p>
                                </div>
                                <span className="text-sm font-bold text-red-400">{totalCancelled} iptal</span>
                            </div>
                            {/* Ay bazlı özet liste */}
                            <div className="space-y-2">
                                {aptStats.map(row => {
                                    const total = row.completed + row.cancelled
                                    const rate = total > 0 ? Math.round((row.completed / total) * 100) : 0
                                    return (
                                        <div key={row.name} className="flex items-center gap-3">
                                            <span className="w-8 text-xs font-black text-slate-400 uppercase">{row.name}</span>
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: '#2E66F1' }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 w-16 text-right">{row.completed} / {total}</span>
                                            <span className={`text-[10px] font-black w-10 text-right ${rate < 70 ? 'text-red-400' : 'text-emerald-600'}`}>%{rate}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Personel Performansı */}
                    <TabsContent value="instructors" className="space-y-3">
                        {instructorStats.length === 0 && (
                            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-sm">
                                Henüz tamamlanmış randevu yok.
                            </div>
                        )}
                        {instructorStats.map((inst, i) => (
                            <div key={inst.name} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-base font-black" style={{ background: '#8B5CF618', color: '#8B5CF6' }}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-900">{inst.name}</p>
                                    <p className="text-xs text-slate-400">{Math.round(inst.hours * 10) / 10} saat</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black" style={{ color: '#8B5CF6' }}>{inst.classes}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">seans</p>
                                </div>
                            </div>
                        ))}
                        {instructorStats.length > 0 && (
                            <InstructorStats data={instructorStats} />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
