"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateOrganizationSettings } from "@/app/settings/actions"
import { toast } from "sonner"
import { Loader2, Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
    industry_type: z.string().optional(),
    name: z.string().min(2, { message: "Salon adı en az 2 karakter olmalıdır." }),
    phone: z.string().min(10, { message: "Geçerli bir telefon numarası giriniz." }),
    email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
    address: z.string().optional(),
    logo_url: z.string().optional()
})

interface GeneralSettingsProps {
    defaultValues: any
}

export function GeneralSettings({ defaultValues }: GeneralSettingsProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            industry_type: defaultValues?.industry_type || "general",
            name: defaultValues?.name || "",
            phone: defaultValues?.phone || "",
            email: defaultValues?.email || "",
            address: defaultValues?.address || "",
            logo_url: defaultValues?.logo_url || ""
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)
            const result = await updateOrganizationSettings(values as any)

            if (result.success) {
                toast.success("Ayarlar güncellendi")
                // Reload to apply industry changes globally
                window.location.reload()
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
        <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logo Section */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-base">İşletme Logosu</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-40 w-40 rounded-lg border-2 border-dashed border-slate-200">
                                <AvatarImage src={form.watch('logo_url')} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-slate-50 text-slate-300">LOGO</AvatarFallback>
                            </Avatar>
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer">
                                <Camera className="h-8 w-8 mb-2" />
                                <span className="text-xs font-medium">Görseli Değiştir</span>
                                {/* Mock file input for now */}
                                <input type="file" className="hidden" onChange={() => toast.info("Dosya yükleme henüz aktif değil.")} />
                            </label>
                        </div>
                        <p className="text-xs text-center text-slate-500">
                            PNG veya JPG, max 2MB
                        </p>
                    </CardContent>
                </Card>

                {/* General Info Form */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 p-1 rounded-full w-5 h-5 flex items-center justify-center text-xs">i</span>
                            İşletme Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="industry_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>İşletme Tipi</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="İşletme Tipi Seçiniz" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pilates">Pilates Stüdyosu</SelectItem>
                                                        <SelectItem value="hair">Kuaför / Berber</SelectItem>
                                                        <SelectItem value="dental">Diş Kliniği</SelectItem>
                                                        <SelectItem value="general">Güzellik Merkezi / Diğer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Sistemin terminolojisi seçiminize göre değişecektir.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>İşletme Adı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="İşletme adınızı girin" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefon Numarası</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+90 (555) 123 45 67" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-posta Adresi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="info@zenpilates.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Adres</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Bağdat Caddesi, No:123 Daire:4, Kadıköy, İstanbul"
                                                    className="resize-none h-24"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Değişiklikleri Kaydet
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
