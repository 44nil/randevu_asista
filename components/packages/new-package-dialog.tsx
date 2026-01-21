"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPackage } from "@/app/package-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(2, { message: "Paket adı en az 2 karakter olmalıdır." }),
    type: z.string().min(1, { message: "Lütfen bir paket türü seçin." }),
    sessions: z.string().min(1, { message: "Seans sayısı giriniz." }),
    price: z.string().min(1, { message: "Fiyat giriniz." }),
    duration_days: z.string().optional()
})

interface NewPackageDialogProps {
    onSuccess: () => void
}

export function NewPackageDialog({ onSuccess }: NewPackageDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "group",
            sessions: "",
            price: "",
            duration_days: "30"
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)
            const result = await createPackage({
                name: values.name,
                type: values.type,
                sessions: parseInt(values.sessions),
                price: parseFloat(values.price),
                duration_days: values.duration_days ? parseInt(values.duration_days) : 30
            })

            if (result.success) {
                toast.success("Paket oluşturuldu")
                form.reset()
                onSuccess()
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Paket Adı</FormLabel>
                            <FormControl>
                                <Input placeholder="Örn: Başlangıç Paketi" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tür</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tür seçin" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="group">Grup Reformer</SelectItem>
                                        <SelectItem value="private">Özel Ders</SelectItem>
                                        <SelectItem value="duo">Düet</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sessions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Seans Sayısı</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="8" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiyat (₺)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="duration_days"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Geçerlilik (Gün)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="30" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Paket Oluştur
                </Button>
            </form>
        </Form>
    )
}
