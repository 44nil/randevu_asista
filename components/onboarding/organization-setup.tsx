"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createOrganization, fixUserConnection } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

const formSchema = z.object({
    name: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
    industry: z.enum(["pilates", "dental", "hair", "general"]),
    subdomain: z.string().min(3, "Alt alan adı en az 3 karakter olmalıdır").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanabilirsiniz"),
})

export function OrganizationSetup() {
    const { user } = useUser()
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            industry: "general",
            subdomain: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const result = await createOrganization(values)

        if (result.success) {
            toast.success("İşletmeniz Oluşturuldu!", {
                description: "Yönlendiriliyorsunuz...",
            })
            // Force a hard reload to ensure all states (including layout) are updated
            window.location.reload()
        } else {
            toast.error("Hata", {
                description: result.error,
            })
        }
    }

    async function handleFix() {
        toast.info("Bağlantı onarılıyor...")
        const res = await fixUserConnection()
        if (res.success) {
            toast.success("Bağlantı onarıldı! Yönlendiriliyorsunuz.")
            window.location.reload()
        } else {
            toast.error("Hata: " + res.error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>İşletmenizi Oluşturun</CardTitle>
                    <CardDescription>
                        Randevu sistemini kullanmaya başlamak için işletme bilgilerinizi girin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>İşletme Adı</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: Sağlık Pilates Merkezi" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="industry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sektör</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sektör seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pilates">Pilates</SelectItem>
                                                <SelectItem value="dental">Diş Kliniği</SelectItem>
                                                <SelectItem value="hair">Kuaför</SelectItem>
                                                <SelectItem value="general">Genel</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="subdomain"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alt Alan Adı</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ornek-isletme" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full">
                                Oluştur
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-4 p-4 bg-slate-100 rounded text-xs text-slate-500 font-mono break-all">
                        <p className="font-bold text-slate-700 mb-2">Debug Bilgisi:</p>
                        <p>User ID: {user?.id}</p>
                        <div className="flex flex-col gap-2 mt-2">
                            <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => window.location.href = '/'}>
                                Sayfayı Zorla Yenile
                            </span>
                            <span className="text-red-600 cursor-pointer hover:underline font-bold" onClick={handleFix}>
                                Bağlantıyı Onar (Elif Pilates)
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
