"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, X, User, Users } from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns"
import { tr } from "date-fns/locale"
import { cn, parseUTCTime } from "@/lib/utils"
import { getAvailableClasses } from "@/app/portal-actions"
import { addToWaitlist, removeFromWaitlist } from "@/app/waitlist-actions"
import { BookingDialog } from "./booking-dialog"
import { CancelDialog } from "./cancel-dialog"
import { useOrganization } from "@/providers/organization-provider"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ReservationCalendar() {
    const { config } = useOrganization()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedClass, setSelectedClass] = useState<any>(null)
    const [bookingOpen, setBookingOpen] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null)

    const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null)

    // Filters
    const [instructorFilter, setInstructorFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")

    // Fetch Classes whenever week changes
    useEffect(() => {
        fetchClasses()
    }, [currentDate])

    const fetchClasses = async () => {
        setLoading(true)
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString()
        const end = endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString()

        console.log('📅 Fetching classes for week:', { start, end })

        try {
            const result = await getAvailableClasses(start, end)
            console.log('📊 Classes result:', result)
            if (result.success) {
                setClasses(result.data || [])
                setCurrentCustomerId(result.currentCustomerId || null)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Generate days of the week
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // Filter Logic
    const filteredClasses = classes.filter(c => {
        const matchesDate = isSameDay(new Date(c.start_time), selectedDate)
        // Group Logic will handle deduping, but here we can just pass all.
        return matchesDate
    })

    // Extract unique instructors and types for filters
    const uniqueInstructors = Array.from(new Set(classes.map(c => c.staff?.full_name))).filter(Boolean)
    const uniqueTypes = Array.from(new Set(classes.map(c => c.service_id))).filter(Boolean)

    // Apply strict filters if selected
    const displayClasses = filteredClasses.filter(c => {
        const matchesInstructor = instructorFilter === "all" || c.staff?.full_name === instructorFilter
        const matchesType = typeFilter === "all" || c.service_id === typeFilter
        return matchesInstructor && matchesType
    })

    // Group classes by day for the grid
    const classesByDay = weekDays.map(day => {
        // Since backend returns Sessions, we just filter by day.
        // START_TIME is the key.
        const dayClasses = classes.filter(c => isSameDay(new Date(c.start_time), day))
        return dayClasses.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    })

    const START_HOUR = 8;
    const END_HOUR = 22;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const PIXELS_PER_HOUR = 130; // Height of one hour block
    const GRID_HEIGHT = TOTAL_HOURS * PIXELS_PER_HOUR;

    const getTopPosition = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const absoluteHours = hours + (minutes / 60);
        const offset = absoluteHours - START_HOUR;
        return Math.max(0, offset * PIXELS_PER_HOUR);
    }

    // Get capacity color based on availability percentage
    const getCapacityColor = (bookedSlots: number, totalSlots: number) => {
        const percentage = (bookedSlots / totalSlots) * 100;
        if (percentage >= 100) return 'text-red-500';
        if (percentage >= 50) return 'text-yellow-500';
        return 'text-green-500';
    }

    // Handle waitlist actions
    const handleJoinWaitlist = async (sessionId: string) => {
        if (!currentCustomerId) {
            toast.error("Müşteri bilgisi bulunamadı");
            return;
        }
        const result = await addToWaitlist(sessionId, currentCustomerId);
        if (result.success) {
            toast.success(`Bekleme listesine eklendi (Sıra: ${result.data?.position})`);
            fetchClasses(); // Refresh
        } else {
            toast.error(result.error || "Bekleme listesine eklenemedi");
        }
    }

    const handleLeaveWaitlist = async (waitlistId: string) => {
        const result = await removeFromWaitlist(waitlistId);
        if (result.success) {
            toast.success("Bekleme listesinden çıkarıldı");
            fetchClasses(); // Refresh
        } else {
            toast.error(result.error || "Bekleme listesinden çıkarılamadı");
        }
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Haftalık {config.labels.appointment || 'İşlem'} Programı</h1>
                    <p className="text-slate-500 mt-2 text-base">Size en uygun {config.labels.appointment?.toLowerCase() || 'işlemi'} seçin ve yerinizi ayırtın.</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl py-2 px-4 flex items-center gap-3 shadow-sm min-w-[200px]">
                    <div className="bg-green-50 text-green-600 h-10 w-10 flex items-center justify-center rounded-lg">
                        {/* Cube Icon Mock */}
                        <div className="relative h-5 w-5">
                            <div className="absolute inset-0 bg-green-500 rounded transform rotate-45"></div>
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KALAN KREDİ</div>
                        <div className="font-bold text-lg text-slate-900 leading-none mt-0.5">12 Seans</div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between gap-4 items-center">
                {/* Date Navigator */}
                <div className="flex items-center bg-slate-50 rounded-xl p-1 w-full md:w-auto">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="h-10 w-10 rounded-lg hover:bg-white text-slate-600">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col items-center justify-center min-w-[200px] px-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(weekStart, 'MMMM yyyy', { locale: tr })}</span>
                        <span className="text-sm font-bold text-slate-900 capitalize">
                            {format(weekStart, 'd', { locale: tr })} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMMM', { locale: tr })}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="h-10 w-10 rounded-lg hover:bg-white text-slate-600">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] h-11 bg-slate-50 border-0 rounded-xl font-medium text-slate-600 ring-0 focus:ring-0">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                                </span>
                                <SelectValue placeholder={`${config.labels.appointment || 'İşlem'} Türü`} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm {config.labels.appointment || 'İşlem'}ler</SelectItem>
                            {uniqueTypes.map((type: any, i) => (
                                <SelectItem key={i} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] h-11 bg-slate-50 border-0 rounded-xl font-medium text-slate-600 ring-0 focus:ring-0">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500"><User className="h-4 w-4" /></span>
                                <SelectValue placeholder={config.labels.instructor || 'Eğitmen'} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm {config.labels.instructor || 'Eğitmen'}ler</SelectItem>
                            {uniqueInstructors.map((inst: any, i) => (
                                <SelectItem key={i} value={inst}>{inst}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        className="bg-green-500 hover:bg-green-600 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-green-200/50 transition-all hover:scale-[1.02]"
                        onClick={() => { setInstructorFilter("all"); setTypeFilter("all"); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        Filtreleri Temizle
                    </Button>
                </div>
            </div>

            {/* Weekly Timeline Scheduler */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <div className="min-w-[1000px] flex">
                    {/* Time Column */}
                    <div className="w-20 flex-shrink-0 bg-white border-r border-slate-100 z-10 sticky left-0">
                        {/* Header Spacer */}
                        <div className="h-20 border-b border-slate-100 bg-white"></div>

                        {/* Time Labels */}
                        <div className="relative relative-time-col" style={{ height: GRID_HEIGHT }}>
                            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                                const hour = START_HOUR + i;
                                return (
                                    <div key={hour} className="absolute w-full text-center" style={{ top: (hour - START_HOUR) * PIXELS_PER_HOUR - 10 }}>
                                        <span className="text-xs font-bold text-slate-700 bg-white px-1">
                                            {hour.toString().padStart(2, '0')}:00
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Days Columns */}
                    <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100">
                        {weekDays.map((day, i) => {
                            const isToday = isSameDay(day, new Date())
                            return (
                                <div key={i} className="flex flex-col relative bg-white">
                                    {/* Date Header */}
                                    <div className="h-20 flex flex-col items-center justify-center border-b border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">
                                            {format(day, 'EEE', { locale: tr })}
                                        </div>
                                        <div className={`text-2xl font-black ${isToday ? 'text-green-500' : 'text-slate-800'}`}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>

                                    {/* Cards Area */}
                                    <div className="relative w-full overflow-hidden" style={{ height: GRID_HEIGHT }}>
                                        {/* Horizontal Guide Lines */}
                                        {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                                            <div key={h} className="absolute w-full border-b border-slate-50/60" style={{ top: h * PIXELS_PER_HOUR, height: 1 }}></div>
                                        ))}

                                        {loading ? (
                                            i === 0 && <div className="absolute top-10 w-full flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>
                                        ) : (
                                            classesByDay[i].map((group) => {
                                                const matchesInstructor = instructorFilter === "all" || group.staff?.full_name === instructorFilter
                                                const matchesType = typeFilter === "all" || group.service_id === typeFilter

                                                if (!matchesInstructor || !matchesType) return null;

                                                const startDate = parseUTCTime(group.start_time);
                                                const endDate = group.end_time ? parseUTCTime(group.end_time) : new Date(startDate.getTime() + 60 * 60 * 1000);
                                                const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

                                                const top = getTopPosition(startDate);
                                                const height = durationHours * PIXELS_PER_HOUR;
                                                const isFull = group.bookedSlots >= group.totalSlots
                                                const capacityLabel = `${group.bookedSlots}/${group.totalSlots} Kişi`

                                                return (
                                                    <div
                                                        key={group.id}
                                                        className="absolute w-full z-10 box-border px-1"
                                                        style={{ top: top, height: height }}
                                                    >
                                                        <div
                                                            onClick={() => {
                                                                if (group.isBookedByMe) {
                                                                    // User has booked this - allow cancellation
                                                                    setAppointmentToCancel({
                                                                        appointmentId: group.myAppointmentId, // Use the actual appointment ID
                                                                        start_time: group.start_time,
                                                                        service_id: group.service_id
                                                                    })
                                                                    setCancelOpen(true)
                                                                } else if (!isFull && group.availableSlots > 0) {
                                                                    // Available slot - allow booking
                                                                    setSelectedClass({
                                                                        id: group.id,
                                                                        start_time: group.start_time,
                                                                        end_time: group.end_time,
                                                                        service_id: group.service_id,
                                                                        staff: group.staff
                                                                    })
                                                                    setBookingOpen(true)
                                                                }
                                                            }}
                                                            className={`
                                                                relative w-full h-full p-3 rounded-xl border-2 transition-all cursor-pointer group flex flex-col justify-between
                                                                ${isFull
                                                                    ? 'bg-slate-50 border-slate-200 opacity-70'
                                                                    : 'bg-white border-green-500 shadow-md hover:scale-[1.02]'}
                                                                ${group.isBookedByMe ? 'ring-2 ring-green-500 ring-offset-2 border-green-600' : ''}
                                                            `}
                                                        >
                                                            <div className="flex justify-between items-center mb-1 shrink-0">
                                                                <span className={`
                                                                    text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                                                                    ${isFull
                                                                        ? 'bg-slate-200 text-slate-500'
                                                                        : 'bg-green-500 text-white'}
                                                                `}>
                                                                    {group.totalSlots > 1
                                                                        ? 'GRUP'
                                                                        : (group.service_id?.toLowerCase() === 'private' ? 'ÖZEL' : (group.service_id || config.labels.appointment?.toUpperCase() || 'İŞLEM')).split(' ')[0]}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    {format(startDate, 'HH:mm')}
                                                                </span>
                                                            </div>

                                                            <h4 className="text-xs font-bold mb-1 leading-tight text-slate-900 line-clamp-2">
                                                                {group.service_id?.toLowerCase() === 'private' ? `Özel ${config.labels.appointment || 'İşlem'}` : (group.service_id || `Genel ${config.labels.appointment || 'İşlem'}`)}
                                                            </h4>

                                                            <div className="flex items-center gap-1.5 mb-2 shrink-0">
                                                                {group.staff?.full_name ? (
                                                                    <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                                                        <div className="h-full w-full bg-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                                                            {group.staff.full_name[0]}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-4 w-4 rounded-full bg-slate-200" />
                                                                )}
                                                                <span className="text-[10px] text-slate-500 truncate">
                                                                    {group.staff?.full_name?.split(' ')[0] || config.labels.instructor || "Eğitmen"}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center text-[9px] font-black mt-auto shrink-0 w-full">
                                                                {group.isBookedByMe ? (
                                                                    <>
                                                                        <span className={getCapacityColor(group.bookedSlots, group.totalSlots)}>
                                                                            {capacityLabel}
                                                                        </span>
                                                                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                                                                            SİZİN
                                                                        </div>
                                                                    </>
                                                                ) : isFull ? (
                                                                    <>
                                                                        <span className="text-red-500">DOLU ({capacityLabel})</span>
                                                                        {group.isOnWaitlist ? (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleLeaveWaitlist(group.waitlistId);
                                                                                }}
                                                                                className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md font-bold text-[9px]"
                                                                            >
                                                                                SIRADA: {group.waitlistPosition} ❌
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleJoinWaitlist(group.id);
                                                                                }}
                                                                                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold text-[9px] hover:bg-blue-200"
                                                                            >
                                                                                BEKLEME LİSTESİ +
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className={getCapacityColor(group.bookedSlots, group.totalSlots)}>
                                                                        {capacityLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Legend */}
            <div className="flex items-center gap-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-slate-600">Müsait {config.labels.appointment || 'İşlem'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-sm font-medium text-slate-600">Dolu / Kapalı</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white" />
                    <span className="text-sm font-medium text-slate-600">Senin Rezervasyonun</span>
                </div>
            </div>

            <BookingDialog
                open={bookingOpen}
                onOpenChange={setBookingOpen}
                selectedClass={selectedClass}
                onSuccess={() => {
                    fetchClasses()
                }}
            />

            <CancelDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                appointment={appointmentToCancel}
                onSuccess={() => {
                    fetchClasses()
                }}
            />
        </div >
    )
}
