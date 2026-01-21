"use client"

import { useEffect, useState } from "react"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { HeroSection } from "@/components/customer-portal/hero-section"
import { PackageStatus } from "@/components/customer-portal/package-status"
import { NextClass } from "@/components/customer-portal/next-class"
import { Announcements } from "@/components/customer-portal/announcements"
import { Button } from "@/components/ui/button"
import { Bell, Plus } from "lucide-react"
import { getCustomerDashboardData } from "@/app/portal-actions"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

export function CustomerDashboard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getCustomerDashboardData()
                if (result.success) {
                    setData(result.data)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) {
        return (
            <CustomerLayout>
                <div className="flex h-screen items-center justify-center bg-slate-50">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </CustomerLayout>
        )
    }

    const { user, activePackage, nextClass } = data || {}

    return (
        <CustomerLayout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Hoş geldin, {user?.full_name?.split(' ')[0]}!</h1>
                        <p className="text-slate-500">Bugün harika bir gün.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-600">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white" />
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Rezervasyon
                        </Button>
                    </div>
                </header>

                {/* Hero Section */}
                <HeroSection userName={user?.full_name || "Sporcu"} />

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Package Status - Horizontal Card */}
                        <div className="h-64">
                            <PackageStatus pkg={activePackage} />
                        </div>

                        {/* Announcements */}
                        <div className="h-fit">
                            <Announcements />
                        </div>
                    </div>

                    {/* Right Column (1/3) */}
                    <div className="space-y-6">
                        {/* Next Class Widget */}
                        <div className="h-auto">
                            <NextClass appointment={nextClass} />
                        </div>

                        {/* Recent Stats or Quick Actions could go here */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">BU AY</p>
                                <p className="text-3xl font-black text-slate-900">{data?.stats?.attended || 0}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Seans</p>
                                <p className="text-[10px] text-green-600 font-bold mt-2 bg-green-50 inline-block px-2 py-0.5 rounded-full">
                                    +2 geçen aya göre
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">KALORİ</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {((data?.stats?.calorie || 0) / 1000).toFixed(1)}k
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Tahmini Yakılan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Upcoming Classes */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Gelecek Dersler</h3>
                        <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => window.location.href = '/history'}>Tümünü Gör</Button>
                    </div>
                    <div className="space-y-3">
                        {data?.upcomingClasses?.length > 0 ? (
                            data.upcomingClasses.map((apt: any) => (
                                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">
                                                {format(new Date(apt.start_time), 'd MMMM, EEEE', { locale: tr })}
                                            </span>
                                            <span className="text-xs text-slate-500">{apt.service_id} • {apt.staff?.full_name}</span>
                                        </div>
                                    </div>
                                    <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-blue-600 shadow-sm border border-blue-100">
                                        {format(new Date(apt.start_time), 'HH:mm')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                Gelecek planlanmış dersiniz bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    )
}
