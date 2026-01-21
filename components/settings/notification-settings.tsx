"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { updateConfiguration } from "@/app/settings/actions"
import { toast } from "sonner"
import { Loader2, Bell, Mail, CreditCard } from "lucide-react"

interface NotificationSettingsProps {
    settings: any
}

export function NotificationSettings({ settings }: NotificationSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState({
        sms_enabled: settings?.sms_enabled || false,
        email_reminders: settings?.email_reminders || false,
        payment_reminders: settings?.payment_reminders || false
    })

    const handleToggle = (key: string, value: boolean) => {
        setConfig(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            // Merge with existing settings (assuming we retrieved them all, but here we just have partial)
            // In a real app we'd want full merge.
            const result = await updateConfiguration({
                ...settings, // preserve other settings like working hours
                ...config
            })

            if (result.success) {
                toast.success("Bildirim ayarları güncellendi")
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
                    <Bell className="h-5 w-5 text-blue-600" />
                    Bildirim Ayarları
                </CardTitle>
                <CardDescription>
                    Müşterilerinize gidecek otomatik bildirimleri buradan yönetebilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 border-b pb-4">
                    <div className="space-y-1">
                        <Label htmlFor="sms_enabled" className="text-base font-medium">Randevu Hatırlatıcı (SMS)</Label>
                        <p className="text-sm text-slate-500">
                            Ders saati gelmeden 2 saat önce üyeye otomatik SMS gönder.
                        </p>
                    </div>
                    <Switch
                        id="sms_enabled"
                        checked={config.sms_enabled}
                        onCheckedChange={(checked) => handleToggle('sms_enabled', checked)}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 border-b pb-4">
                    <div className="space-y-1">
                        <Label htmlFor="email_reminders" className="text-base font-medium">Yeni Rezervasyon Bildirimi (E-posta)</Label>
                        <p className="text-sm text-slate-500">
                            Yeni bir ders kaydı yapıldığında size e-posta gönderilir.
                        </p>
                    </div>
                    <Switch
                        id="email_reminders"
                        checked={config.email_reminders}
                        onCheckedChange={(checked) => handleToggle('email_reminders', checked)}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="payment_reminders" className="text-base font-medium">Ödeme Hatırlatıcıları</Label>
                        <p className="text-sm text-slate-500">
                            Paket bitimine 1 ders kala üyeye hatırlatma gönder.
                        </p>
                    </div>
                    <Switch
                        id="payment_reminders"
                        checked={config.payment_reminders}
                        onCheckedChange={(checked) => handleToggle('payment_reminders', checked)}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
