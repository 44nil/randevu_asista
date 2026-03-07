"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPackages, sellPackage } from "@/app/package-actions"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useOrganization } from "@/providers/organization-provider"

interface PackageSaleDialogProps {
    customer: { id: string, name: string } | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function PackageSaleDialog({ customer, open, onOpenChange, onSuccess }: PackageSaleDialogProps) {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [packages, setPackages] = useState<any[]>([])
    const [selectedPackageId, setSelectedPackageId] = useState<string>("")
    const [fetchingPackages, setFetchingPackages] = useState(false)

    useEffect(() => {
        if (open) {
            setFetchingPackages(true)
            getPackages().then((res) => {
                if (res.success) {
                    setPackages(res.data || [])
                }
                setFetchingPackages(false)
            })
        }
    }, [open])

    const handleSale = async () => {
        if (!customer || !selectedPackageId) return

        setLoading(true)
        const selectedPkg = packages.find(p => p.id === selectedPackageId)

        if (!selectedPkg) return

        try {
            const result = await sellPackage(customer.id, selectedPackageId)

            if (result.success) {
                toast.success(`${config.labels.package} satışı başarıyla gerçekleşti`)
                onSuccess()
                onOpenChange(false)
                setSelectedPackageId("")
            } else {
                toast.error("Hata", { description: result.error })
            }
        } catch (error) {
            toast.error("Beklenmedik bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    const selectedPkg = packages.find(p => p.id === selectedPackageId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{config.labels.package || 'Paket'} Satışı Yap</DialogTitle>
                    <DialogDescription>
                        <strong>{customer?.name}</strong> adlı kişi için {config.labels.package?.toLowerCase() || 'paket'} tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{config.labels.package || 'Paket'} Seçimi</label>
                        <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                            <SelectTrigger>
                                <SelectValue placeholder={`${config.labels.package || 'Paket'} seçiniz`} />
                            </SelectTrigger>
                            <SelectContent>
                                {fetchingPackages ? (
                                    <div className="p-2 text-center text-xs text-muted-foreground">Yükleniyor...</div>
                                ) : packages.length === 0 ? (
                                    <div className="p-2 text-center text-xs text-muted-foreground">Tanımlı paket yok</div>
                                ) : (
                                    packages.map((pkg) => (
                                        <SelectItem key={pkg.id} value={pkg.id}>
                                            {pkg.name} ({pkg.credits} {config.labels.session || 'Seans'})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedPkg && (
                        <div className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center">
                            <span className="text-sm text-slate-500">Tutar:</span>
                            <span className="text-lg font-bold text-slate-900">{formatCurrency(selectedPkg.price)}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button onClick={handleSale} disabled={!selectedPackageId || loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        {loading ? "İşleniyor..." : "Satışı Onayla"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
