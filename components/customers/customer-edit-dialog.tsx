"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CustomerForm } from "@/components/forms/customer-form"
import { updateCustomer } from "@/app/actions"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivePackagesList } from "@/components/customers/active-packages-list"
import { MeasurementsList } from "@/components/customers/measurements-list"

interface CustomerEditDialogProps {
    customer: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CustomerEditDialog({ customer, open, onOpenChange, onSuccess }: CustomerEditDialogProps) {
    const handleSubmit = async (data: any) => {
        const result = await updateCustomer(customer.id, data)
        if (result.success) {
            toast.success("Müşteri güncellendi")
            onOpenChange(false)
            onSuccess()
        } else {
            toast.error("Hata", { description: result.error })
        }
    }

    // Format customer data to match form schema
    const formData = customer ? {
        industry_type: "pilates", // TODO: Get from organization
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        metadata: customer.metadata || {}
    } : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Added max-w-4xl for wider dialog and kept max-h */}
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Müşteri Yönetimi</DialogTitle>
                    <DialogDescription>
                        {customer?.name} bilgilerini ve paketlerini yönetin
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    {/* Simplified Labels to fit better */}
                    <TabsList className="flex w-full h-auto p-1">
                        <TabsTrigger value="profile" className="flex-1">Profil</TabsTrigger>
                        <TabsTrigger value="packages" className="flex-1">Paketler</TabsTrigger>
                        <TabsTrigger value="measurements" className="flex-1">Ölçümler</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="mt-4">
                        {formData && (
                            <CustomerForm
                                industryType="pilates"
                                initialData={formData}
                                onSubmit={handleSubmit}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="packages" className="mt-4">
                        {customer && (
                            <ActivePackagesList
                                customerId={customer.id}
                                customerName={customer.name}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="measurements" className="mt-4">
                        {customer && (
                            <MeasurementsList
                                customerId={customer.id}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
