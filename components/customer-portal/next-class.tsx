"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, User, Clock, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useOrganization } from "@/providers/organization-provider"

interface NextClassProps {
    appointment: any
}

export function NextClass({ appointment }: NextClassProps) {
    const { config } = useOrganization()

    if (!appointment) {
        return (
            <div className="bg-surface/50 rounded-card p-10 text-center border-2 border-dashed border-border-brand/40 flex flex-col items-center justify-center transition-all hover:bg-surface">
                <div className="size-16 rounded-full bg-bg flex items-center justify-center mb-6">
                    <Calendar className="h-8 w-8 text-navy/40" />
                </div>
                <h3 className="text-navy font-extrabold text-sm uppercase tracking-widest mb-2" style={{ fontWeight: 800 }}>Programın Boş</h3>
                <p className="text-t2 text-xs font-medium max-w-[200px] leading-relaxed">Yeni bir {config.labels.appointment?.toLowerCase() || 'randevu'} alarak başlayabilirsin.</p>
                <Button className="mt-8 bg-navy text-white text-[11px] font-bold h-9 px-6 rounded-btn shadow-elevated hover:bg-navy-mid transition-all uppercase tracking-wider">
                    {config.labels.createAppointment}
                </Button>
            </div>
        )
    }

    const startTime = new Date(appointment.start_time)
    const dayName = format(startTime, 'd', { locale: tr })
    const monthName = format(startTime, 'MMM', { locale: tr }).toUpperCase()
    const timeRange = `${format(startTime, 'HH:mm')} - ${format(new Date(appointment.end_time), 'HH:mm')} `
    const instructor = appointment.staff?.full_name || `${config.labels.instructor || 'Eğitmen'} Atanmadı`
    const service = appointment.service_id || `Standart ${config.labels.appointment || 'İşlem'} `

    return (
        <div className="bg-electric text-white border-none shadow-cta rounded-card overflow-hidden relative group p-1 transition-all hover:scale-[1.02] duration-500">
            {/* Decorative background elements matching design */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full transform translate-x-12 -translate-y-12 group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-6 translate-y-6" />

            <div className="relative z-10 p-7">
                <div className="flex justify-between items-start mb-10">
                    <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-white/70">SIRADAKİ {config.labels.appointment?.toUpperCase()}</div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-badge text-[10px] font-extrabold uppercase tracking-widest">ONAYLANDI</div>
                </div>

                <div className="flex items-center gap-6 mb-10">
                    <div className="bg-white text-electric rounded-[14px] p-4 text-center min-w-[85px] shadow-brand shadow-electric/20 translate-y-[-5px]">
                        <div className="text-[11px] font-black uppercase opacity-60 tracking-wider mb-1">{monthName}</div>
                        <div className="text-4xl font-extrabold tracking-tighter" style={{ fontWeight: 800 }}>{dayName}</div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold leading-none tracking-tighter uppercase mb-2" style={{ fontWeight: 800 }}>{service}</h3>
                        <div className="flex items-center gap-2 text-white/80 text-sm font-bold tracking-tight">
                            <Clock className="h-4 w-4 opacity-70" />
                            {timeRange}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/20 pt-6 mt-2">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-[10px] bg-white text-electric flex items-center justify-center font-black text-xs shadow-brand">
                            {instructor.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/60 font-extrabold uppercase tracking-widest leading-none mb-1">{config.labels.instructor}</span>
                            <span className="text-sm font-extrabold text-white leading-none" style={{ fontWeight: 800 }}>{instructor}</span>
                        </div>
                    </div>
                    <Button size="sm" className="bg-white text-electric font-extrabold hover:bg-surface text-[11px] h-10 px-6 rounded-btn shadow-brand uppercase tracking-wider transition-all" style={{ fontWeight: 800 }}>
                        AYRINTILAR
                    </Button>
                </div>
            </div>
        </div>
    )
}
