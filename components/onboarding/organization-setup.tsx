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
import { createOrganization } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
    industry: z.enum(["pilates", "dental", "hair", "general"]),
})

export function OrganizationSetup() {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            industry: "general",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const result = await createOrganization(values)

        if (result.success) {
            toast.success("İşletmeniz Oluşturuldu!", {
                description: "Yönlendiriliyorsunuz...",
            })
            window.location.href = '/'
        } else {
            toast.error("Hata", {
                description: result.error,
            })
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
                                            <Input placeholder="Örn: Asista Sağlık Merkezi" {...field} />
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

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                İşletmeyi Oluştur
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
