"use client"

import { useState } from "react"
import { useOrganization } from "@/providers/organization-provider"
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
    type: string
    credits: number
    price: number
    active: boolean
    status: 'active' | 'passive' // derived
}

interface PackageListProps {
    data: Package[]
    onRefresh: () => void
}

export function PackageList({ data, onRefresh }: PackageListProps) {
    const { config } = useOrganization()
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} ${config.labels.package.toLowerCase()}ini silmek istediğinizden emin misiniz?`)) return
        const res = await deletePackage(id)
        if (res.success) {
            toast.success(`${config.labels.package} silindi`)
            onRefresh()
        } else {
            toast.error("Hata", { description: res.error })
        }
    }

    const getTypeBadge = (type: string) => {
        const found = config.packageTypes?.find(t => t.value === type)
        let label = found?.label || type

        // Add robust fallback for old database rows that default to "group"
        if (!found) {
            if (config.labels.customer === 'Hasta') {
                label = type === 'group' ? 'Genel Tedavi' : type;
            } else {
                label = type === 'group' ? 'Grup' : type === 'private' ? 'Özel' : type;
            }
        }

        // Simple consistent coloring based on type value length/hash could be better, 
        // but for now let's map known ones and fallback to gray
        switch (type?.toLowerCase()) {
            case 'private': case 'premium': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">{label}</Badge>
            case 'group': case 'standard': return <Badge variant="secondary" className="bg-purple-100 text-purple-700">{label}</Badge>
            case 'duo': case 'discount': return <Badge variant="secondary" className="bg-orange-100 text-orange-700">{label}</Badge>
            default: return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-none">{label}</Badge>
        }
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Aktif {config.labels.package} Tanımları</h3>
                    <p className="text-sm text-slate-500">İşletmenizde sunduğunuz {config.labels.package ? `${config.labels.package.toLowerCase()}` : "hizmet"} {config.labels.appointment.toLowerCase() ? `${config.labels.appointment.toLowerCase()}lerini` : "lerinizi"} buradan yönetebilirsiniz.</p>
                </div>
            </div>

            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="uppercase">{config.labels.package} ADI</TableHead>
                        <TableHead>TÜR</TableHead>
                        <TableHead className="uppercase">{config.labels.session}</TableHead>
                        <TableHead className="uppercase">{config.labels.session} BAŞI</TableHead>
                        <TableHead>TOPLAM FİYAT</TableHead>
                        <TableHead>DURUM</TableHead>
                        <TableHead className="text-right">İŞLEMLER</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                Kayıtlı {config.labels.package.toLowerCase()} bulunamadı. Yeni {config.labels.package.toLowerCase()} ekleyin.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((pkg) => (
                            <TableRow key={pkg.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-semibold text-slate-900">{pkg.name}</TableCell>
                                <TableCell>{getTypeBadge(pkg.type)}</TableCell>
                                <TableCell>{pkg.credits} {config.labels.session}</TableCell>
                                <TableCell>{formatCurrency(pkg.price / (pkg.credits || 1))}</TableCell>
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
