"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

import { requestCancellation } from "@/app/portal-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface HistoryTableProps {
    history: any[]
}


import { useOrganization } from "@/providers/organization-provider"

export function HistoryTable({ history }: HistoryTableProps) {
    const router = useRouter()
    const { config } = useOrganization()

    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
    const [cancellationReason, setCancellationReason] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const openCancelDialog = (id: string) => {
        setSelectedAppointmentId(id)
        setCancellationReason("")
        setIsDialogOpen(true)
    }

    const submitCancellation = async () => {
        if (!selectedAppointmentId) return;
        if (!cancellationReason.trim()) {
            toast.error("Lütfen bir iptal sebebi belirtiniz.")
            return;
        }

        setLoading(true)
        try {
            const result = await requestCancellation(selectedAppointmentId, cancellationReason)
            if (result.success) {
                toast.success("İptal talebi alındı. Eğitmen onayladığında size bilgi verilecektir.")
                setIsDialogOpen(false)
                router.refresh()
            } else {
                toast.error("Talep gönderilemedi: " + result.error)
            }
        } catch (error) {
            toast.error("Bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder={`${config.labels.appointment}, eğitmen veya ${config.labels.package.toLowerCase()} ara...`} className="pl-9 bg-white" />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 text-slate-600">
                        <Filter className="h-4 w-4" />
                        Filtrele
                    </Button>
                    <Button variant="outline" className="gap-2 text-slate-600">
                        <Download className="h-4 w-4" />
                        Dışa Aktar
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 tracking-wider">Tarih & Saat</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 tracking-wider">{config.labels.appointment} Adı</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 tracking-wider">Eğitmen</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 tracking-wider">Kullanılan {config.labels.package}</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 tracking-wider">Durum</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 tracking-wider text-right">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!history || history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                    Henüz kayıtlı bir {config.labels.appointment ? config.labels.appointment.toLowerCase() : 'randevu'}nuz yok.
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((item) => {
                                const isUpcoming = new Date(item.start_time) > new Date()
                                const canCancel = isUpcoming && item.status === 'confirmed'

                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-900">
                                            <div className="flex flex-col">
                                                <span>{format(new Date(item.start_time), 'd MMMM yyyy', { locale: tr })}</span>
                                                <span className="text-xs text-slate-500 font-normal">
                                                    {format(new Date(item.start_time), 'HH:mm')} - {format(new Date(item.end_time), 'HH:mm')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.service_id || `Genel ${config.labels.appointment}`}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">
                                                    {item.staff?.full_name?.substring(0, 2).toUpperCase() || "EĞ"}
                                                </div>
                                                <span className="text-sm">{item.staff?.full_name || "Belirsiz"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal hover:bg-slate-200">
                                                Genel Paket
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={item.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canCancel && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                                                    onClick={() => openCancelDialog(item.id)}
                                                >
                                                    İptal İste
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {history && history.length > 5 && (
                    <div className="flex items-center justify-between p-4 border-t bg-slate-50 text-xs text-slate-500">
                        <span>Toplam {history.length} {config.labels.appointment.toLowerCase()} kaydı bulundu</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-white" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="default" size="icon" className="h-8 w-8 bg-blue-600">1</Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-white">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cancellation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{config.labels.appointment} İptal Talebi</DialogTitle>
                        <DialogDescription>
                            Lütfen {config.labels.appointment.toLowerCase()}i iptal etme nedeninizi belirtiniz. Eğitmeniniz talebinizi inceleyecektir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label htmlFor="reason">İptal Nedeni</Label>
                        <Textarea
                            id="reason"
                            placeholder="Örn: Rahatsızlandım, acil işim çıktı..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>Vazgeç</Button>
                        <Button variant="destructive" onClick={submitCancellation} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Talebi Gönder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none">• Katıldı</Badge>
        case 'cancelled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-none">• İptal Edildi</Badge>
        case 'confirmed': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none">• Gelecek</Badge>
        case 'cancellation_requested': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none shadow-none">• İptal Bekliyor</Badge>
        default: return <Badge variant="secondary" className="bg-gray-100 text-gray-700">• {status}</Badge>
    }
}
