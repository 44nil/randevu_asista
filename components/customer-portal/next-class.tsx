"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, User, Clock, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface NextClassProps {
    appointment: any
}

export function NextClass({ appointment }: NextClassProps) {
    if (!appointment) {
        return (
            <Card className="bg-blue-600 text-white border-none shadow-lg overflow-hidden relative">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                <CardContent className="flex flex-col items-center justify-center py-12 text-center relative z-10">
                    <Calendar className="h-10 w-10 text-blue-200 mb-3" />
                    <h3 className="font-bold text-lg mb-1">Planlanmış Dersin Yok</h3>
                    <p className="text-blue-100 text-sm mb-4">Kendine bir iyilik yap ve hemen rezervasyon oluştur.</p>
                    <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                        Rezervasyon Yap
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const date = new Date(appointment.start_time)
    const dayName = format(date, 'd', { locale: tr })
    const monthName = format(date, 'MMM', { locale: tr }).toUpperCase()
    const timeRange = `${format(date, 'HH:mm')} - ${format(new Date(appointment.end_time), 'HH:mm')}`
    const instructor = appointment.staff?.full_name || "Eğitmen Atanmadı"
    const service = appointment.service_id || "Reformer Pilates"

    return (
        <Card className="bg-blue-600 text-white border-none shadow-lg overflow-hidden relative group">
            {/* Decorative background elements matching design */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700" />

            <CardHeader className="relative z-10 pb-2">
                <div className="text-xs font-bold tracking-widest uppercase text-blue-200 mb-1">Sıradaki Dersin</div>
            </CardHeader>

            <CardContent className="relative z-10 pb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[70px]">
                        <div className="text-xs text-blue-200 font-bold uppercase">{monthName}</div>
                        <div className="text-3xl font-black">{dayName}</div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold leading-tight">{service}</h3>
                        <div className="flex items-center gap-2 text-blue-100 text-sm mt-1">
                            <Clock className="h-3 w-3" />
                            {timeRange}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <div className="text-blue-200 text-xs font-medium">Eğitmen</div>
                            <div className="font-semibold">{instructor}</div>
                        </div>
                    </div>
                    <Button size="sm" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 text-xs h-8 px-3">
                        Detaylar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
