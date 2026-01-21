"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface RevenueChartProps {
    data: { name: string, value: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    const maxValue = Math.max(...data.map(d => d.value), 1000)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Aylık Gelir Analizi (Son 6 Ay)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] flex items-end justify-between gap-2 pt-6">
                    {data.map((item, index) => {
                        const heightPercentage = (item.value / maxValue) * 100
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {formatCurrency(item.value)}
                                </div>
                                <div
                                    className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all relative group-hover:shadow-lg"
                                    style={{ height: `${heightPercentage}%` }}
                                >
                                </div>
                                <div className="text-xs text-slate-500 font-medium">{item.name}</div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
