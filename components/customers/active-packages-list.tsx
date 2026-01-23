"use client"

import { useState, useEffect } from "react"
import { getCustomerActivePackages } from "@/app/package-actions"
import { Button } from "@/components/ui/button"
import { Plus, Package as PackageIcon, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PackageSaleDialog } from "@/components/packages/package-sale-dialog"
import { Badge } from "@/components/ui/badge"

interface ActivePackagesListProps {
    customerId: string
    customerName: string
}

export function ActivePackagesList({ customerId, customerName }: ActivePackagesListProps) {
    const [packages, setPackages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saleDialogOpen, setSaleDialogOpen] = useState(false)

    const loadPackages = async () => {
        setLoading(true)
        const res = await getCustomerActivePackages(customerId)
        if (res.success) {
            setPackages(res.data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadPackages()
    }, [customerId])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Aktif Paketler</h3>
                <Button size="sm" variant="outline" onClick={() => setSaleDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-2" />
                    Paket Sat
                </Button>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-4 text-xs text-slate-400">Yükleniyor...</div>
                ) : packages.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-slate-50">
                        <PackageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Aktif paket bulunmuyor</p>
                    </div>
                ) : (
                    packages.map((pkg) => (
                        <div key={pkg.id} className="border rounded-lg p-3 bg-white shadow-sm flex justify-between items-start">
                            <div>
                                <div className="font-medium text-sm text-slate-900">{pkg.package_name}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {pkg.expiry_date ? new Date(pkg.expiry_date).toLocaleDateString('tr-TR') : 'Süresiz'}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant={pkg.remaining_credits > 0 ? "default" : "destructive"} className="text-xs">
                                    {pkg.remaining_credits} / {pkg.initial_credits} Hak
                                </Badge>
                                <span className="text-[10px] text-slate-400">
                                    {formatCurrency(pkg.price_paid)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <PackageSaleDialog
                customer={{ id: customerId, name: customerName }}
                open={saleDialogOpen}
                onOpenChange={setSaleDialogOpen}
                onSuccess={() => {
                    loadPackages()
                    setSaleDialogOpen(false)
                }}
            />
        </div>
    )
}
