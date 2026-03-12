"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { updateClassSession, deleteClassSession } from "@/app/appointment-actions"
import { getStaffList } from "@/app/staff-actions"
import { toast } from "sonner"
import { useOrganization } from "@/providers/organization-provider"

interface EditAppointmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: {
        id: string
        title: string
        instructor: string
        startTime: Date
        duration: number
        type: string
        maxAttendees: number
        rawAppointments?: any[]
    } | null
    onSuccess: () => void
}

export function EditAppointmentDialog({ open, onOpenChange, appointment, onSuccess }: EditAppointmentDialogProps) {
    const { config, organization } = useOrganization()
    const [staffList, setStaffList] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const [confirmDelete, setConfirmDelete] = useState(false)

    const [type, setType] = useState("")
    const [instructorId, setInstructorId] = useState("")
    const [time, setTime] = useState("")
    const [duration, setDuration] = useState("")
    const [capacity, setCapacity] = useState("")

    useEffect(() => {
        getStaffList().then(r => { if (r.success) setStaffList(r.data || []) })
    }, [])

    useEffect(() => {
        if (!appointment) return
        setType(appointment.type || "")
        setTime(format(appointment.startTime, "HH:mm"))
        setDuration(String(appointment.duration))
        setCapacity(String(appointment.maxAttendees))

        // Find staff UUID by name
        getStaffList().then(r => {
            if (r.success) {
                setStaffList(r.data || [])
                const found = r.data?.find((s: any) => s.full_name === appointment.instructor)
                if (found) setInstructorId(found.id)
            }
        })
    }, [appointment])

    const lunchEnabled = organization?.settings?.lunch_break_enabled ?? true
    const lunchStart = organization?.settings?.lunch_break_start ?? "12:00:00"
    const lunchEnd = organization?.settings?.lunch_break_end ?? "13:00:00"
    const [lunchStartH, lunchStartM] = lunchStart.split(':').map(Number)
    const [lunchEndH, lunchEndM] = lunchEnd.split(':').map(Number)
    const lunchStartMins = lunchStartH * 60 + lunchStartM
    const lunchEndMins = lunchEndH * 60 + lunchEndM

    const timeSlots = []
    for (let h = 8; h <= 20; h++) {
        for (const m of [0, 30]) {
            const totalMins = h * 60 + m
            const isLunch = lunchEnabled && totalMins >= lunchStartMins && totalMins < lunchEndMins
            timeSlots.push({
                value: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                isLunch
            })
        }
    }

    const handleSave = async () => {
        if (!appointment) return
        setLoading(true)
        try {
            const [h, m] = time.split(':').map(Number)
            const start = new Date(appointment.startTime)
            start.setHours(h, m, 0, 0)

            const res = await updateClassSession(appointment.id, {
                instructor_id: instructorId,
                start_time: start.toISOString(),
                duration_minutes: parseInt(duration),
                type,
                capacity: parseInt(capacity),
            })

            if (res?.success) {
                toast.success("Randevu başarıyla güncellendi")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(res?.error || "Güncelleme başarısız")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!appointment) return
        setDeleteLoading(true)
        try {
            const res = await deleteClassSession(appointment.id)
            if (res?.success) {
                toast.success("Randevu silindi")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(res?.error || "Silme başarısız")
            }
        } finally {
            setDeleteLoading(false)
        }
    }

    if (!appointment) return null

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirmDelete(false); onOpenChange(v); }}>
            <DialogContent className="max-w-md border-none bg-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-black text-navy uppercase tracking-tight">
                        Randevu Düzenle
                    </DialogTitle>
                    <p className="text-xs text-slate-400 font-medium">
                        {format(appointment.startTime, "d MMMM EEEE", { locale: tr })}
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Tip */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-black text-navy uppercase tracking-widest">{config.labels.appointment} Tipi</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="h-11 border-[1.5px] border-slate-200 font-bold text-navy">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {config.appointmentTypes?.map(t => (
                                    <SelectItem key={t.value} value={t.value} className="font-medium">{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Personel */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-black text-navy uppercase tracking-widest">{config.labels.instructor}</Label>
                        <Select value={instructorId} onValueChange={setInstructorId}>
                            <SelectTrigger className="h-11 border-[1.5px] border-slate-200 font-bold text-navy">
                                <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {staffList.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="font-medium">{s.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Saat */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black text-navy uppercase tracking-widest">Saat</Label>
                            <Select value={time} onValueChange={setTime}>
                                <SelectTrigger className="h-11 border-[1.5px] border-slate-200 font-bold text-navy">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {timeSlots.map(({ value, isLunch }) => (
                                        <SelectItem key={value} value={value} disabled={isLunch} className={isLunch ? "opacity-40" : "font-medium"}>
                                            <span className="flex items-center gap-2">
                                                {value}
                                                {isLunch && <span className="text-[10px] text-orange-500 font-bold">— Öğle</span>}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Süre */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black text-navy uppercase tracking-widest">Süre</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger className="h-11 border-[1.5px] border-slate-200 font-bold text-navy">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="30" className="font-medium">30 dk</SelectItem>
                                    <SelectItem value="45" className="font-medium">45 dk</SelectItem>
                                    <SelectItem value="60" className="font-medium">60 dk</SelectItem>
                                    <SelectItem value="90" className="font-medium">90 dk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Kapasite */}
                    {config.features.classes && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-black text-navy uppercase tracking-widest">Kapasite</Label>
                            <Select value={capacity} onValueChange={setCapacity}>
                                <SelectTrigger className="h-11 border-[1.5px] border-slate-200 font-bold text-navy">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(n => (
                                        <SelectItem key={n} value={String(n)} className="font-medium">{n} Kişi</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {confirmDelete ? (
                    <div className="pt-3 border-t border-red-100 space-y-3">
                        <p className="text-sm font-bold text-red-600 text-center">Bu randevu silinecek. Emin misin?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 h-11 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                style={{ background: '#EF4444', color: '#fff' }}
                                className="flex-1 h-11 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="h-11 px-4 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all font-bold text-xs flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Sil
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{ background: '#2E66F1', color: '#fff' }}
                            className="flex-1 h-11 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Kaydet
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
