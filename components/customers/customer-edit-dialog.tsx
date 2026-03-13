"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CustomerForm } from "@/components/forms/customer-form"
import { updateCustomer } from "@/app/actions"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivePackagesList } from "@/components/customers/active-packages-list"
import { MeasurementsList } from "@/components/customers/measurements-list"
import { useOrganization } from "@/providers/organization-provider"

interface CustomerEditDialogProps {
    customer: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CustomerEditDialog({ customer, open, onOpenChange, onSuccess }: CustomerEditDialogProps) {
    const { config, organization } = useOrganization()

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
        industry_type: organization?.industry_type || "general",
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
                    <DialogTitle>{config.labels.customer} Yönetimi</DialogTitle>
                    <DialogDescription>
                        {customer?.name} bilgilerini yönetin
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    {/* Simplified Labels to fit better */}
                    <TabsList className="flex w-full h-auto p-1">
                        <TabsTrigger value="profile" className="flex-1">Profil</TabsTrigger>
                        {config.features.packages && (
                            <TabsTrigger value="packages" className="flex-1">{config.labels.package}ler</TabsTrigger>
                        )}
                        {config.features.measurements && (
                            <TabsTrigger value="measurements" className="flex-1">Ölçümler</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="profile" className="mt-4">
                        {formData && (
                            <CustomerForm
                                industryType={((organization?.settings as any)?.real_industry || organization?.industry_type || 'general') as any}
                                initialData={formData}
                                onSubmit={handleSubmit}
                            />
                        )}
                    </TabsContent>

                    {config.features.packages && (
                        <TabsContent value="packages" className="mt-4">
                            {customer && (
                                <ActivePackagesList
                                    customerId={customer.id}
                                    customerName={customer.name}
                                />
                            )}
                        </TabsContent>
                    )}

                    {config.features.measurements && (
                        <TabsContent value="measurements" className="mt-4">
                            {customer && (
                                <MeasurementsList
                                    customerId={customer.id}
                                />
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
