"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Check, Edit, MoreHorizontal, Search, Trash2, PackagePlus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CustomerEditDialog } from "./customer-edit-dialog"
import { PackageSaleDialog } from "@/components/packages/package-sale-dialog"
import { deleteCustomer } from "@/app/actions" // We might need to move this or import
import { toast } from "sonner"

interface Member {
    id: string
    name: string
    phone: string
    email: string
    avatar?: string
    activePackage: string
    totalSessions: number
    usedSessions: number
    remainingSessions: number
    lastAttendance: string | null
    status: 'active' | 'expired' | 'inactive'
}

interface MembersTableProps {
    data: Member[]
    onRefresh: () => void
}

export function MembersTable({ data, onRefresh }: MembersTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [filter, setFilter] = useState("all") // all, reformer, mat, duo
    const [editingMember, setEditingMember] = useState<any>(null)
    const [sellingToMember, setSellingToMember] = useState<any>(null)

    const filteredData = data.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase())
        // Filter by package type could happen here if we had package type in data
        return matchesSearch
    })

    const handleDelete = async (id: string) => {
        if (!confirm("Üyeyi silmek istediğinizden emin misiniz?")) return
        const res = await deleteCustomer(id)
        if (res.success) {
            toast.success("Üye silindi")
            onRefresh()
        } else {
            toast.error("Hata", { description: res.error })
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="flex gap-2">
                    {["Hepsi", "Reformer", "Mat Pilates", "Duo"].map((tab) => (
                        <Button
                            key={tab}
                            variant={filter === tab.toLowerCase() || (tab === "Hepsi" && filter === "all") ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(tab === "Hepsi" ? "all" : tab.toLowerCase())}
                            className="rounded-full px-4"
                        >
                            {tab}
                        </Button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Üye ara..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[300px]">ÜYE ADI</TableHead>
                            <TableHead>İLETİŞİM</TableHead>
                            <TableHead>AKTİF PAKET</TableHead>
                            <TableHead className="w-[200px]">KALAN SEANS</TableHead>
                            <TableHead>SON KATILIM</TableHead>
                            <TableHead className="text-right">İŞLEMLER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((member) => (
                            <TableRow key={member.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border bg-slate-100 text-slate-500">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold text-slate-900">{member.name}</div>
                                            <div className="text-xs text-slate-500">ID: #{member.id.substring(0, 4)}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span className="text-slate-900">{member.phone}</span>
                                        <span className="text-slate-500 text-xs">{member.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {member.activePackage !== "Paket Yok" ? (
                                        <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                                            {member.activePackage}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-500">
                                            Paket Yok
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {member.activePackage !== "Paket Yok" && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className={cn(
                                                    member.remainingSessions <= 2 ? "text-red-500" : "text-blue-600"
                                                )}>
                                                    {member.remainingSessions > 0 ? "Aktif" : "Bitti"}
                                                </span>
                                                <span className="text-slate-500">{member.remainingSessions}/{member.totalSessions}</span>
                                            </div>
                                            <Progress
                                                value={(member.remainingSessions / member.totalSessions) * 100}
                                                className={cn("h-2",
                                                    member.remainingSessions <= 2 ? "bg-red-100 [&>div]:bg-red-500" : "bg-blue-100 [&>div]:bg-blue-600"
                                                )}
                                            />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {member.lastAttendance ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">
                                                    {format(new Date(member.lastAttendance), "d MMM", { locale: tr })}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {format(new Date(member.lastAttendance), "HH:mm")}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Katılım Yok</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg">
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button onClick={() => setEditingMember(member)} size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg">
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            onClick={() => setSellingToMember(member)}
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 rounded-lg"
                                            title="Paket Tanımla"
                                        >
                                            <PackagePlus className="h-4 w-4" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDelete(member.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                    <span className="text-red-500">Sil</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <div>Toplam {filteredData.length} üyeden 1-10 arası gösteriliyor</div>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>{'<'}</Button>
                    <Button variant="default" size="icon" className="h-8 w-8 bg-blue-600">1</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>{'>'}</Button>
                </div>
            </div>

            <CustomerEditDialog
                customer={editingMember}
                open={!!editingMember}
                onOpenChange={(open) => !open && setEditingMember(null)}
                onSuccess={onRefresh}
            />

            <PackageSaleDialog
                customer={sellingToMember}
                open={!!sellingToMember}
                onOpenChange={(open) => !open && setSellingToMember(null)}
                onSuccess={onRefresh}
            />
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

