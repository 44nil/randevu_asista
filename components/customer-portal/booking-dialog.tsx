"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useState } from "react"
import { bookAppointment } from "@/app/portal-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"

interface BookingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedClass: any
    onSuccess: () => void
}

export function BookingDialog({ open, onOpenChange, selectedClass, onSuccess }: BookingDialogProps) {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(false)

    if (!selectedClass) return null

    const handleBook = async () => {
        setLoading(true)
        try {
            const result = await bookAppointment({
                service_id: selectedClass.service_id || "Genel Ders",
                start_time: selectedClass.start_time,
                end_time: selectedClass.end_time,
                staff_id: selectedClass.staff_id,
                session_id: selectedClass.id // Pass Session ID mandatory for new logic
            })

            if (result.success) {
                toast.success("Rezervasyonunuz başarıyla oluşturuldu!")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(result.error || "Rezervasyon oluşturulurken bir hata oluştu.")
            }
        } catch (error) {
            toast.error("Beklenmedik bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const startTime = new Date(selectedClass.start_time)
    const endTime = new Date(selectedClass.end_time)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto bg-green-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Rezervasyonu Onayla</DialogTitle>
                    <DialogDescription className="text-center">
                        Aşağıdaki detaylara sahip {config.labels.appointment?.toLowerCase() || 'rezervasyon'} için <strong>1 {config.labels.session?.toLowerCase() || 'hak'}</strong> kullanılacaktır.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 p-4 rounded-xl space-y-4 my-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{config.labels.appointment?.toUpperCase() || 'İŞLEM'} TÜRÜ</p>
                            <p className="font-semibold text-slate-900">{selectedClass.service_id || `Standart ${config.labels.appointment}`}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            <Clock className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">TARİH VE SAAT</p>
                            <p className="font-semibold text-slate-900">
                                {format(startTime, 'd MMMM EEEE', { locale: tr })}, {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{config.labels.instructor?.toUpperCase() || 'EĞİTMEN'}</p>
                            <p className="font-semibold text-slate-900">
                                {selectedClass.staff?.full_name || `${config.labels.instructor || 'Eğitmen'} Atanmadı`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">KONUM</p>
                            <p className="font-semibold text-slate-900">Ana Şube</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Vazgeç
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleBook}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                İşleniyor...
                            </>
                        ) : (
                            "Onayla ve Yer Ayırt"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
