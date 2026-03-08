"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateUserProfile } from "@/app/profile-actions"
import { Loader2, User, Activity, Bell, Camera, Shield, Lock } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"
import { cn } from "@/lib/utils"

interface ProfileFormProps {
    user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
    const { config: industryConfig } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user?.full_name || "",
        phone: user?.phone || "",
        avatar_url: user?.avatar_url || "",
        birth_date: user?.metadata?.birth_date || "",
        medical_notes: user?.metadata?.medical_notes || "",
        notification_preferences: user?.metadata?.notification_preferences || { reminders: true, campaigns: false }
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSwitchChange = (key: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            notification_preferences: {
                ...prev.notification_preferences,
                [key]: checked
            }
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const res = await updateUserProfile(formData)
            if (res.success) {
                toast.success("Değişiklikler başarıyla kaydedildi")
            } else {
                toast.error("Hata", { description: res.error })
            }
        } catch (error) {
            toast.error("Beklenmedik bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
                {/* Profile Summary Card */}
                <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-3 border-2 border-white shadow-sm">
                            <AvatarImage src={formData.avatar_url} className="object-cover" />
                            <AvatarFallback className="text-xl bg-slate-100 text-slate-500">
                                {formData.full_name?.substring(0, 2).toUpperCase() || "ÜY"}
                            </AvatarFallback>
                        </Avatar>

                        <h3 className="font-bold text-slate-900">{formData.full_name || `İsimsiz ${industryConfig.labels.customer}`}</h3>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">Premium {industryConfig.labels.customer}</p>

                        <Button className="w-full mt-6" size="sm" onClick={() => scrollToSection('personal')}>
                            <User className="mr-2 h-4 w-4" /> Kişisel Bilgiler
                        </Button>
                    </CardContent>
                </Card>

                {/* Navigation Menu (Visual Only since we scroll) */}
                <Card className="border shadow-sm rounded-xl overflow-hidden bg-white p-2">
                    <div className="flex flex-col space-y-1">
                        <button onClick={() => scrollToSection('health')} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left">
                            <Activity className="h-4 w-4" /> Sağlık & Fiziksel Notlar
                        </button>
                        <button onClick={() => scrollToSection('notifications')} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left">
                            <Bell className="h-4 w-4" /> Bildirim Tercihleri
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed rounded-lg text-left">
                            <Shield className="h-4 w-4" /> Şifre & Güvenlik
                        </button>
                    </div>
                </Card>

                {/* Quote Box */}
                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 italic leading-relaxed">
                    &quot;Profilinizi güncel tutmak, {industryConfig.labels.instructor.toLowerCase()}lerinizin size en uygun hizmeti hazırlamasına yardımcı olur.&quot;
                </div>
            </div>

            {/* Right Content Area (Stacked Cards) */}
            <div className="lg:col-span-9 space-y-6">

                {/* 1. Header Card */}
                <Card className="border shadow-sm rounded-xl bg-white">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                <AvatarImage src={formData.avatar_url} />
                                <AvatarFallback className="text-4xl bg-slate-100 text-slate-400">
                                    {formData.full_name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm border border-white bg-blue-600 hover:bg-blue-700 text-white">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">{formData.full_name}</h2>
                            <p className="text-slate-500">{industryConfig.labels.customer} No: #{user?.id?.substring(0, 6)} • Kayıt: {new Date(user?.created_at).toLocaleDateString("tr-TR", { month: 'long', year: 'numeric' })}</p>
                            <Button variant="outline" size="sm" className="mt-2 text-slate-600">
                                Fotoğrafı Değiştir
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Personal Info */}
                <div id="personal">
                    <Card className="border shadow-sm rounded-xl bg-white">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold text-slate-800">Kişisel Bilgiler</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Ad Soyad</Label>
                                <Input
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="h-11 bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">E-posta Adresi</Label>
                                <Input
                                    value={user?.email}
                                    disabled
                                    className="h-11 bg-slate-50 border-slate-200 text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Telefon</Label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+90 5XX XXX XX XX"
                                    className="h-11 bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Doğum Tarihi</Label>
                                <Input
                                    type="date"
                                    name="birth_date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    className="h-11 bg-white border-slate-200 w-full block"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Health Notes */}
                <div id="health">
                    <Card className="border shadow-sm rounded-xl bg-white">
                        <CardHeader className="pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-800">Sağlık & Fiziksel Notlar</CardTitle>
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">{industryConfig.labels.instructor}larla Paylaşılır</span>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Sakatlık Bilgisi & Fiziksel Sınırlar</Label>
                                <Textarea
                                    name="medical_notes"
                                    value={formData.medical_notes}
                                    onChange={handleChange}
                                    placeholder="Sol diz kapağımda eski bir spor sakatlığına bağlı zaman zaman hassasiyet oluyor. Çok zorlamamaya çalışıyorum."
                                    className="min-h-[120px] bg-slate-50/50 border-slate-200 resize-none text-base p-4"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Notifications */}
                <div id="notifications">
                    <Card className="border shadow-sm rounded-xl bg-white">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold text-slate-800">Bildirim Tercihleri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700">{industryConfig.labels.appointment} Hatırlatmaları</p>
                                    <p className="text-sm text-slate-500">{industryConfig.labels.appointment}ınızdan 1 saat önce bildirim alın.</p>
                                </div>
                                <Switch
                                    checked={formData.notification_preferences.reminders}
                                    onCheckedChange={(c) => handleSwitchChange('reminders', c)}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700">Kampanya & Duyurular</p>
                                    <p className="text-sm text-slate-500">Yeni {industryConfig.labels.package.toLowerCase()}ler ve indirimlerden haberdar olun.</p>
                                </div>
                                <Switch
                                    checked={formData.notification_preferences.campaigns}
                                    onCheckedChange={(c) => handleSwitchChange('campaigns', c)}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Password Section - Placeholder to show it was removed but keeping layout balance? 
                    User explicitly said "REMOVE", so I will NOT add it. 
                    The screenshot might have it but text overrides image.
                */}

                {/* 5. Actions */}
                <div className="flex justify-end gap-3 pt-4 pb-8">
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-900">Vazgeç</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[180px] shadow-sm"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </div>
        </div>
    )
}
