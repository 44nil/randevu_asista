"use client"

import { useEffect, useState } from "react"
import { getAppointments } from "@/app/appointment-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { toast } from "sonner"

interface Appointment {
    id: string
    start_time: string
    end_time: string
    service_id: string
    status: string
    customer?: {
        name: string
    } | { name: string }[]
}

export function AppointmentCalendar() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    const loadAppointments = async () => {
        setLoading(true)
        const result = await getAppointments()
        if (result.success) {
            setAppointments(result.data)
        } else {
            toast.error("Randevular yüklenemedi", { description: result.error })
        }
        setLoading(false)
    }

    useEffect(() => {
        loadAppointments()
    }, [])

    if (loading) {
        return <div className="p-4">Yükleniyor...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Bugünün Randevuları</h3>
                    <p className="text-sm text-muted-foreground">
                        {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}
                    </p>
                </div>
                <Button>
                    <Calendar className="mr-2 h-4 w-4" />
                    Yeni Randevu
                </Button>
            </div>

            {appointments.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground py-8">
                            <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Bugün için randevu bulunmuyor</p>
                            <p className="text-sm mt-2">Yeni randevu eklemek için yukarıdaki butonu kullanın</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {appointments.map((appointment) => {
                        const start = new Date(appointment.start_time)
                        const end = new Date(appointment.end_time)
                        const duration = (end.getTime() - start.getTime()) / 60000

                        return (
                            <Card key={appointment.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {Array.isArray(appointment.customer)
                                                    ? appointment.customer[0]?.name
                                                    : appointment.customer?.name || "Müşteri"}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(start, "HH:mm")}
                                                </span>
                                                <span>{duration} dakika</span>
                                                {appointment.service_id && (
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs uppercase">
                                                        {appointment.service_id}
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">Düzenle</Button>
                                            <Button variant="outline" size="sm">İptal</Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
