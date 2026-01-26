"use client"

import { useEffect, useState } from "react"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { HistoryStats } from "@/components/customer-portal/history-stats"
import { HistoryTable } from "@/components/customer-portal/history-table"
import { ActivePackageList } from "@/components/customer-portal/active-package-list"
import { getCustomerHistory } from "@/app/portal-actions"
import { Loader2, History, Package } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useOrganization } from "@/providers/organization-provider"

export default function HistoryPage() {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const result = await getCustomerHistory()
                if (result.success) {
                    setData(result.data)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        loadHistory()
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

    return (
        <CustomerLayout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{config.labels.appointment} ve {config.labels.package} Detayları</h1>
                    <p className="text-slate-500">{config.labels.appointment}lerinizi ve {config.labels.package?.toLowerCase()} kullanım durumunuzu buradan takip edebilirsiniz.</p>
                </div>

                {/* Top Stats */}
                <HistoryStats stats={data?.stats || { totalCredits: 0, activePackages: 0, completedSessions: 0 }} />

                {/* Tabs for History and Packages */}
                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            {config.labels.appointment}lerim
                        </TabsTrigger>
                        <TabsTrigger value="packages" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {config.labels.package} Detayları
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="space-y-8">
                        {(() => {
                            const now = new Date();
                            const history = data?.history || [];
                            const upcoming = history.filter((item: any) => new Date(item.start_time) > now);
                            const past = history.filter((item: any) => new Date(item.start_time) <= now);

                            return (
                                <>
                                    {/* Future Classes */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                            Gelecek {config.labels.appointment}lerim
                                        </h3>
                                        <HistoryTable history={upcoming} />
                                    </div>

                                    {/* Past Classes */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                            Geçmiş {config.labels.appointment}lerim
                                        </h3>
                                        <HistoryTable history={past} />
                                    </div>
                                </>
                            );
                        })()}
                    </TabsContent>

                    <TabsContent value="packages" className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-600" />
                                Aktif {config.labels.package} Durumu
                            </h3>
                            <ActivePackageList packages={data?.packages || []} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </CustomerLayout>
    )
}
