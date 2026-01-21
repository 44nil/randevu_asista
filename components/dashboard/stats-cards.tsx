"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CalendarCheck, CreditCard, Package } from "lucide-react"

interface StatsCardsProps {
    data: {
        totalMembers: number
        todayAttendance: number
        monthlyRevenue: number
        activePackages: number
    }
}

export function StatsCards({ data }: StatsCardsProps) {
    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Kart 1: Toplam Üye */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                        Toplam Üye
                    </CardTitle>
                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalMembers}</div>
                    <p className="text-xs text-green-600 font-medium flex items-center">
                        Aktif üyeler
                    </p>
                </CardContent>
            </Card>

            {/* Kart 2: Günlük Katılım */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                        Bugünkü Randevular
                    </CardTitle>
                    <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                        <CalendarCheck className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.todayAttendance}</div>
                    <p className="text-xs text-orange-600 font-medium flex items-center">
                        Bugün için kayıtlı ders
                    </p>
                </CardContent>
            </Card>

            {/* Kart 3: Aylık Ciro */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                        Aylık Ciro
                    </CardTitle>
                    <div className="h-8 w-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.monthlyRevenue)}</div>
                    <p className="text-xs text-green-500 font-medium flex items-center">
                        Bu ayki satışlar
                    </p>
                </CardContent>
            </Card>

            {/* Kart 4: Aktif Paketler */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                        Aktif Paketler
                    </CardTitle>
                    <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.activePackages}</div>
                    <p className="text-xs text-purple-600 font-medium flex items-center">
                        Satışa açık paketler
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
