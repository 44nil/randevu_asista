"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Package, CheckCircle2 } from "lucide-react"

interface HistoryStatsProps {
    stats: {
        totalCredits: number
        activePackages: number
        completedSessions: number
    }
}

export function HistoryStats({ stats }: HistoryStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border">
                <CardContent className="p-6 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">KALAN TOPLAM KREDİ</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.totalCredits} Seans</h3>
                        <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
                            📉 -2 seans bu hafta
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Wallet className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border">
                <CardContent className="p-6 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AKTİF PAKETLER</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.activePackages} Adet</h3>
                        <p className="text-xs text-blue-500 font-medium mt-2">
                            1 paket yakında bitiyor
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border">
                <CardContent className="p-6 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">TAMAMLANAN DERSLER</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.completedSessions} Seans</h3>
                        <p className="text-xs text-green-600 font-medium mt-2">
                            📈 +4 seans bu ay
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
