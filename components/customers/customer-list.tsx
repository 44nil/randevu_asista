"use client"

import { useEffect, useState } from "react"
import { getCustomers, deleteCustomer } from "@/app/actions"
import { CustomerEditDialog } from "./customer-edit-dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function CustomerList() {
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingCustomer, setEditingCustomer] = useState<any>(null)

    const loadCustomers = async () => {
        setLoading(true)
        const result = await getCustomers()
        if (result.success) {
            setCustomers(result.data)
        } else {
            toast.error("Müşteriler yüklenemedi", { description: result.error })
        }
        setLoading(false)
    }

    useEffect(() => {
        loadCustomers()
    }, [])

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} adlı müşteriyi silmek istediğinizden emin misiniz?`)) return

        const result = await deleteCustomer(id)
        if (result.success) {
            toast.success("Müşteri silindi")
            loadCustomers()
        } else {
            toast.error("Hata", { description: result.error })
        }
    }

    if (loading) {
        return <div className="p-4">Yükleniyor...</div>
    }

    if (customers.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Henüz müşteri eklenmemiş. Yukarıdaki formu kullanarak ilk müşterinizi ekleyin.
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell>{customer.email}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingCustomer(customer)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(customer.id, customer.name)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <CustomerEditDialog
                customer={editingCustomer}
                open={!!editingCustomer}
                onOpenChange={(open) => !open && setEditingCustomer(null)}
                onSuccess={loadCustomers}
            />
        </>
    )
}
