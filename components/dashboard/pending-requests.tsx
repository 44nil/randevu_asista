"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { processCancellation } from "@/app/admin-actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"

interface Request {
    id: string
    start_time: string
    service_id: string
    cancellation_reason?: string
    customer: {
        name: string
    }
}

export function PendingRequestsPanel({ requests }: { requests: Request[] }) {
    const { config } = useOrganization()
    const router = useRouter()
    const [processingId, setProcessingId] = useState<string | null>(null)

    if (!requests || requests.length === 0) return null

    const handleProcess = async (id: string, approved: boolean) => {
        setProcessingId(id)
        try {
            const result = await processCancellation(id, approved)
            if (result.success) {
                toast.success(approved ? "İptal onaylandı." : "İptal reddedildi.")
                router.refresh()
            } else {
                toast.error("İşlem başarısız: " + result.error)
            }
        } catch (error) {
            toast.error("Bir hata oluştu.")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-orange-900 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Bekleyen İptal Talepleri
                        </CardTitle>
                        <CardDescription className="text-orange-700">
                            {requests.length} adet yeni iptal talebi var.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {requests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium text-slate-800">
                                <User className="h-4 w-4 text-slate-400" />
                                {req.customer?.name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(req.start_time), 'd MMMM HH:mm', { locale: tr })}
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                                    {req.service_id || `Genel ${config.labels.appointment}`}
                                </span>
                            </div>
                            {req.cancellation_reason && (
                                <div className="text-sm text-orange-800 bg-orange-50 px-3 py-2 rounded-lg mt-2 italic">
                                    "{req.cancellation_reason}"
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => handleProcess(req.id, false)}
                                disabled={processingId === req.id}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Reddet
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleProcess(req.id, true)}
                                disabled={processingId === req.id}
                            >
                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                Onayla
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
