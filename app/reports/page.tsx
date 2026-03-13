"use client"

import { useEffect, useState } from "react"
import { getRevenueStats, getInstructorStats, getAppointmentStats, getOverallStats, getCustomerStats } from "@/app/report-actions"
import { getUserProfile } from "@/app/actions"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { InstructorStats } from "@/components/reports/instructor-stats"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Calendar, BarChart2, ArrowUpRight, ArrowDownRight, Minus, BarChart, Download } from "lucide-react"
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
    const [customerStats, setCustomerStats] = useState<any>(null)
    const [period, setPeriod] = useState<'month' | '3months' | 'year'>('month')
    const [chartType, setChartType] = useState<'area' | 'bar'>('area')

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                const userProfile = await getUserProfile()
                if (!userProfile) { setError("Oturum açmanız gerekiyor."); setLoading(false); return }
                if (userProfile.role !== 'owner' && userProfile.role !== 'admin') { setAccessDenied(true); setLoading(false); return }

                const [revenueRes, aptRes, instructorRes, overallRes, customerRes] = await Promise.all([
                    getRevenueStats(period === '3months' ? 'month' : period),
                    getAppointmentStats(period),
                    getInstructorStats(),
                    getOverallStats(),
                    getCustomerStats(),
                ])

                if (revenueRes.success) setRevenueStats(revenueRes.data || [])
                if (aptRes.success) setAptStats(aptRes.data || [])
                if (instructorRes.success) setInstructorStats(instructorRes.data || [])
                if (overallRes.success) setOverall(overallRes.data)
                if (customerRes.success) setCustomerStats(customerRes.data)
            } catch {
                setError("Beklenmeyen bir hata oluştu")
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [period])

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

    const exportExcel = async () => {
        const XLSX = await import('xlsx')
        const wb = XLSX.utils.book_new()

        // Gelir
        const revenueSheet = XLSX.utils.json_to_sheet(revenueStats.map(r => ({ 'Ay': r.name, 'Gelir (TL)': r.value })))
        XLSX.utils.book_append_sheet(wb, revenueSheet, 'Gelir')

        // Randevular
        const aptSheet = XLSX.utils.json_to_sheet(aptStats.map(r => ({
            'Ay': r.name, 'Tamamlanan': r.completed, 'İptal': r.cancelled
        })))
        XLSX.utils.book_append_sheet(wb, aptSheet, 'Randevular')

        // Personel
        const staffSheet = XLSX.utils.json_to_sheet(instructorStats.map(r => ({
            'Personel': r.name, 'Seans': r.classes, 'Saat': Math.round(r.hours * 10) / 10
        })))
        XLSX.utils.book_append_sheet(wb, staffSheet, 'Personel')

        XLSX.writeFile(wb, `rapor-${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

    return (
        <DashboardLayout title="Raporlar" headerAction={
            <button onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest transition-all shadow-sm">
                <Download className="h-3.5 w-3.5" /> Excel
            </button>
        }>
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
                            { value: 'customers', label: `${config.labels.customer || 'Müşteri'} Analizi` },
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
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                        {period === 'month' ? 'Son 6 Ay' : period === '3months' ? 'Son 3 Ay' : 'Bu Yıl'}
                                    </p>
                                    <p className="text-2xl font-black text-slate-900">{fmt(totalRevenue)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Dönem filtresi */}
                                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                        {([['month','6 Ay'],['3months','3 Ay'],['year','1 Yıl']] as const).map(([val, label]) => (
                                            <button key={val} onClick={() => setPeriod(val)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                                                    period === val ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'
                                                }`}>{label}</button>
                                        ))}
                                    </div>
                                    {/* Grafik tipi toggle */}
                                    <button onClick={() => setChartType(t => t === 'area' ? 'bar' : 'area')}
                                        className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
                                        <BarChart className="h-4 w-4" />
                                    </button>
                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#10B98118' }}>
                                        <TrendingUp className="h-5 w-5" style={{ color: '#10B981' }} />
                                    </div>
                                </div>
                            </div>
                            <RevenueChart data={revenueStats} type={chartType} />
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

                    {/* Müşteri Analizi */}
                    <TabsContent value="customers" className="space-y-4">
                        {/* En çok gelenler */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">En Çok Gelen {config.labels.customer || 'Müşteri'}ler</p>
                            {!customerStats?.topCustomers?.length ? (
                                <p className="text-sm text-slate-400 text-center py-6">Henüz veri yok.</p>
                            ) : (
                                <div className="space-y-2">
                                    {customerStats.topCustomers.map((c: any, i: number) => {
                                        const rate = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
                                        return (
                                            <div key={c.name + i} className="flex items-center gap-3">
                                                <span className="w-5 text-[10px] font-black text-slate-300">{i + 1}</span>
                                                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black" style={{ background: '#2E66F118', color: '#2E66F1' }}>
                                                    {c.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${rate}%`, background: '#2E66F1' }} />
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 shrink-0">{c.completed} seans</span>
                                                    </div>
                                                </div>
                                                {c.revenue > 0 && (
                                                    <span className="text-xs font-black text-emerald-600 shrink-0">{fmt(c.revenue)}</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Churn riski */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Churn Riski</p>
                                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">30+ gün randevu yok</span>
                            </div>
                            {!customerStats?.churnRisk?.length ? (
                                <p className="text-sm text-emerald-600 text-center py-4 font-bold">✓ Tüm aktif müşteriler son 30 günde geldi</p>
                            ) : (
                                <div className="space-y-2">
                                    {customerStats.churnRisk.map((c: any, i: number) => (
                                        <div key={c.name + i} className="flex items-center gap-3 p-2.5 rounded-xl bg-orange-50/60">
                                            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black" style={{ background: '#F59E0B18', color: '#F59E0B' }}>
                                                {c.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">{c.name}</p>
                                                <p className="text-[10px] text-slate-400">{c.completed} toplam seans</p>
                                            </div>
                                            <span className="text-[10px] font-black text-orange-500">Riskli</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
