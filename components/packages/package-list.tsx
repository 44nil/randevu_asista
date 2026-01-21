"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"
import { deletePackage } from "@/app/package-actions"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface Package {
    id: string
    name: string
    type: 'private' | 'group' | 'duo'
    sessions: number
    price: number
    active: boolean
    status: 'active' | 'passive' // derived
}

interface PackageListProps {
    data: Package[]
    onRefresh: () => void
}

export function PackageList({ data, onRefresh }: PackageListProps) {
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} paketini silmek istediğinizden emin misiniz?`)) return
        const res = await deletePackage(id)
        if (res.success) {
            toast.success("Paket silindi")
            onRefresh()
        } else {
            toast.error("Hata", { description: res.error })
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'private': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">ÖZEL</Badge>
            case 'group': return <Badge variant="secondary" className="bg-purple-100 text-purple-700">GRUP</Badge>
            case 'duo': return <Badge variant="secondary" className="bg-orange-100 text-orange-700">DÜET</Badge>
            default: return <Badge variant="outline">{type}</Badge>
        }
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Aktif Paket Tanımları</h3>
                    <p className="text-sm text-slate-500">Salonunuzda sunduğunuz ders paketlerini buradan yönetebilirsiniz.</p>
                </div>
            </div>

            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead>PAKET ADI</TableHead>
                        <TableHead>TÜR</TableHead>
                        <TableHead>SEANS</TableHead>
                        <TableHead>SEANS BAŞI</TableHead>
                        <TableHead>TOPLAM FİYAT</TableHead>
                        <TableHead>DURUM</TableHead>
                        <TableHead className="text-right">İŞLEMLER</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                Kayıtlı paket bulunamadı. Yeni paket ekleyin.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((pkg) => (
                            <TableRow key={pkg.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-semibold text-slate-900">{pkg.name}</TableCell>
                                <TableCell>{getTypeBadge(pkg.type)}</TableCell>
                                <TableCell>{pkg.sessions} Seans</TableCell>
                                <TableCell>{formatCurrency(pkg.price / pkg.sessions)}</TableCell>
                                <TableCell className="font-bold text-slate-900">{formatCurrency(pkg.price)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${pkg.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                                        <span className="text-xs font-medium text-slate-600">{pkg.active ? 'AKTİF' : 'PASİF'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                                            onClick={() => handleDelete(pkg.id, pkg.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
