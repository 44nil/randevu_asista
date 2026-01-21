"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CustomerForm } from "@/components/forms/customer-form"
import { updateCustomer } from "@/app/actions"
import { toast } from "sonner"

interface CustomerEditDialogProps {
    customer: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CustomerEditDialog({ customer, open, onOpenChange, onSuccess }: CustomerEditDialogProps) {
    const handleSubmit = async (data: any) => {
        console.log('handleSubmit called:', data, 'customer.id:', customer?.id);
        const result = await updateCustomer(customer.id, data)

        console.log('Update result:', result);
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Müşteri Düzenle</DialogTitle>
                    <DialogDescription>
                        {customer?.name} bilgilerini güncelleyin
                    </DialogDescription>
                </DialogHeader>
                {formData && (
                    <CustomerForm
                        industryType="pilates"
                        initialData={formData}
                        onSubmit={handleSubmit}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
