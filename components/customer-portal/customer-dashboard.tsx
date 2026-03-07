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

import { useOrganization } from "@/providers/organization-provider"

export function CustomerDashboard() {
    const { config } = useOrganization()
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
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-navy tracking-tight uppercase">
                            Selam, {user?.full_name?.split(' ')[0]}!
                        </h1>
                        <p className="text-t2 text-sm font-medium mt-1 opacity-80">Bugün harika bir gün.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative text-navy/40 hover:text-navy hover:bg-bg rounded-btn transition-colors">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-electric border-2 border-white shadow-brand" />
                        </Button>
                        <Button className="bg-electric text-white font-extrabold text-xs px-6 h-11 rounded-btn shadow-cta hover:bg-navy transition-all uppercase tracking-wide" style={{ fontWeight: 800 }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni {config.labels.appointment}
                        </Button>
                    </div>
                </header>

                {/* Hero Section */}
                <HeroSection userName={user?.full_name || (config.labels.customer === 'Hasta' ? 'Hasta' : 'Kullanıcı')} />

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Package Status - Horizontal Card */}
                        <div className="h-64">
                            <PackageStatus pkg={activePackage} lastUsage={data?.lastUsage || []} />
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
                        <div className="grid grid-cols-2 gap-5">
                            <div className="bg-white p-6 rounded-card shadow-brand border-none text-center transition-all hover:shadow-elevated">
                                <p className="text-[10px] text-t3 font-extrabold uppercase tracking-widest mb-2">BU AY / {config.labels.session?.toUpperCase() || 'SEANS'}</p>
                                <p className="text-4xl font-extrabold text-navy tracking-tighter" style={{ fontWeight: 800 }}>{data?.stats?.attended || 0}</p>
                                <div className="text-[10px] text-green font-bold mt-4 bg-green/10 inline-block px-3 py-1 rounded-badge uppercase tracking-wide">
                                    Verimli Ay
                                </div>
                            </div>
                            {config.features.measurements && (
                                <div className="bg-white p-6 rounded-card shadow-brand border-none text-center transition-all hover:shadow-elevated">
                                    <p className="text-[10px] text-t3 font-extrabold uppercase tracking-widest mb-2">KALORİ / YAKILAN</p>
                                    <p className="text-4xl font-extrabold text-navy tracking-tighter" style={{ fontWeight: 800 }}>
                                        {((data?.stats?.calorie || 0) / 1000).toFixed(1)}k
                                    </p>
                                    <div className="text-[10px] text-electric font-bold mt-4 bg-electric/10 inline-block px-3 py-1 rounded-badge uppercase tracking-wide">
                                        Aktif Durum
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Upcoming Classes */}
                <div className="bg-white rounded-card p-8 shadow-brand border-none">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-extrabold text-navy uppercase tracking-tight text-base">
                            GELECEK {config.labels.appointment.toUpperCase()}LAR
                        </h3>
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-electric hover:bg-bg" onClick={() => window.location.href = '/history'}>Tümünü Gör</Button>
                    </div>
                    <div className="space-y-4">
                        {data?.upcomingClasses?.length > 0 ? (
                            data.upcomingClasses.map((apt: any) => (
                                <div key={apt.id} className="flex items-center justify-between p-5 rounded-card bg-bg/40 border border-border-brand/20 transition-all hover:bg-bg/60">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-extrabold text-navy tracking-tight" style={{ fontWeight: 800 }}>
                                                {format(new Date(apt.start_time), 'd MMMM, EEEE', { locale: tr })}
                                            </span>
                                            <span className="text-xs text-t2 font-medium opacity-70 mt-1 uppercase tracking-wide">{apt.service_id} • {apt.staff?.full_name}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white px-5 py-2 rounded-btn text-xs font-extrabold text-electric shadow-brand border border-border-brand/30">
                                        {format(new Date(apt.start_time), 'HH:mm')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-t3 text-sm font-medium bg-bg/20 rounded-card border-dashed border-2 border-border-brand/30">
                                Henüz planlanmış {config.labels.appointment?.toLowerCase() || 'randevu'}nuz bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    )
}
