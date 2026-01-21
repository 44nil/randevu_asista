"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface SalesPanelProps {
    data: any[]
}

export function SalesPanel({ data }: SalesPanelProps) {
    const router = useRouter()

    // Format currency helper (could be moved to utils)
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold">Yeni Satışlar</CardTitle>
                <Button variant="link" className="text-xs text-blue-600 h-auto p-0" onClick={() => router.push('/packages')}>
                    Tümünü Gör
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {(!data || data.length === 0) ? (
                        <div className="text-sm text-slate-500 text-center py-4">Henüz satış yapılmadı.</div>
                    ) : (
                        data.map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 mt-1">
                                    <ShoppingCart className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h5 className="text-sm font-semibold text-slate-900">
                                            {item.package?.name || "Bilinmeyen Paket"}
                                        </h5>
                                        <span className="text-xs text-slate-400">
                                            {formatDistanceToNow(new Date(item.sale_date), { addSuffix: true, locale: tr })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-slate-500">{item.customer?.name || "Müşteri"}</p>
                                        <span className="text-xs font-medium text-slate-600">• {formatCurrency(item.amount)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
