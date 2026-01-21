"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"

interface PackageStatusProps {
    pkg: any // Active Package Data
}

export function PackageStatus({ pkg }: PackageStatusProps) {
    if (!pkg) {
        return (
            <Card className="h-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-500">
                    <p>Aktif paketiniz bulunmuyor.</p>
                    <p className="text-sm mt-2">Yeni bir paket satın almak için stüdyo ile iletişime geçin.</p>
                </CardContent>
            </Card>
        )
    }

    const totalSessions = pkg.sessions
    const usedSessions = pkg.usedSessions || 0
    const remainingSessions = totalSessions - usedSessions
    const progress = (usedSessions / totalSessions) * 100

    return (
        <Card className="border-none shadow-sm bg-white h-full relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">Aktif Paket Durumu</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Yenilenme: {new Date(new Date().setDate(new Date().getDate() + pkg.duration_days)).toLocaleDateString('tr-TR')}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-sm text-slate-500">Aletli Pilates - Başlangıç Seviyesi</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-slate-600">Kullanım</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-blue-600">{usedSessions}</span>
                            <span className="text-sm text-slate-400">/{totalSessions}</span>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-100" indicatorClassName="bg-blue-600" />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center text-[10px] font-bold">i</span>
                    {usedSessions} seans kullanıldı, {remainingSessions} seans kaldı.
                </div>
            </CardContent>
        </Card>
    )
}
