"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PackageList } from "@/components/packages/package-list"
import { PackageStats } from "@/components/packages/package-stats"
import { RecentSales } from "@/components/packages/recent-sales"
import { NewPackageDialog } from "@/components/packages/new-package-dialog"
import { getPackages, getPackagePageStats, getRecentSales } from "@/app/package-actions"
import { toast } from "sonner"

import { useOrganization } from "@/providers/organization-provider"

export default function PackagesPage() {
    const { config } = useOrganization()
    const [mounted, setMounted] = useState(false)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [packages, setPackages] = useState<any[]>([])
    const [sales, setSales] = useState<any[]>([])
    const [stats, setStats] = useState({
        monthlyRevenue: 0,
        soldPackagesCount: 0,
        activeMembers: 0,
        topPackage: "-"
    })

    useEffect(() => {
        const checkAccess = async () => {
            const { getUserProfile } = await import("@/app/profile-actions")
            const profile = await getUserProfile()
            if (profile.success && profile.data.role === 'staff') {
                window.location.href = '/program'
            }
        }
        checkAccess()
        setMounted(true)
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [pkgRes, statsRes, salesRes] = await Promise.all([
            getPackages(),
            getPackagePageStats(),
            getRecentSales()
        ])

        if (pkgRes.success) setPackages(pkgRes.data || [])
        if (statsRes.success) setStats((statsRes.data as any) || { monthlyRevenue: 0, soldPackagesCount: 0, activeMembers: 0, topPackage: "-" })
        if (salesRes.success) setSales(salesRes.data || [])

        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    if (!mounted) return null;

    return (
        <DashboardLayout
            title={`${config.labels.package} ve Satış Yönetimi`}
            subtitle={`İşletmenizdeki ${config.labels.appointment?.toLowerCase()} ${config.labels.package?.toLowerCase()}lerini oluşturun, fiyatlandırın ve satış raporlarını inceleyin.`}
            headerAction={
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni {config.labels.package} Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Yeni {config.labels.package} Oluştur</DialogTitle>
                            <DialogDescription>
                                Yeni bir {config.labels.appointment?.toLowerCase()} {config.labels.package?.toLowerCase()}i tanımlayın ve fiyatlandırın.
                            </DialogDescription>
                        </DialogHeader>
                        <NewPackageDialog
                            onSuccess={() => {
                                setOpen(false)
                                loadData()
                            }}
                        />
                    </DialogContent>
                </Dialog>
            }
        >
            <div className="space-y-8">
                {/* Stats Section */}
                <PackageStats data={stats} />

                {/* Main Content Grid */}
                {/* As per design: List of packages + Sales list at bottom or side? 
                   Design shows: Stats -> Charts -> Package List -> Recent Sales (Footer like)
                */}

                <div className="grid grid-cols-1 gap-8">
                    <PackageList data={packages} onRefresh={loadData} />
                    <RecentSales data={sales} />
                </div>
            </div>
        </DashboardLayout>
    )
}
