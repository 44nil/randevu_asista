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
    name: z.string().optional(),
    type: z.string().min(1, { message: "Lütfen bir tür seçin." }),
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
            type: config.packageTypes?.[0]?.value || "hair_cut",
            sessions: "1",
            price: "",
            duration_days: "365",
            duration: "60"
        }
    })

    const selectedType = form.watch("type")
    const isPackage = selectedType === "package_deal" || selectedType === "care_package" || selectedType === "bridal_package"

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)

            // Determine name: user input OR label from type
            let packageName = values.name
            if (!packageName) {
                const selectedTypeObj = config.packageTypes?.find(t => t.value === values.type)
                packageName = selectedTypeObj?.label || "Hizmet"
            }

            const result = await createPackage({
                name: packageName,
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
                {isPackage && (
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{config.labels.package} Adı</FormLabel>
                                <FormControl>
                                    <Input placeholder={`Örn: Başlangıç ${config.labels.package}`} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

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
                                        {config.packageTypes?.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        )) || (
                                                <>
                                                    <SelectItem value="group">Grup {config.labels.package}</SelectItem>
                                                    <SelectItem value="private">Özel {config.labels.package}</SelectItem>
                                                </>
                                            )}
                                    </SelectContent>
                                </Select>
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
