"use client"

import { useState } from "react"
import { MembersTable } from "@/components/customers/members-table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Users, CreditCard, AlertCircle, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { CustomerForm } from "@/components/forms/customer-form"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useOrganization } from "@/providers/organization-provider"

interface CustomersClientProps {
    role?: string
    initialMembers: any[]
    initialStats: any
}

export function CustomersClient({ role, initialMembers, initialStats }: CustomersClientProps) {
    const { config, organization } = useOrganization()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<any[]>(initialMembers || [])
    const [stats, setStats] = useState(initialStats || {
        totalMembers: 0,
        expiredPackages: 0,
        lowBalance: 0,
        monthlyRevenue: 0
    })

    const loadData = async () => {
        setLoading(true)
        // Refresh data via server actions if needed
        // Since this is client, we can re-import actions here or pass a refresh prop function
        // For simplicity, we can just use router.refresh() but that refreshes server component
        // Or we can call actions directly
        const { getCustomersWithStats, getMemberPageStats } = await import("@/app/customer-actions")
        const [membersRes, statsRes] = await Promise.all([
            getCustomersWithStats(),
            getMemberPageStats()
        ])

        if (membersRes.success && membersRes.data) {
            setMembers(membersRes.data)
        }
        if (statsRes.success && statsRes.data) {
            setStats(statsRes.data)
        }
        setLoading(false)
    }

    return (
        <DashboardLayout
            title={`${config.labels.customer} ve ${config.labels.package || 'Paket'} Yönetimi`}
            subtitle={`Tüm kişilerin aktif ${config.features?.packages === false && config.labels.package ? config.labels.package.toLowerCase() + 'lerini' : 'paketlerini/tedavilerini'} ve kalan haklarını buradan takip edebilirsiniz.`}
            role={role}
            headerAction={
                (role !== 'staff') ? (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                {config.labels.createCustomer}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{config.labels.createCustomer}</DialogTitle>
                                <DialogDescription>
                                    {config.labels.customer} bilgilerini giriniz.
                                </DialogDescription>
                            </DialogHeader>
                            <CustomerForm
                                industryType={((organization?.settings as any)?.real_industry || organization?.industry_type || 'general') as any}
                                onSuccess={() => {
                                    setOpen(false)
                                    loadData()
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                ) : undefined
            }
        >
            <div className="space-y-6">
                {/* Stats Cards - Hide Revenue for Staff */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Toplam Aktif {config.labels.customer}</p>
                                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalMembers}</h3>
                                    <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                                        +12% <span className="text-slate-400 ml-1">geçen aya göre</span>
                                    </p>
                                </div>
                                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Biten {config.labels.package}</p>
                                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.expiredPackages}</h3>
                                    <p className="text-xs text-orange-500 font-medium mt-1">
                                        Yenileme Bekliyor
                                    </p>
                                </div>
                                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Düşük Bakiyeli</p>
                                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.lowBalance}</h3>
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-yellow-400 w-2/3" />
                                    </div>
                                </div>
                                <div className="h-10 w-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {role !== 'staff' && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Aylık Gelir</p>
                                        <h3 className="text-3xl font-bold text-slate-900 mt-2">₺{stats.monthlyRevenue.toLocaleString('tr-TR')}</h3>
                                        <p className="text-xs text-green-600 font-medium mt-1">
                                            Hedefin %82'si
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                        <Wallet className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <MembersTable data={members} onRefresh={loadData} />
            </div>
        </DashboardLayout>
    )
}
