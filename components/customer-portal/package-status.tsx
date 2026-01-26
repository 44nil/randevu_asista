"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"

interface PackageStatusProps {
    pkg: any // Active Package Data
    lastUsage?: any[] // Recent usage history
}

import { useOrganization } from "@/providers/organization-provider"

export function PackageStatus({ pkg, lastUsage = [] }: PackageStatusProps) {
    const { config } = useOrganization()
    if (!pkg) {
        return (
            <Card className="h-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-500">
                    <p>Aktif {config.labels.package ? config.labels.package.toLowerCase() : 'hizmet'}iniz bulunmuyor.</p>
                    <p className="text-sm mt-2">Yeni bir {config.labels.package ? config.labels.package.toLowerCase() : 'hizmet'} satın almak için stüdyo ile iletişime geçin.</p>
                </CardContent>
            </Card>
        )
    }

    const totalSessions = pkg.totalCredits || 1
    const remainingSessions = pkg.remainingCredits || 0
    const usedSessions = totalSessions - remainingSessions
    const progress = (usedSessions / totalSessions) * 100

    // Format Expiry Date
    const expiryDate = pkg.expiryDate ? new Date(pkg.expiryDate) : null
    const formattedDate = expiryDate ? expiryDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Süresiz"

    return (
        <Card className="border-none shadow-sm bg-white h-full relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">Aktif {config.labels.package} Durumu</CardTitle>
                </div>
                {expiryDate && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        Son Kul: {formattedDate}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-sm text-slate-500">
                        {remainingSessions === 0 ? `${config.labels.package}iniz doldu` : "Kullanıma açık"}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-slate-600">Kullanılan</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-blue-600">{usedSessions}</span>
                            <span className="text-sm text-slate-400">/{totalSessions}</span>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-100" indicatorClassName="bg-blue-600" />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pb-2 border-b border-slate-50">
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center text-[10px] font-bold">i</span>
                    {remainingSessions} {config.labels.session ? config.labels.session.toLowerCase() : 'seans'} hakkınız kaldı.
                </div>

                {/* Recent Usage Display */}
                {lastUsage && lastUsage.length > 0 && (
                    <div className="space-y-3 pt-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Son Kullanımlar</p>
                        <div className="space-y-2">
                            {lastUsage.map((usage: any) => (
                                <div key={usage.id} className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-700 font-medium">
                                            {new Date(usage.start_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{usage.service_id}</span>
                                    </div>
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                                        -1 {config.labels.session}
                                        {usage.status === 'confirmed' && (
                                            <span className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded-sm ml-1">PLANLI</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
