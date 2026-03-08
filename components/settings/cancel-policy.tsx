"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateConfiguration } from "@/app/settings/actions"
import { toast } from "sonner"
import { Loader2, AlertCircle } from "lucide-react"

import { useOrganization } from "@/providers/organization-provider"

interface CancelPolicyProps {
    settings: any
}

export function CancelPolicy({ settings }: CancelPolicyProps) {
    const { config: industryConfig } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [hours, setHours] = useState(settings?.cancellation_policy?.hours || "24")

    const handleSave = async () => {
        try {
            setLoading(true)
            const result = await updateConfiguration({
                ...settings,
                cancellation_policy: { hours }
            })

            if (result.success) {
                toast.success("İptal politikası güncellendi")
            } else {
                toast.error("Hata", { description: result.error })
            }
        } catch (error) {
            toast.error("Beklenmeyen bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    İptal Politikası
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Kaç saat önce iptal edilebilir?</label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            className="max-w-[100px]"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                        />
                        <span className="text-sm text-slate-500">saat</span>
                    </div>
                    <p className="text-xs text-slate-500">
                        {industryConfig.labels.appointment} başlamasına bu süreden az kaldıysa {industryConfig.labels.customer.toLowerCase()}nin bakiyesi iade edilmez.
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={loading} size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
