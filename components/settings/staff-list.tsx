"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Shield, User, CalendarClock } from "lucide-react"
import Link from "next/link"
import { getStaffList, deleteStaff } from "@/app/staff-actions"
import { StaffDialog } from "./staff-dialog"
import { toast } from "sonner"
import { useOrganization } from "@/providers/organization-provider"

export function StaffList() {
    const { config } = useOrganization()

    interface Staff {
        id: string
        full_name: string
        email: string
        role: string
        clerk_id: string
    }

    // Explicitly define state type
    const [staff, setStaff] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

    const loadStaff = async () => {
        setLoading(true)
        const res = await getStaffList()
        if (res.success) {
            setStaff(res.data || [])
        }
        setLoading(false)
    }

    // Add empty dependency array is correct, loadStaff is stable enough but to be 100% clean we can move it inside or suppress.
    // Moving inside is cleaner.
    useEffect(() => {
        loadStaff()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleEdit = (s: Staff) => {
        setEditingStaff(s)
        setDialogOpen(true)
    }

    const handleCreate = () => {
        setEditingStaff(null)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm(`Bu ${config.labels.instructor.toLowerCase()}i silmek istediğinizden emin misiniz?`)) return
        const res = await deleteStaff(id)
        if (res.success) {
            toast.success(`${config.labels.instructor} silindi`)
            loadStaff()
        } else {
            toast.error("Hata", { description: res.error })
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Ekip Yönetimi</CardTitle>
                    <CardDescription>{config.labels.instructor}leri ve diğer personelleri buradan yönetebilirsiniz.</CardDescription>
                </div>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni {config.labels.instructor}
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4 text-slate-500">Yükleniyor...</div>
                ) : (
                    <div className="space-y-4">
                        {staff.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50 hover:bg-white transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback>{s.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-slate-900">{s.full_name}</div>
                                        <div className="text-xs text-slate-500">{s.email}</div>
                                    </div>
                                    <Badge variant={s.role === 'owner' ? 'default' : s.role === 'admin' ? 'secondary' : 'outline'}>
                                        {s.role === 'owner' ? 'Kurucu' : s.role === 'admin' ? 'Yönetici' : config.labels.instructor}
                                    </Badge>
                                    {s.clerk_id.startsWith('pending_') && (
                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                            Beklemede
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/settings/staff/${s.id}/schedule`}>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Çalışma Saatleri">
                                            <CalendarClock className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500" onClick={() => handleEdit(s)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    {s.role !== 'owner' && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(s.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {staff.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                Henüz ekip üyesi eklenmemiş.
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            <StaffDialog
                staff={editingStaff}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={loadStaff}
            />
        </Card>
    )
}
