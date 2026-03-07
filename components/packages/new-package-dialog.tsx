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
import { useOrganization } from "@/providers/organization-provider"

const formSchema = z.object({
    name: z.string().min(1, { message: "Lütfen bir ad girin." }),
    type: z.string().min(1, { message: "Lütfen bir tip seçin." }),
    sessions: z.string().optional(),
    price: z.string().min(1, { message: "Fiyat giriniz." }),
    duration_days: z.string().optional(),
    duration: z.string().min(1, { message: "Süre giriniz." })
})

interface NewPackageDialogProps {
    onSuccess: () => void
}

export function NewPackageDialog({ onSuccess }: NewPackageDialogProps) {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "standard",
            sessions: "1",
            price: "",
            duration_days: "365",
            duration: "60"
        }
    })

    const isPackage = true // We can treat all as packages/services for now or simplify.

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)

            const result = await createPackage({
                name: values.name,
                type: values.type,
                credits: parseInt(values.sessions || "1"),
                price: parseFloat(values.price),
                validity_days: values.duration_days ? parseInt(values.duration_days) : 365,
                duration: parseInt(values.duration || "60")
            })

            if (result.success) {
                toast.success(`${config.labels.package} oluşturuldu`)
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
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{config.labels.package || 'Paket'} Tipi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tip seçin" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {config.packageTypes?.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                                <FormLabel>{config.labels.package || 'Tedavi'} Adı</FormLabel>
                                <FormControl>
                                    <Input placeholder={`Örn: Standart ${config.labels.package || 'Tedavi'}`} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isPackage && (
                        <FormField
                            control={form.control}
                            name="sessions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{config.labels.session}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Süre (Dakika)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="60" {...field} />
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

                    {/* Hidden validty */}
                    <input type="hidden" {...form.register("duration_days")} value="365" />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {config.labels.package} Oluştur
                </Button>
            </form>
        </Form>
    )
}
