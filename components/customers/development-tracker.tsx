"use client"

import { useState, useEffect } from "react"
import { getMeasurements } from "@/app/measurement-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus, Calendar, Activity, Weight, Ruler } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useOrganization } from "@/providers/organization-provider"

interface DevelopmentTrackerProps {
    customerId: string
}

export function DevelopmentTracker({ customerId }: DevelopmentTrackerProps) {
    const { config: industryConfig } = useOrganization()
    const [measurements, setMeasurements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const res = await getMeasurements(customerId)
            if (res.success) setMeasurements(res.data || [])
            setLoading(false)
        }
        load()
    }, [customerId])

    // Derived Metrics
    const latest = measurements[0]
    const previous = measurements[1]

    // Weight Change
    const weightChange = latest && previous && latest.weight && previous.weight
        ? latest.weight - previous.weight
        : 0
    const weightTrend = weightChange > 0 ? "up" : weightChange < 0 ? "down" : "stable"

    // BMI Calculation (Assuming height is in cm and constant from latest record if available)
    // Note: If height is missing in latest, try to find it in history
    const heightRecord = measurements.find(m => m.height > 0)
    const height = heightRecord?.height
    const bmi = latest?.weight && height
        ? (latest.weight / ((height / 100) * (height / 100))).toFixed(1)
        : null

    // Chart Data (Reverse for chronological order)
    const chartData = [...measurements].reverse().map(m => ({
        date: format(new Date(m.date), 'd MMM', { locale: tr }),
        weight: m.weight,
        notes: m.notes
    })).filter(m => m.weight > 0)

    // Notes History
    const notesHistory = measurements.filter(m => m.notes).slice(0, 5)

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
    if (measurements.length === 0) return <div className="p-8 text-center text-slate-500">Henüz ölçüm kaydı yok.</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gelişim Takibi ve Ölçümler</h2>
                    <p className="text-slate-500 mt-1">Fiziksel değişiminizi ve hedeflerinize olan yakınlığınızı buradan takip edin.</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Weight Card */}
                <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Güncel Kilo</CardTitle>
                        <Weight className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{latest?.weight || '-'}</span>
                            <span className="text-sm font-medium text-slate-600">kg</span>
                        </div>
                        {weightChange !== 0 && (
                            <div className={`flex items-center mt-2 text-xs font-medium ${weightTrend === 'down' ? 'text-green-600' : 'text-red-600'}`}>
                                {weightTrend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                                {Math.abs(weightChange).toFixed(1)} kg
                                <span className="text-slate-400 ml-1 font-normal">geçen ölçüme göre</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* BMI Card */}
                <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Vücut Kitle İndeksi (BMI)</CardTitle>
                        <Activity className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{bmi || '-'}</span>
                        </div>
                        <div className="flex items-center mt-2 text-xs text-slate-400">
                            {height ? `${height} cm boy baz alındı` : 'Boy verisi eksik'}
                        </div>
                    </CardContent>
                </Card>

                {/* Total Measurements */}
                <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Toplam Ölçüm</CardTitle>
                        <Ruler className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{measurements.length}</div>
                        <div className="text-xs text-slate-400 mt-2">
                            Son ölçüm: {format(new Date(latest.date), 'd MMM yyyy', { locale: tr })}
                        </div>
                    </CardContent>
                </Card>

                {/* Waist Change (Custom metric) */}
                <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Bel İncelme</CardTitle>
                        <Activity className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                            {measurements.length > 1 && latest.waist && measurements[measurements.length - 1].waist
                                ? `${(measurements[measurements.length - 1].waist - latest.waist).toFixed(1)} cm`
                                : '-'
                            }
                        </div>
                        <div className="text-xs text-green-600 mt-2 font-medium">
                            Genel Değişim
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Notes Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Graph */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200/50">
                        <CardHeader>
                            <CardTitle>Vücut Ağırlık Analizi</CardTitle>
                            <CardDescription>Zaman içindeki kilo değişim grafiği</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            dataKey="weight"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            labelStyle={{ color: '#64748b', marginBottom: '0.25rem' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorWeight)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regional History Table */}
                    <Card className="border-none shadow-sm ring-1 ring-slate-200/50">
                        <CardHeader>
                            <CardTitle>Bölgesel Ölçüm Geçmişi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Tarih</th>
                                            <th className="px-4 py-3 font-medium">Bel</th>
                                            <th className="px-4 py-3 font-medium">Basen</th>
                                            <th className="px-4 py-3 font-medium">Göğüs</th>
                                            <th className="px-4 py-3 font-medium">Kol</th>
                                            <th className="px-4 py-3 font-medium">Bacak</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {measurements.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {format(new Date(m.date), 'd MMM yyyy', { locale: tr })}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{m.waist || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{m.hip || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{m.chest || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{m.arm_right || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{m.leg_right || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Trainer Notes / Timeline */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200/50 h-full">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-green-500" />
                                <CardTitle>{industryConfig.labels.instructor} Notları</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l-2 border-green-100 ml-3 space-y-8 py-2">
                                {notesHistory.length > 0 ? notesHistory.map((m) => (
                                    <div key={m.id} className="ml-6 relative">
                                        <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                                        <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">
                                            {format(new Date(m.date), 'd MMM yyyy', { locale: tr })}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {m.notes}
                                        </p>
                                    </div>
                                )) : (
                                    <div className="ml-6 text-sm text-slate-400 italic">Henüz not eklenmemiş.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
