"use client"

import { useState, useEffect } from "react"
import { addMeasurement, getMeasurements, deleteMeasurement } from "@/app/measurement-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, X, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface MeasurementsListProps {
    customerId: string
    readOnly?: boolean
}

export function MeasurementsList({ customerId, readOnly = false }: MeasurementsListProps) {
    interface Measurement {
        id: string
        date: string
        weight?: number
        height?: number
        waist?: number
        hip?: number
        chest?: number
        arm_right?: number
        leg_right?: number
        notes?: string
    }

    const [measurements, setMeasurements] = useState<Measurement[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        weight: "",
        height: "",
        waist: "",
        hip: "",
        chest: "",
        arm_right: "",
        leg_right: "",
        notes: ""
    })

    const loadData = async () => {
        setLoading(true)
        const res = await getMeasurements(customerId)
        if (res.success) setMeasurements(res.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [customerId])

    const handleSubmit = async () => {
        setSaving(true)
        const payload = {
            customer_id: customerId,
            date: new Date().toISOString(),
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            height: formData.height ? parseFloat(formData.height) : undefined,
            waist: formData.waist ? parseFloat(formData.waist) : undefined,
            hip: formData.hip ? parseFloat(formData.hip) : undefined,
            chest: formData.chest ? parseFloat(formData.chest) : undefined,
            arm_right: formData.arm_right ? parseFloat(formData.arm_right) : undefined,
            leg_right: formData.leg_right ? parseFloat(formData.leg_right) : undefined,
            notes: formData.notes
        }

        const res = await addMeasurement(payload)
        setSaving(false)

        if (res.success) {
            toast.success("Ölçüm eklendi")
            setShowForm(false)
            setFormData({ weight: "", height: "", waist: "", hip: "", chest: "", arm_right: "", leg_right: "", notes: "" })
            loadData()
        } else {
            console.error(res.error)
            if (res.error?.includes('42P01') || res.error?.includes('Veritabanı tablosu eksik')) {
                toast.error("Hata: Veritabanı Tablosu Yok", { description: "Lütfen SQL betiğini çalıştırın." })
            } else {
                toast.error("Hata", { description: "Kaydedilemedi. Lütfen tekrar deneyin." })
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return
        const res = await deleteMeasurement(id)
        if (res.success) {
            toast.success("Silindi")
            loadData()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-700">Vücut Ölçümleri</h3>
                {!showForm && !readOnly && (
                    <Button size="sm" onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Ölçüm
                    </Button>
                )}
            </div>

            {/* Inline Form */}
            {showForm && (
                <div className="bg-slate-50 p-4 rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Kilo (kg)</Label>
                            <Input type="number" className="h-8 bg-white" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} placeholder="0.0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Boy (cm)</Label>
                            <Input type="number" className="h-8 bg-white" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Bel (cm)</Label>
                            <Input type="number" className="h-8 bg-white" value={formData.waist} onChange={e => setFormData({ ...formData, waist: e.target.value })} placeholder="0.0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Basen (cm)</Label>
                            <Input type="number" className="h-8 bg-white" value={formData.hip} onChange={e => setFormData({ ...formData, hip: e.target.value })} placeholder="0.0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Göğüs (cm)</Label>
                            <Input type="number" className="h-8 bg-white" value={formData.chest} onChange={e => setFormData({ ...formData, chest: e.target.value })} placeholder="0.0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Sağ Kol (cm)</Label>
                            <Input type="number" className="h-8 bg-white" value={formData.arm_right} onChange={e => setFormData({ ...formData, arm_right: e.target.value })} placeholder="0.0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Sağ Bacak (cm)</Label>
                            <Input type="number" className="h-8 bg-white" value={formData.leg_right} onChange={e => setFormData({ ...formData, leg_right: e.target.value })} placeholder="0.0" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Notlar</Label>
                        <Input className="h-8 bg-white" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Ek notlar..." />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>
                            <X className="h-4 w-4 mr-2" /> İptal
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Kaydet
                        </Button>
                    </div>
                </div>
            )}

            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-xs whitespace-nowrap">Tarih</TableHead>
                            <TableHead className="text-xs whitespace-nowrap">Kilo</TableHead>
                            <TableHead className="text-xs whitespace-nowrap">Bel</TableHead>
                            <TableHead className="text-xs whitespace-nowrap">Basen</TableHead>
                            <TableHead className="text-xs whitespace-nowrap">Göğüs</TableHead>
                            <TableHead className="text-xs whitespace-nowrap">Kol</TableHead>
                            <TableHead className="text-xs whitespace-nowrap">Bacak</TableHead>
                            <TableHead className="text-xs whitespace-nowrap">Not</TableHead>
                            {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={readOnly ? 8 : 9} className="text-center py-8">Yükleniyor...</TableCell></TableRow>
                        ) : measurements.length === 0 ? (
                            <TableRow><TableCell colSpan={readOnly ? 8 : 9} className="text-center py-8 text-slate-500">Kayıt bulunamadı</TableCell></TableRow>
                        ) : (
                            measurements.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium text-xs whitespace-nowrap">
                                        {format(new Date(m.date), 'd MMM yyyy', { locale: tr })}
                                    </TableCell>
                                    <TableCell className="text-xs">{m.weight ? `${m.weight} kg` : '-'}</TableCell>
                                    <TableCell className="text-xs">{m.waist ? `${m.waist} cm` : '-'}</TableCell>
                                    <TableCell className="text-xs">{m.hip ? `${m.hip} cm` : '-'}</TableCell>
                                    <TableCell className="text-xs">{m.chest ? `${m.chest} cm` : '-'}</TableCell>
                                    <TableCell className="text-xs">{m.arm_right ? `${m.arm_right} cm` : '-'}</TableCell>
                                    <TableCell className="text-xs">{m.leg_right ? `${m.leg_right} cm` : '-'}</TableCell>
                                    <TableCell className="text-xs text-slate-500 max-w-[100px] truncate">{m.notes}</TableCell>
                                    {!readOnly && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(m.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
