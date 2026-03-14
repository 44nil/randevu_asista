"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, User, ChevronLeft, ChevronRight, Calendar, Users as UsersIcon, Clock, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DailyScheduleProps {
    data: any[]
}

import { useOrganization } from "@/providers/organization-provider"

export function DailySchedule({ data }: DailyScheduleProps) {
    const { config } = useOrganization()
    const [selectedItem, setSelectedItem] = useState<any | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    if (!data || data.length === 0) {
        return (
            <Card className="col-span-1 lg:col-span-2 h-fit">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold">Bugünkü {config.labels.appointment} Programı</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <Calendar className="h-12 w-12 opacity-20" />
                        <p>Bugün için planlanmış {config.labels.appointment.toLowerCase()} bulunmuyor.</p>
                        <Button variant="outline" className="mt-2">{config.labels.createAppointment}</Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Grouping Logic
    const groupedData: any[] = []
    const groups: Record<string, any[]> = {}

    data.forEach(item => {
        const key = `${item.start_time}-${item.service_id || 'unknown'}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
    })

    Object.values(groups).forEach(group => {
        const first = group[0]
        const customers = group.map(g => g.customer?.name || "İsimsiz").filter((v, i, a) => a.indexOf(v) === i) // unique names

        groupedData.push({
            ...first,
            groupedCustomers: customers,
            isGroupClass: group.length > 1
        })
    })

    return (
        <Card className="col-span-1 lg:col-span-2 h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Bugünkü {config.labels.appointment} Programı</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {groupedData.map((item, index) => {
                        const startTime = new Date(item.start_time)
                        const endTime = new Date(item.end_time)
                        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

                        // Determine type based on service_id or title
                        const isGroup = item.isGroupClass || item.service_id?.toLowerCase().includes('grup')

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-4 p-4 rounded-xl border bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setSelectedItem(item)
                                    setDetailOpen(true)
                                }}
                            >
                                <div className="flex flex-col items-center justify-center min-w-[60px] border-r pr-4">
                                    <span className="text-sm font-bold text-slate-900">
                                        {format(startTime, 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-slate-500">{duration} DK</span>
                                </div>

                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    {isGroup ? <UsersIcon className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900">
                                        {item.groupedCustomers.length > 2
                                            ? `${item.groupedCustomers[0]} +${item.groupedCustomers.length - 1} kişi`
                                            : item.groupedCustomers.join(", ")}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        {config.appointmentTypes?.find((t: any) => t.value === item.service_id)?.label || item.service_id || config.labels.appointment}
                                        {item.staff_name && <> • {item.staff_name}</>}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {item.status === 'completed' && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                            TAMAMLANDI
                                        </Badge>
                                    )}
                                    {item.status === 'confirmed' && (
                                        <Badge className="bg-blue-600 hover:bg-blue-700">
                                            ONAYLI
                                        </Badge>
                                    )}
                                    {item.status === 'pending' && (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                                            BEKLİYOR
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{config.labels.appointment} Detayları</DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    {selectedItem.isGroupClass ? <UsersIcon className="h-6 w-6" /> : <User className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900">
                                        {config.appointmentTypes?.find((t: any) => t.value === selectedItem.service_id)?.label || selectedItem.service_id || config.labels.appointment}
                                    </h4>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(selectedItem.start_time), 'HH:mm')} -
                                        {format(new Date(selectedItem.end_time), 'HH:mm')} ({Math.round((new Date(selectedItem.end_time).getTime() - new Date(selectedItem.start_time).getTime()) / 60000)} dk)
                                    </p>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-slate-50">
                                <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">Katılımcı Listesi</h5>
                                <div className="space-y-2">
                                    {selectedItem.groupedCustomers.map((name: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                                            <span className="text-sm font-medium">{name}</span>
                                            <Badge variant="outline" className="gap-1 text-green-600 bg-green-50 border-green-200">
                                                <CheckCircle className="h-3 w-3" /> Onaylı
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDetailOpen(false)}>Kapat</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    )
}
