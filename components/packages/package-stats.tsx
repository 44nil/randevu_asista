"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Users, CreditCard, ShoppingBag, Award } from "lucide-react"

interface StatsData {
    monthlyRevenue: number
    soldPackagesCount: number
    activeMembers: number
    topPackage: string
}

interface PackageStatsProps {
    data: StatsData
}

import { useOrganization } from "@/providers/organization-provider"

export function PackageStats({ data }: PackageStatsProps) {
    const { config } = useOrganization()
    return (
        <div className="space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Toplam Ciro (Bu Ay)</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(data.monthlyRevenue)}</h3>
                                <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                                    +12% <span className="text-slate-400 ml-1">geçen aya göre</span>
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <CreditCard className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Satılan {config.labels.package}ler</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-2">{data.soldPackagesCount}</h3>
                                <p className="text-xs text-green-600 font-medium mt-1">
                                    +5% <span className="text-slate-400 ml-1">geçen aya göre</span>
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Aktif {config.labels.customer}ler</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-2">{data.activeMembers}</h3>
                                <p className="text-xs text-green-600 font-medium mt-1">
                                    +2% <span className="text-slate-400 ml-1">geçen aya göre</span>
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">En Popüler {config.labels.package}</p>
                                <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-1" title={data.topPackage}>{data.topPackage}</h3>
                                {/* <p className="text-xs text-slate-400 font-medium mt-1">
                                    Bu ay 42 satış
                                </p> */}
                            </div>
                            <div className="h-10 w-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                                <Award className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Revenue Trend Chart - Simple SVG based */}
                <div className="bg-white rounded-xl border shadow-sm p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900">Aylık Gelir Trendi</h3>
                        <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">Son 6 Ay</span>
                    </div>
                    <div className="h-48 relative flex items-end justify-between px-2 gap-2">
                        {/* Fake data bars */}
                        {[35, 45, 30, 60, 55, 75].map((h, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group w-full">
                                <div className="relative w-full bg-blue-50 rounded-t-sm overflow-hidden h-full flex items-end group-hover:bg-blue-100 transition-colors">
                                    <div
                                        className="w-full bg-blue-500 rounded-t-sm transition-all duration-1000 ease-out"
                                        style={{ height: `${h}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium uppercase">
                                    {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* Decorative curve overlay - Simulated with gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Package Distribution Chart */}
                <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center">
                    <div className="w-full flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900">{config.labels.package} Türüne Göre Dağılım</h3>
                        <span className="text-xs text-red-500 font-medium">-3% Geçen Aya Göre</span>
                    </div>

                    <div className="flex items-end gap-12 h-40 mt-4">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 bg-blue-500 rounded-t-lg shadow-lg shadow-blue-500/20 h-24 relative group">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded mb-1">
                                    %45
                                </div>
                            </div>
                            <span className="text-xs font-bold text-blue-600">Grup</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 bg-blue-400 rounded-t-lg shadow-lg shadow-blue-400/20 h-32 relative group">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded mb-1">
                                    %65
                                </div>
                            </div>
                            <span className="text-xs font-bold text-blue-500">Özel</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 bg-blue-300 rounded-t-lg shadow-lg shadow-blue-300/20 h-16 relative group">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded mb-1">
                                    %25
                                </div>
                            </div>
                            <span className="text-xs font-bold text-blue-400">Düet</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
