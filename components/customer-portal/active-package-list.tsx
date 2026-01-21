"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, Clock } from "lucide-react"

interface ActivePackageListProps {
    packages: any[]
}

export function ActivePackageList({ packages }: ActivePackageListProps) {
    if (!packages || packages.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed">
                <p className="text-slate-500">Aktif paketiniz bulunmuyor.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((sale) => {
                // Mock calculation for usage (In real app, we need to track usage per package)
                // For MVP, we assumed global usage. Here visuals might be static or estimated.
                const total = sale.package?.sessions || 0
                // We'll show full for now as we don't track per-package usage in DB yet
                const used = 0
                const progress = total > 0 ? (used / total) * 100 : 0
                const expiryDate = new Date(new Date(sale.sale_date).setDate(new Date(sale.sale_date).getDate() + (sale.package?.duration_days || 30)))

                return (
                    <Card key={sale.id} className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">{sale.package?.name}</h4>
                                    <p className="text-xs text-slate-500">Satın Alma: {new Date(sale.sale_date).toLocaleDateString('tr-TR')}</p>
                                </div>
                                <Badge className="bg-blue-600 hover:bg-blue-700">AKTİF</Badge>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Kredi Kullanımı</span>
                                    <span className="font-bold text-slate-900">{used} / {total}</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    <span>{total - used} Seans Kalan</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Son Geçerlilik: {expiryDate.toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
