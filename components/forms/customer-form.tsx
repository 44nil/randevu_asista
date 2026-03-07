"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createCustomer } from "@/app/actions"
import { useOrganization } from "@/providers/organization-provider"

// Base schema for all customers
const baseSchema = z.object({
    name: z.string().min(2, {
        message: "İsim en az 2 karakter olmalıdır.",
    }),
    phone: z.string().min(10, {
        message: "Telefon numarası geçerli olmalıdır.",
    }),
    email: z.string().email({
        message: "Geçerli bir email adresi giriniz.",
    }).optional().or(z.literal("")),
})

// Industry specific schemas
const pilatesSchema = baseSchema.extend({
    industry_type: z.literal("pilates"),
    metadata: z.object({
        health_notes: z.string().optional(),
    }),
})

const dentalSchema = baseSchema.extend({
    industry_type: z.literal("dental"),
    metadata: z.object({
        blood_type: z.string().optional(),
        chronic_diseases: z.string().optional(),
    }),
})

const hairSchema = baseSchema.extend({
    industry_type: z.literal("hair"),
    metadata: z.object({
        hair_type: z.string().optional(),
        color_code: z.string().optional(),
    }),
})

const generalSchema = baseSchema.extend({
    industry_type: z.literal("general"),
    metadata: z.object({}).optional(),
})

// Discriminated Union
const customerFormSchema = z.discriminatedUnion("industry_type", [
    pilatesSchema,
    dentalSchema,
    hairSchema,
    generalSchema,
])

type CustomerFormValues = z.infer<typeof customerFormSchema>

export interface CustomerFormProps {
    industryType: "pilates" | "dental" | "hair" | "general"
    initialData?: any
    onSubmit?: (data: CustomerFormValues) => void
    onSuccess?: () => void
}

export function CustomerForm({ industryType, initialData, onSubmit, onSuccess }: CustomerFormProps) {
    const { config } = useOrganization()
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: initialData || {
            industry_type: industryType,
            name: "",
            phone: "",
            email: "",
            metadata: {},
        },
    })

    // Reset form when initialData changes (important for Edit Dialog)
    useEffect(() => {
        if (initialData) {
            form.reset({
                industry_type: industryType,
                name: initialData.name || "",
                phone: initialData.phone || "",
                email: initialData.email || "",
                metadata: initialData.metadata || {},
            });
        }
    }, [initialData, form, industryType]);

    async function handleSubmit(data: CustomerFormValues) {
        // If onSubmit is provided (edit mode), use it directly
        if (onSubmit) {
            await onSubmit(data);
            return;
        }

        // Otherwise, create new customer
        const result = await createCustomer(data);

        if (result.success) {
            toast.success(`${config.labels.customer} Başarıyla Kaydedildi`, {
                description: `${data.name} sisteme eklendi.`,
            })
            form.reset();
            if (onSuccess) {
                onSuccess();
            }
        } else {
            toast.error("Hata", {
                description: result.error,
            })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormControl>
                                <Input placeholder="Ahmet Yılmaz" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                                <Input placeholder="555 123 45 67" {...field} value={field.value ?? ""} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="ornek@email.com" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Dynamic Fields based on Industry */}
                {industryType === "pilates" && (
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground">{config.labels.customer} Detayları</h3>
                        <FormField
                            control={form.control}
                            name="metadata.health_notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sağlık Notları</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Bel fıtığı, boyun ağrısı vb." {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {industryType === "dental" && (
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground">Medikal Bilgiler</h3>
                        <FormField
                            control={form.control}
                            name="metadata.blood_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kan Grubu</FormLabel>
                                    <FormControl>
                                        <Input placeholder="A+" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="metadata.chronic_diseases"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kronik Rahatsızlıklar</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Diyabet, Tansiyon..." {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {industryType === "hair" && (
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground">Saç Bilgileri</h3>
                        <FormField
                            control={form.control}
                            name="metadata.hair_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Saç Tipi</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Kuru, Yağlı, İnce telli..." {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="metadata.color_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Boya Kodu</FormLabel>
                                    <FormControl>
                                        <Input placeholder="8.1, 7.3..." {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <Button type="submit">Kaydet</Button>
            </form>
        </Form>
    )
}
