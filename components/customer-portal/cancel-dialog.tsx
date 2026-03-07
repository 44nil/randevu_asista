"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useState } from "react"
import { cancelAppointment } from "@/app/portal-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CancelDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: any
    onSuccess: () => void
}

export function CancelDialog({ open, onOpenChange, appointment, onSuccess }: CancelDialogProps) {
    const [loading, setLoading] = useState(false)

    if (!appointment) return null

    const handleCancel = async () => {
        setLoading(true)
        try {
            const result = await cancelAppointment(appointment.appointmentId)

            if (result.success) {
                toast.success("Rezervasyonunuz iptal edildi.")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(result.error || "İptal işlemi başarısız oldu.")
            }
        } catch (error) {
            toast.error("Beklenmedik bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const startTime = new Date(appointment.start_time)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto bg-red-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Rezervasyonu İptal Et</DialogTitle>
                    <DialogDescription className="text-center">
                        Bu dersi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 p-4 rounded-xl space-y-2 my-4">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">DERS</p>
                        <p className="font-semibold text-slate-900">{appointment.service_id || "Standart Seçim"}</p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">TARİH VE SAAT</p>
                        <p className="font-semibold text-slate-900">
                            {format(startTime, 'd MMMM EEEE, HH:mm', { locale: tr })}
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Vazgeç
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                İptal Ediliyor...
                            </>
                        ) : (
                            "İptal Et"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
