"use client"

import { useState, useEffect } from "react"
import { format, addDays, startOfWeek, endOfWeek, isSameDay, subWeeks, addWeeks } from "date-fns"
import { tr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, parseUTCTime } from "@/lib/utils"
import { getDashboardStats } from "@/app/stats-actions"
import { getAppointments } from "@/app/appointment-actions"
import { getWaitlist, removeFromWaitlist, promoteFromWaitlist } from "@/app/waitlist-actions"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types
type ViewType = "week" | "day" | "list"
type ClassType = "reformer" | "mat" | "private"

interface Appointment {
    id: string
    title: string
    instructor: string
    participants: string[]
    type: ClassType
    startTime: Date
    duration: number // minutes
    attendees: number
    maxAttendees: number
    status: "scheduled" | "completed" | "cancelled" | "confirmed"
    rawAppointments: any[]
}

export function WeeklyCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [stats, setStats] = useState({
        totalMembers: 0,
        completedClasses: 0,
        totalClasses: 0,
        availableHours: 0
    })
    const [loading, setLoading] = useState(false)
    const [view, setView] = useState<ViewType>("week")

    // Waitlist State
    const [waitlist, setWaitlist] = useState<any[]>([])
    const [loadingWaitlist, setLoadingWaitlist] = useState(false)

    // Dialog State
    const [selectedSlot, setSelectedSlot] = useState<Appointment | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    // Fetch waitlist when dialog opens
    useEffect(() => {
        if (selectedSlot && detailOpen) {
            setLoadingWaitlist(true)
            getWaitlist(selectedSlot.id)
                .then(res => {
                    if (res.success) {
                        setWaitlist(res.data || [])
                    }
                })
                .finally(() => setLoadingWaitlist(false))
        }
    }, [selectedSlot, detailOpen])

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

    useEffect(() => {
        setLoading(true)

        // Fetch Appointments (Now returns class_sessions)
        const fetchAppointments = getAppointments(weekStart.toISOString(), weekEnd.toISOString())
        // Fetch Stats (Global)
        const fetchStats = getDashboardStats()

        Promise.all([fetchAppointments, fetchStats])
            .then(([resApts, resStats]) => {
                if (resApts.success && resApts.data) {
                    const rawData = resApts.data

                    // Map class_sessions to Appointment interface
                    const processedAppointments: Appointment[] = rawData.map((session: any) => {
                        let type: ClassType = 'private'
                        if (session.service_id?.toLowerCase().includes('reformer')) type = 'reformer'
                        else if (session.service_id?.toLowerCase().includes('mat')) type = 'mat'

                        // Extract participants from nested appointments
                        const activeAppointments = session.appointments?.filter((a: any) => a.status !== 'cancelled') || []
                        const participantNames = activeAppointments.map((a: any) => a.customer?.name || "Bilinmiyor")

                        // Instructor Label
                        let instructorLabel = session.staff?.full_name || "Eğitmen Yok"

                        // Helper for Turkish Titles
                        const getTurkishTitle = (id: string) => {
                            const map: Record<string, string> = {
                                'private': 'ÖZEL DERS',
                                'reformer': 'ALETLİ PİLATES',
                                'mat': 'MAT PİLATES'
                            }
                            return map[id?.toLowerCase()] || id?.toUpperCase() || 'DERS'
                        }

                        return {
                            id: session.id,
                            title: getTurkishTitle(session.service_id),
                            instructor: instructorLabel,
                            participants: participantNames,
                            type: type,
                            startTime: parseUTCTime(session.start_time),
                            duration: (parseUTCTime(session.end_time).getTime() - parseUTCTime(session.start_time).getTime()) / 60000,
                            attendees: activeAppointments.length,
                            maxAttendees: session.capacity || 1,
                            status: 'confirmed',
                            rawAppointments: session.appointments
                        }
                    })

                    setAppointments(processedAppointments)

                    // Stats logic
                    const total = processedAppointments.length
                    const completed = processedAppointments.filter(a => a.startTime < new Date()).length
                    const hoursBooked = processedAppointments.reduce((acc, curr) => acc + (curr.duration / 60), 0)
                    const totalSlots = 14 * 7

                    setStats(prev => ({
                        ...prev,
                        completedClasses: completed,
                        totalClasses: total,
                        availableHours: Math.max(0, Math.floor(totalSlots - hoursBooked))
                    }))
                }

                if (resStats.success && resStats.data) {
                    setStats(prev => ({ ...prev, totalMembers: resStats.data.stats.totalMembers }))
                }
            })
            .finally(() => setLoading(false))
    }, [currentDate])

    // Generate days of the week
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const timeSlots = Array.from({ length: 15 }, (_, i) => i + 8)

    // Navigation handlers
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))

    const handlePromoteFromWaitlist = async (sessionId: string) => {
        const promise = promoteFromWaitlist(sessionId)

        toast.promise(promise, {
            loading: 'Bekleme listesinden alınıyor...',
            success: (data) => {
                getWaitlist(sessionId).then(res => res.success && setWaitlist(res.data || []))
                setCurrentDate(new Date(currentDate)) // Force refresh
                return 'Kişi derse alındı!'
            },
            error: (err) => `Hata: ${err}`
        })
    }

    const handleRemoveFromWaitlist = async (waitlistId: string, sessionId: string) => {
        const promise = removeFromWaitlist(waitlistId)

        toast.promise(promise, {
            loading: 'Listeden çıkarılıyor...',
            success: () => {
                getWaitlist(sessionId).then(res => res.success && setWaitlist(res.data || []))
                return 'Kişi bekleme listesinden çıkarıldı'
            },
            error: 'İşlem başarısız'
        })
    }
    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
    const goToToday = () => setCurrentDate(new Date())

    const getAppointmentsForSlot = (day: Date, hour: number) => {
        return appointments.filter(apt =>
            isSameDay(apt.startTime, day) && apt.startTime.getHours() === hour
        )
    }

    const getTypeStyles = (type: ClassType) => {
        switch (type) {
            case "reformer": return "bg-purple-100 border-l-4 border-purple-500 text-purple-900"
            case "mat": return "bg-blue-100 border-l-4 border-blue-500 text-blue-900"
            case "private": return "bg-orange-100 border-l-4 border-orange-500 text-orange-900"
            default: return "bg-gray-50 border-gray-500"
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Haftalık Ders Programı</h2>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(weekStart, 'd MMMM', { locale: tr })} - {format(weekEnd, 'd MMMM yyyy', { locale: tr })}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <Button variant="ghost" size="icon" onClick={prevWeek}> <ChevronLeft className="h-4 w-4" /> </Button>
                        <Button variant="ghost" size="icon" onClick={nextWeek}> <ChevronRight className="h-4 w-4" /> </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 text-xs font-medium">
                        Bugüne Dön
                    </Button>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2"> <span className="h-2 w-2 rounded-full bg-purple-500" /> REFORMER </div>
                    <div className="flex items-center gap-2"> <span className="h-2 w-2 rounded-full bg-blue-500" /> MAT PİLATES </div>
                    <div className="flex items-center gap-2"> <span className="h-2 w-2 rounded-full bg-orange-500" /> ÖZEL </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="grid grid-cols-8 border-b">
                    <div className="p-4 border-r bg-slate-50 text-center text-xs font-bold text-slate-400 py-6"> SAAT </div>
                    {weekDays.map((day, i) => {
                        const isToday = isSameDay(day, new Date())
                        return (
                            <div key={i} className={cn("flex flex-col items-center justify-center p-4 border-r last:border-r-0 min-h-[80px]", isToday && "bg-blue-50/50")}>
                                <span className="text-xs font-semibold text-slate-400 uppercase mb-1">{format(day, 'EEE', { locale: tr })}</span>
                                <span className={cn("text-xl font-bold", isToday ? "text-blue-600" : "text-slate-900")}>{format(day, 'd')}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[800px]">
                    {timeSlots.map((hour) => (
                        <div key={hour} className="grid grid-cols-8 min-h-[80px] border-b last:border-b-0">
                            <div className="p-2 border-r text-xs text-slate-400 font-medium text-center pt-4 sticky left-0 bg-white">
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </div>
                            {weekDays.map((day, dayIndex) => {
                                const appointments = getAppointmentsForSlot(day, hour)
                                return (
                                    <div key={dayIndex} className="relative p-1 border-r last:border-r-0 hover:bg-slate-50/30 transition-colors group h-full bg-white">
                                        {appointments.map(apt => (
                                            <div key={apt.id}
                                                className={cn("absolute w-[95%] left-[2.5%] p-2 rounded-md shadow-sm text-xs cursor-pointer hover:shadow-md transition-shadow z-10 overflow-hidden", getTypeStyles(apt.type))}
                                                style={{ top: '2px', height: 'calc(100% - 4px)' }}
                                                onClick={() => {
                                                    setSelectedSlot(apt)
                                                    setDetailOpen(true)
                                                }}
                                            >
                                                <div className="font-bold text-slate-900 leading-tight truncate mt-0.5">
                                                    {apt.instructor}
                                                </div>
                                                <div className="text-[10px] mt-1 opacity-80 truncate">
                                                    {apt.participants.length} / {apt.maxAttendees} Kişi
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSlot?.title} Detayları</DialogTitle>
                    </DialogHeader>
                    {selectedSlot && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <span className="text-slate-500 block text-xs">Tarih</span>
                                    <span className="font-medium">
                                        {format(selectedSlot.startTime, 'd MMMM yyyy', { locale: tr })}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <span className="text-slate-500 block text-xs">Saat</span>
                                    <span className="font-medium">
                                        {format(selectedSlot.startTime, 'HH:mm')}
                                    </span>
                                </div>
                            </div>

                            <Tabs defaultValue="participants" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="participants">Katılımcılar ({selectedSlot.participants.length})</TabsTrigger>
                                    <TabsTrigger value="waitlist">Bekleme Listesi ({waitlist?.length || 0})</TabsTrigger>
                                </TabsList>

                                <TabsContent value="participants" className="mt-4">
                                    <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                                        {selectedSlot.participants.length > 0 ? (
                                            selectedSlot.participants.map((name, i) => (
                                                <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                                    <span className="text-sm font-medium">{name}</span>
                                                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                                        Onaylı
                                                    </Badge>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-slate-500">
                                                Henüz katılımcı yok
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="waitlist" className="mt-4">
                                    <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                                        {loadingWaitlist ? (
                                            <div className="p-4 text-center text-sm text-slate-500">Yükleniyor...</div>
                                        ) : waitlist && waitlist.length > 0 ? (
                                            waitlist.map((entry, i) => (
                                                <div key={entry.id} className="p-3 flex items-center justify-between hover:bg-slate-50 group">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center rounded-full p-0">
                                                            {entry.position}
                                                        </Badge>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{entry.customer?.name || "İsimsiz"}</span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {format(new Date(entry.created_at), 'd MMM HH:mm', { locale: tr })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {i === 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="h-7 text-[10px] bg-green-600 hover:bg-green-700"
                                                                onClick={() => handlePromoteFromWaitlist(selectedSlot.id)}
                                                                disabled={selectedSlot.attendees >= selectedSlot.maxAttendees}
                                                            >
                                                                Derse Al
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleRemoveFromWaitlist(entry.id, selectedSlot.id)}
                                                        >
                                                            Çıkar
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-slate-500">
                                                Bekleme listesi boş
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                                <span>Eğitmen: {selectedSlot.instructor}</span>
                                <Button variant="outline" onClick={() => setDetailOpen(false)}>Kapat</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bottom Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Toplam Üye</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.totalMembers}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Tamamlanan Dersler</p>
                            <p className="text-3xl font-bold text-slate-900">
                                {stats.completedClasses} <span className="text-lg text-slate-400 font-normal">/ {stats.totalClasses}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Müsait Saatler</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.availableHours}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FAB is handled in ProgramClient now */}
        </div>
    )
}
