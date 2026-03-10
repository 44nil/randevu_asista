'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Users,
    Plus,
    MoreHorizontal,
    CheckCircle,
    Search,
    Filter
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn, parseUTCTime } from "@/lib/utils"
import { useOrganization } from "@/providers/organization-provider"
import { getAppointments } from "@/app/appointment-actions"
import { AppointmentForm } from "@/components/forms/appointment-form"
import { useSession } from "@clerk/nextjs"
import { getStaffList } from "@/app/staff-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ClassType = 'reformer' | 'mat' | 'private'

interface Appointment {
    id: string
    title: string
    instructor: string
    participants: string[]
    type: ClassType
    startTime: Date
    duration: number
    attendees: number
    maxAttendees: number
    status: 'confirmed' | 'cancelled' | 'pending'
    rawAppointments?: any[]
}

export function WeeklyCalendar() {
    const { config } = useOrganization()
    const { session } = useSession()
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Appointment | null>(null)
    const [stats, setStats] = useState({
        totalMembers: 0,
        completedClasses: 0,
        totalClasses: 0,
        availableHours: 0
    })
    const [staffList, setStaffList] = useState<any[]>([])
    const [selectedStaffId, setSelectedStaffId] = useState<string>("all")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const weekEnd = addDays(weekStart, 6)
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 - 21:00

    useEffect(() => {
        const fetchStaff = async () => {
            const res = await getStaffList()
            if (res.success) setStaffList(res.data || [])
        }
        fetchStaff()
    }, [])

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true)
            try {
                const res = await getAppointments(
                    weekStart.toISOString(),
                    weekEnd.toISOString(),
                    selectedStaffId === "all" ? undefined : selectedStaffId
                )
                const resStats: any = { success: true, data: { stats: { totalMembers: 0 } } } // Placeholder, logic from original

                if (res.success && res.data) {
                    const sessions = res.data

                    const processedAppointments: Appointment[] = sessions.map((session: any) => {
                        const sId = session.service_id || ""

                        // Randevu tipinin label'ını config'den bul
                        const typeConfig = config.appointmentTypes?.find(t => t.value === sId)
                        const title = typeConfig?.label || config.labels.appointment

                        // Map service to a color-type (reformer: navy, mat: electric, private: green)
                        let appointmentCategory: ClassType = 'reformer'
                        // Renk kategorisini config'deki sıraya göre belirle — tüm sektörler için çalışır
                        const typeIndex = config.appointmentTypes?.findIndex(t => t.value === sId) ?? 0
                        const colorMap: ClassType[] = ['reformer', 'mat', 'private']
                        appointmentCategory = colorMap[typeIndex % 3] ?? 'reformer'

                        const activeAppointments = session.appointments?.filter((a: any) => a.status !== 'cancelled') || []
                        const participantNames = activeAppointments.map((a: any) => a.customer?.name || "Bilinmiyor")
                        let instructorLabel = session.staff?.full_name || `Atanmadı`

                        return {
                            id: session.id,
                            title: title,
                            instructor: instructorLabel,
                            participants: participantNames,
                            type: appointmentCategory,
                            startTime: parseUTCTime(session.start_time),
                            duration: (parseUTCTime(session.end_time).getTime() - parseUTCTime(session.start_time).getTime()) / 60000,
                            attendees: activeAppointments.length,
                            maxAttendees: session.capacity || 1,
                            status: 'confirmed',
                            rawAppointments: session.appointments
                        }
                    })

                    setAppointments(processedAppointments)

                    const total = processedAppointments.length
                    const completed = processedAppointments.filter(a => a.startTime < new Date()).length
                    const hoursBooked = processedAppointments.reduce((acc, curr) => acc + (curr.duration / 60), 0)
                    setStats(prev => ({
                        ...prev,
                        completedClasses: completed,
                        totalClasses: total,
                        availableHours: Math.max(0, Math.floor(14 * 7 - hoursBooked))
                    }))
                }
            } catch (error) {
                console.error("Fetch error:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAppointments()
    }, [weekStart, config.labels.customer, selectedStaffId])

    const nextWeek = () => setWeekStart(addWeeks(weekStart, 1))
    const prevWeek = () => setWeekStart(subWeeks(weekStart, 1))
    const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

    const getAppointmentsForSlot = (day: Date, hour: number) => {
        return appointments.filter(apt =>
            isSameDay(apt.startTime, day) && apt.startTime.getHours() === hour
        )
    }

    const categoryColors: Record<ClassType, { bg: string, border: string, text: string }> = {
        reformer: { bg: 'rgba(46, 102, 241, 0.08)', border: '#2E66F1', text: '#2E66F1' },
        mat:      { bg: 'rgba(236, 72, 153, 0.08)', border: '#EC4899', text: '#EC4899' },
        private:  { bg: 'rgba(16, 185, 129, 0.08)', border: '#10B981', text: '#10B981' }
    }

    return (
        <div className="space-y-8 font-sans relative z-10">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-7 rounded-card border-none shadow-brand">
                <div>
                    <h2 className="text-xl font-extrabold text-navy tracking-tight leading-tight uppercase">
                        {config.labels.program}
                    </h2>
                    <div className="flex items-center gap-2 text-t2 text-xs font-medium mt-1.5 translate-y-0.5">
                        <CalendarIcon className="h-4 w-4 text-electric" />
                        <span>{format(weekStart, 'd MMMM', { locale: tr })} - {format(weekEnd, 'd MMMM yyyy', { locale: tr })}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {staffList.length > 0 && (
                        <div className="mr-2 flex items-center gap-2">
                            <Filter className="h-4 w-4 text-t3" />
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger className="w-[180px] h-9 bg-bg border-none shadow-none text-xs font-bold text-navy">
                                    <SelectValue placeholder="Personel Filtrele" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-border-brand/30 shadow-elevated">
                                    <SelectItem value="all" className="text-xs font-medium">Tüm Ekip</SelectItem>
                                    {staffList.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="text-xs font-medium">{s.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="flex items-center bg-bg rounded-[10px] p-1">
                        <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8 text-navy hover:bg-surface rounded-btn"> <ChevronLeft className="h-4 w-4" /> </Button>
                        <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8 text-navy hover:bg-surface rounded-btn"> <ChevronRight className="h-4 w-4" /> </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday} className="h-9 px-4 text-xs font-bold text-navy border-border-brand border-[1.5px] rounded-btn hover:bg-bg transition-all">
                        Bugün
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="h-9 px-4 bg-electric text-white rounded-btn font-bold text-xs gap-2 shadow-cta hover:bg-navy transition-all">
                                <Plus className="h-4 w-4" /> Yeni
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Yeni {config.labels.appointment}</DialogTitle>
                            </DialogHeader>
                            <AppointmentForm
                                staffId={session?.user?.id}
                                onSuccess={() => {
                                    window.location.reload()
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center justify-center">
                    <div className="flex items-center gap-12 flex-wrap bg-white p-5 rounded-[24px] px-12 border border-border-brand/10 shadow-sm max-w-fit transition-all hover:shadow-brand">
                        {config.appointmentTypes?.map((type, i) => {
                            const colorKeys: ClassType[] = ['reformer', 'mat', 'private']
                            const colorKey = colorKeys[i % 3]
                            return (
                                <div key={type.value} className="flex items-center gap-4">
                                    <div className="size-5 rounded-full" style={{ backgroundColor: categoryColors[colorKey].border }}></div>
                                    <span className="text-[13px] font-bold text-slate-700 uppercase tracking-widest leading-none">
                                        {type.label.toUpperCase()}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-card border-none shadow-brand overflow-hidden min-h-[600px] flex flex-col">
                <div className="grid grid-cols-8 border-b border-border-brand/40">
                    <div className="p-4 border-r border-border-brand/40 bg-bg/30 text-center text-[11px] font-extrabold text-t3 py-8 flex items-center justify-center uppercase tracking-widest">
                        SAAT
                    </div>
                    {weekDays.map((day, i) => {
                        const isToday = isSameDay(day, new Date())
                        return (
                            <div key={i} className={cn(
                                "flex flex-col items-center justify-center p-5 border-r border-border-brand/40 last:border-r-0 min-h-[90px] transition-all",
                                isToday && "bg-electric/5"
                            )}>
                                <span className={cn(
                                    "text-[10px] font-extrabold uppercase tracking-widest mb-1.5",
                                    isToday ? "text-electric" : "text-t3"
                                )}>
                                    {format(day, 'EEE', { locale: tr })}
                                </span>
                                <span className="text-2xl font-extrabold tabular-nums tracking-tighter" >
                                    {format(day, 'd')}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[800px]">
                    {timeSlots.map((hour) => (
                        <div key={hour} className="grid grid-cols-8 min-h-[95px] border-b border-border-brand/40 last:border-b-0">
                            <div className="p-2 border-r border-border-brand/40 text-[12px] text-t3 font-bold text-center pt-5 sticky left-0 bg-white/95 backdrop-blur-sm z-20">
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </div>
                            {weekDays.map((day, dayIndex) => {
                                const activeSlotAppointments = getAppointmentsForSlot(day, hour)
                                return (
                                    <div key={dayIndex} className="relative p-1.5 border-r border-border-brand/40 last:border-r-0 hover:bg-bg/20 transition-colors group h-full bg-white">
                                        {activeSlotAppointments.map(apt => (
                                            <div key={apt.id}
                                                className={cn(
                                                    "absolute w-[92%] left-[4%] py-2.5 px-3 rounded-r-[14px] cursor-pointer hover:shadow-elevated transition-all duration-300 z-10 overflow-hidden flex flex-col border-l-[6px] shadow-brand"
                                                )}
                                                style={{
                                                    top: '3px',
                                                    height: 'calc(100% - 6px)',
                                                    backgroundColor: categoryColors[apt.type]?.bg || categoryColors.reformer.bg,
                                                    borderLeftColor: categoryColors[apt.type]?.border || categoryColors.reformer.border
                                                }}
                                                onClick={() => {
                                                    setSelectedSlot(apt)
                                                    setDetailOpen(true)
                                                }}
                                            >
                                                <div className="flex flex-col h-full min-w-0">
                                                    <p className="text-[10px] font-extrabold uppercase tracking-widest truncate leading-tight mb-1.5"
                                                        style={{ color: categoryColors[apt.type]?.border || categoryColors.reformer.border }}>
                                                        {apt.title}
                                                    </p>

                                                    <p className="text-[13px] font-extrabold text-navy leading-tight truncate tracking-tight">
                                                        {apt.participants.length > 0 ? apt.participants[0] : "Boş Randevu"}
                                                    </p>

                                                    <div className="mt-auto">
                                                        {apt.maxAttendees > 1 ? (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${(apt.attendees / apt.maxAttendees) * 100}%`,
                                                                            backgroundColor: categoryColors[apt.type]?.border || categoryColors.reformer.border
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-[11px] font-bold text-navy/60 shrink-0">
                                                                    {apt.attendees >= apt.maxAttendees ? "DOLU" : `${apt.attendees}/${apt.maxAttendees}`}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-[11px] text-t2 font-bold bg-white/50 self-start px-2 py-0.5 rounded-full mt-2 border border-border-brand/10">
                                                                Bireysel
                                                            </div>
                                                        )}
                                                    </div>
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


            {/* Stats/Summary Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-7 rounded-card border-none shadow-brand flex items-center gap-6 transition-all hover:shadow-elevated">
                    <div className="size-16 rounded-[14px] bg-bg flex items-center justify-center text-electric">
                        <Users className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-t3 uppercase tracking-wider leading-none mb-1.5">Toplam {config.labels.customer}</p>
                        <p className="text-3xl font-extrabold text-navy tracking-tighter">{stats.totalMembers}</p>
                    </div>
                </div>

                <div className="bg-navy p-7 rounded-card border-none shadow-brand flex items-center gap-6 transition-all hover:scale-[1.02]">
                    <div className="size-16 rounded-[14px] bg-navy-mid flex items-center justify-center text-accent">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-t3 uppercase tracking-wider leading-none mb-1.5">Tamamlanan Randevular</p>
                        <p className="text-3xl font-extrabold text-white tracking-tighter">
                            {stats.completedClasses} <span className="text-sm text-t3 font-normal">/ {stats.totalClasses}</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white p-7 rounded-card border-none shadow-brand flex items-center gap-6 transition-all hover:shadow-elevated">
                    <div className="size-16 rounded-[14px] bg-surface flex items-center justify-center text-navy">
                        <Clock className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-t3 uppercase tracking-wider leading-none mb-1.5">Müsait Saatler</p>
                        <p className="text-3xl font-extrabold text-navy tracking-tighter">{stats.availableHours}</p>
                    </div>
                </div>
            </div>

            {/* Appointment Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none text-navy">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Randevu Detayı</DialogTitle>
                    </DialogHeader>
                    {selectedSlot && (
                        <div className="relative">
                            {/* Color Header */}
                            <div className="h-2 w-full" style={{ backgroundColor: categoryColors[selectedSlot.type]?.border || categoryColors.reformer.border }}></div>

                            <div className="p-8 space-y-8 bg-white overflow-visible relative">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-border-brand/30 text-t3">
                                            {selectedSlot.id.substring(0, 8)}
                                        </Badge>
                                        {config.features.classes && (
                                            <Badge className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1"
                                                style={{
                                                    backgroundColor: categoryColors[selectedSlot.type]?.bg || categoryColors.reformer.bg,
                                                    color: categoryColors[selectedSlot.type]?.border || categoryColors.reformer.border
                                                }}>
                                                {selectedSlot.type === 'private' ? 'ÖZEL' : 'GRUP'} {config.labels.appointment}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-navy uppercase tracking-tight leading-tight">
                                        {selectedSlot.title}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-bg/50 p-4 rounded-[14px] border border-border-brand/10">
                                        <p className="text-[9px] font-black text-t3 uppercase tracking-widest mb-1">TARİH</p>
                                        <p className="text-xs font-bold text-navy">{format(selectedSlot.startTime, 'd MMMM EEEE', { locale: tr })}</p>
                                    </div>
                                    <div className="bg-bg/50 p-4 rounded-[14px] border border-border-brand/10">
                                        <p className="text-[9px] font-black text-t3 uppercase tracking-widest mb-1">SAAT</p>
                                        <p className="text-xs font-bold text-navy">
                                            {format(selectedSlot.startTime, 'HH:mm')} - {format(new Date(selectedSlot.startTime.getTime() + selectedSlot.duration * 60000), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-bg/30 p-4 rounded-[14px] border border-border-brand/10">
                                    <div className="h-10 w-10 rounded-full bg-white shadow-brand flex items-center justify-center font-black text-electric">
                                        {selectedSlot.instructor?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-t3 uppercase tracking-widest mb-0.5">{config.labels.instructor}</p>
                                        <p className="text-sm font-extrabold text-navy">{selectedSlot.instructor}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-t3 uppercase tracking-widest flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            KATILIMCI LİSTESİ ({selectedSlot.participants.length}/{selectedSlot.maxAttendees})
                                        </p>
                                    </div>

                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                                        {selectedSlot.participants.length > 0 ? selectedSlot.participants.map((name: string, i: number) => (
                                            <div key={i} className="flex items-center justify-between bg-white p-3.5 rounded-[12px] border border-border-brand/10 shadow-sm transition-all hover:bg-bg/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-full bg-bg flex items-center justify-center text-[10px] font-bold text-navy/60">
                                                        {name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-navy italic">{name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-green-50 text-green px-2 py-0.5 rounded-full text-[9px] font-black">
                                                    <CheckCircle className="h-3 w-3" />
                                                    ONAYLANDI
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-6 text-center text-t3 text-xs italic font-medium bg-bg/20 rounded-[14px] border-2 border-dashed border-border-brand/10">
                                                Henüz katılımcı bulunmuyor.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="flex-1 h-11 text-xs font-black uppercase tracking-widest border-border-brand/30 text-t2 rounded-btn hover:bg-bg" onClick={() => setDetailOpen(false)}>
                                        Kapat
                                    </Button>
                                    <Button className="flex-1 h-11 text-xs font-black uppercase tracking-widest bg-navy text-white rounded-btn shadow-cta hover:bg-electric transition-all">
                                        Düzenle
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
