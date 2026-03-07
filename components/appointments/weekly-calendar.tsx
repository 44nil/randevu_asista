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
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [stats, setStats] = useState({
        totalMembers: 0,
        completedClasses: 0,
        totalClasses: 0,
        availableHours: 0
    })

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const weekEnd = addDays(weekStart, 6)
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 - 21:00

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true)
            try {
                const res = await getAppointments(weekStart.toISOString(), weekEnd.toISOString())
                const resStats: any = { success: true, data: { stats: { totalMembers: 0 } } } // Placeholder, logic from original

                if (res.success && res.data) {
                    const sessions = res.data

                    const processedAppointments: Appointment[] = sessions.map((session: any) => {
                        const sId = session.service_id || ""
                        const getTitle = (id: string) => {
                            if (id.includes('reformer')) return config.labels.customer === 'Hasta' ? 'Muayene' : 'Reformer'
                            if (id.includes('mat')) return config.labels.customer === 'Hasta' ? 'Tedavi' : 'Mat Pilates'
                            if (id.includes('private') || id.includes('ozel')) return config.labels.customer === 'Hasta' ? 'Özel / Estetik' : `Özel ${config.labels.appointment}`
                            return session.title || config.labels.appointment
                        }

                        const title = getTitle(session.service_id)

                        // Map service to a color-type (reformer: navy, mat: electric, private: green)
                        let appointmentCategory: ClassType = 'reformer'
                        const lowerSearch = (sId + " " + title).toLowerCase()

                        if (lowerSearch.includes('reformer') || lowerSearch.includes('muayene') || lowerSearch.includes('kontrol') || lowerSearch.includes('checkup') || lowerSearch.includes('randevu')) {
                            appointmentCategory = 'reformer'
                        } else if (lowerSearch.includes('mat') || lowerSearch.includes('tedavi') || lowerSearch.includes('dolgu')) {
                            appointmentCategory = 'mat'
                        } else if (lowerSearch.includes('özel') || lowerSearch.includes('ozel') || lowerSearch.includes('estetik')) {
                            appointmentCategory = 'private'
                        } else {
                            appointmentCategory = 'reformer'
                        }

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
    }, [weekStart, config.labels.customer])

    const nextWeek = () => setWeekStart(addWeeks(weekStart, 1))
    const prevWeek = () => setWeekStart(subWeeks(weekStart, 1))
    const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

    const getAppointmentsForSlot = (day: Date, hour: number) => {
        return appointments.filter(apt =>
            isSameDay(apt.startTime, day) && apt.startTime.getHours() === hour
        )
    }

    const categoryColors = {
        reformer: { bg: 'rgba(37, 99, 235, 0.08)', border: '#2563EB', text: '#2563EB' }, // Electric
        mat: { bg: 'rgba(56, 189, 248, 0.08)', border: '#38BDF8', text: '#38BDF8' }, // Accent
        private: { bg: 'rgba(16, 185, 129, 0.08)', border: '#10B981', text: '#10B981' } // Green
    }

    return (
        <div className="space-y-8 font-sans">
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
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-card">
                            <AppointmentForm onSuccess={() => setWeekStart(startOfWeek(weekStart, { weekStartsOn: 1 }))} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8 flex-wrap bg-white/60 backdrop-blur-sm p-3.5 rounded-card px-8 border border-border-brand/30 shadow-brand">
                    <div className="flex items-center gap-2.5">
                        <div className="size-3 rounded-full bg-electric"></div>
                        <span className="text-[11px] font-bold text-t2 uppercase tracking-wider">{config.labels.customer === 'Hasta' ? 'Muayene' : 'Reformer'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-3 rounded-full bg-accent"></div>
                        <span className="text-[11px] font-bold text-t2 uppercase tracking-wider">{config.labels.customer === 'Hasta' ? 'Tedavi' : 'Mat Pilates'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-3 rounded-full bg-green"></div>
                        <span className="text-[11px] font-bold text-t2 uppercase tracking-wider">{config.labels.customer === 'Hasta' ? 'Özel / Estetik' : `Özel ${config.labels.appointment}`}</span>
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
        </div>
    )
}
