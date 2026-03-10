"use client"

import { useState } from "react"
import { useOrganization } from "@/providers/organization-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"
import { deletePackage } from "@/app/package-actions"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"

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
    const PAGE_SIZE = 8
    const [page, setPage] = useState(0)
    const totalPages = Math.ceil(data.length / PAGE_SIZE)
    const pagedData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
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
        // Look in both lists to find the label
        const foundInPackages = config.packageTypes?.find(t => t.value === type)
        const foundInAppointments = config.appointmentTypes?.find(t => t.value === type)

        let label = foundInPackages?.label || foundInAppointments?.label || type

        // Global Turkish mapping for common English legacy values
        const translations: Record<string, string> = {
            'treatment': 'Tedavi',
            'checkup': 'Muayene',
            'cleaning': 'Temizlik',
            'standard': 'Genel',
            'group': config.labels.customer === 'Hasta' ? 'Tedavi' : 'Grup', // Map group to Tedavi for Dental
            'private': 'Özel',
            'reformer': 'Reformer',
            'mat': 'Mat Pilates'
        }

        if (label === type && translations[type?.toLowerCase()]) {
            label = translations[type.toLowerCase()]
        }

        // Consistent coloring based on type
        const typeLower = type?.toLowerCase()
        if (typeLower === 'private' || typeLower === 'premium' || typeLower === 'checkup') {
            return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">{label}</Badge>
        }
        if (typeLower === 'group' || typeLower === 'standard' || typeLower === 'treatment') {
            return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">{label}</Badge>
        }
        if (typeLower === 'duo' || typeLower === 'cleaning') {
            return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">{label}</Badge>
        }

        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{label}</Badge>
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
                        pagedData.map((pkg, index) => {
                            const isDuplicate = data.some((item, i) =>
                                i !== index &&
                                item.name === pkg.name &&
                                item.type === pkg.type &&
                                item.credits === pkg.credits &&
                                item.price === pkg.price
                            )

                            return (
                                <TableRow key={pkg.id} className={cn("hover:bg-slate-50/50", isDuplicate && "bg-orange-50/30")}>
                                    <TableCell className="font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            {pkg.name}
                                            {isDuplicate && (
                                                <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                                                    <Edit className="h-3 w-3" /> TEKRARLAYAN KAYIT
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
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
                            )
                        })
                    )}
                </TableBody>
            </Table>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-xs text-slate-500 font-medium">
                        Toplam {data.length} kayıt — Sayfa {page + 1} / {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-sm font-bold flex items-center justify-center transition-colors"
                        >&lt;</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setPage(i)}
                                className={cn(
                                    "w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors",
                                    page === i ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                )}
                            >{i + 1}</button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-sm font-bold flex items-center justify-center transition-colors"
                        >&gt;</button>
                    </div>
                </div>
            )}
        </div>
    )
}
