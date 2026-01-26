"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CreditCard, Wallet } from "lucide-react"

interface Sale {
    id: string
    price: number
    date: string
    customerName: string
    customerEmail?: string
    packageName: string
}

interface RecentSalesProps {
    data: Sale[]
}

import { useOrganization } from "@/providers/organization-provider"

export function RecentSales({ data }: RecentSalesProps) {
    const { config } = useOrganization()
    return (
        <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900">Son Satış İşlemleri</h3>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    Tümünü Gör
                </Button>
            </div>

            <div className="space-y-4">
                {/* Header Row */}
                <div className="grid grid-cols-4 text-xs font-semibold text-slate-500 pb-2 border-b uppercase">
                    <div>{config.labels.customer}</div>
                    <div>Satın Alınan {config.labels.package}</div>
                    <div>Tarih</div>
                    <div className="text-right">Tutar</div>
                </div>

                {/* Rows */}
                {data.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                        Henüz satış işlemi yok.
                    </div>
                ) : (
                    data.map((sale) => (
                        <div key={sale.id} className="grid grid-cols-4 items-center">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-blue-50 text-blue-600 border">
                                    <AvatarFallback>{sale.customerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-slate-900">{sale.customerName}</span>
                            </div>
                            <div className="text-sm text-slate-600">
                                {sale.packageName || `Bilinmeyen ${config.labels.package}`}
                            </div>
                            <div className="text-sm text-slate-500">
                                {format(new Date(sale.date), "d MMM yyyy", { locale: tr })}
                            </div>
                            <div className="text-right font-bold text-slate-900">
                                {formatCurrency(sale.price)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
