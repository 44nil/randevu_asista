"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createStaff, updateStaff } from "@/app/staff-actions"
import { toast } from "sonner"

interface StaffDialogProps {
    staff: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function StaffDialog({ staff, open, onOpenChange, onSuccess }: StaffDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        role: "staff"
    })

    useEffect(() => {
        if (staff) {
            setFormData({
                full_name: staff.full_name,
                email: staff.email,
                role: staff.role
            })
        } else {
            setFormData({
                full_name: "",
                email: "",
                role: "staff"
            })
        }
    }, [staff])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let res
            if (staff) {
                // Update
                res = await updateStaff(staff.id, {
                    full_name: formData.full_name,
                    role: formData.role
                })
            } else {
                // Create
                res = await createStaff({
                    full_name: formData.full_name,
                    email: formData.email,
                    role: formData.role as 'staff' | 'admin'
                })
            }

            if (res.success) {
                toast.success(staff ? "Eğitmen güncellendi" : "Eğitmen eklendi")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error("Hata", { description: res.error })
            }
        } catch (error) {
            toast.error("Bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{staff ? "Eğitmeni Düzenle" : "Yeni Eğitmen Ekle"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Ad Soyad</Label>
                        <Input
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>E-posta</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={!!staff} // Email cannot be changed for sync reasons usually
                        />
                        {!staff && <p className="text-xs text-muted-foreground">Eğitmen bu e-posta adresiyle giriş yapabilecek.</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select
                            value={formData.role}
                            onValueChange={val => setFormData({ ...formData, role: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="staff">Eğitmen</SelectItem>
                                <SelectItem value="admin">Yönetici</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {staff ? "Güncelle" : "Ekle"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
