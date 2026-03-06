"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCustomers } from "@/app/actions"
import { createClassSession } from "@/app/appointment-actions"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X, Check } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

import { useOrganization } from "@/providers/organization-provider"

const appointmentFormSchema = z.object({
    title: z.string().min(2, "Başlık en az 2 karakter olmalıdır"),
    customer_ids: z.array(z.string()), // Optional - can be empty
    appointment_date: z.date(),
    time: z.string().min(1, "Saat seçiniz"),
    duration: z.string(),
    type: z.string().min(1, "Tip seçiniz"),
    max_attendees: z.string(),
    is_recurring: z.boolean(),
    recurring_weeks: z.string().optional()
})

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>

interface AppointmentFormProps {
    onSuccess?: () => void
    defaultDate?: Date
}

export function AppointmentForm({ onSuccess, defaultDate }: AppointmentFormProps) {
    const { config } = useOrganization()
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Track when component is mounted on client side
    useEffect(() => {
        setMounted(true)
    }, [])

    // Load customers for selection
    useEffect(() => {
        getCustomers().then(res => {
            if (res.success) setCustomers(res.data)
        })
    }, [])

    const form = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentFormSchema),
        defaultValues: {
            title: "",
            duration: "60",
            type: config.appointmentTypes?.[0]?.value || "standard",
            max_attendees: "1",
            appointment_date: defaultDate || new Date(),
            time: "09:00",
            customer_ids: [],
            is_recurring: false,
            recurring_weeks: "4"
        },
    })

    const selectedCustomerIds = form.watch("customer_ids")
    const isRecurring = form.watch("is_recurring")

    const handleAddCustomer = (customerId: string) => {
        const current = form.getValues("customer_ids")
        if (!current.includes(customerId)) {
            form.setValue("customer_ids", [...current, customerId])
        }
    }

    const handleRemoveCustomer = (customerId: string) => {
        const current = form.getValues("customer_ids")
        form.setValue("customer_ids", current.filter(id => id !== customerId))
    }

    async function onSubmit(data: AppointmentFormValues) {
        console.log('📝 Form submitted with data:', data)
        setLoading(true)

        try {
            // Combine date and time - properly handle timezone
            const [hours, minutes] = data.time.split(':').map(Number)

            // Create date in local timezone
            const selectedDate = new Date(data.appointment_date)
            const startDateTime = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                hours,
                minutes,
                0,
                0
            )

            console.log('🕐 Calling createClassSession with:', {
                customer_ids: data.customer_ids,
                appointment_date: startDateTime.toISOString(),
                duration_minutes: parseInt(data.duration),
                type: data.type,
                recurring_weeks: data.is_recurring ? parseInt(data.recurring_weeks || "1") : 1,
                capacity: parseInt(data.max_attendees)
            })

            const result = await createClassSession({
                customer_ids: data.customer_ids,
                appointment_date: startDateTime.toISOString(),
                duration_minutes: parseInt(data.duration),
                type: data.type,
                recurring_weeks: data.is_recurring ? parseInt(data.recurring_weeks || "1") : 1,
                capacity: parseInt(data.max_attendees)
            })

            console.log('📊 Result from createClassSession:', result)

            if (result.success) {
                toast.success(data.is_recurring
                    ? `${parseInt(data.recurring_weeks || "0")} haftalık program oluşturuldu`
                    : `${config.labels.appointment} oluşturuldu`
                )
                form.reset()
                if (onSuccess) onSuccess()
            } else {
                console.error('❌ Error from createClassSession:', result.error)
                toast.error("Hata", { description: result.error })
            }
        } catch (error) {
            console.error('❌ Exception in onSubmit:', error)
            toast.error("Beklenmedik hata", { description: String(error) })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{config.labels.appointment} Başlığı</FormLabel>
                            <FormControl>
                                <Input placeholder={`Örn: ${config.labels.appointment} - Muayene`} {...field} />
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
                                <FormLabel>{config.labels.appointment} Tipi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {config.appointmentTypes?.map(type => (
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

                    <FormItem>
                        <FormLabel>Katılımcılar</FormLabel>
                        <Select onValueChange={handleAddCustomer}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={`${config.labels.customer} Seç (+)`} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {customers.map(c => (
                                    <SelectItem key={c.id} value={c.id} disabled={selectedCustomerIds.includes(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedCustomerIds.map(id => {
                                const customer = customers.find(c => c.id === id)
                                return (
                                    <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                        {customer?.name || "Bilinmeyen"}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-transparent text-slate-500 hover:text-red-500 rounded-full"
                                            onClick={() => handleRemoveCustomer(id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )
                            })}
                            {selectedCustomerIds.length === 0 && (
                                <p className="text-xs text-slate-400 italic">Katılımcı eklemeden {config.labels.appointment.toLowerCase()} oluşturabilirsiniz. {config.labels.customer}ler randevu alabilir.</p>
                            )}
                        </div>
                        <FormMessage>{form.formState.errors.customer_ids?.message}</FormMessage>
                    </FormItem>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="appointment_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Tarih</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {mounted && field.value ? (
                                                    format(field.value, "PPP", { locale: tr })
                                                ) : (
                                                    <span>Tarih seçin</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Saat</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Array.from({ length: 15 }, (_, i) => i + 8).map(hour => (
                                            <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                                {hour.toString().padStart(2, '0')}:00
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Süre (Dk)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="30">30 Dakika</SelectItem>
                                        <SelectItem value="45">45 Dakika</SelectItem>
                                        <SelectItem value="50">50 Dakika</SelectItem>
                                        <SelectItem value="60">60 Dakika</SelectItem>
                                        <SelectItem value="90">90 Dakika</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {config.features.classes && (
                        <FormField
                            control={form.control}
                            name="max_attendees"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kontenjan</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Recurring Options */}
                <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                    <FormField
                        control={form.control}
                        name="is_recurring"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Tekrarlı Ders</FormLabel>
                                    <FormDescription>
                                        Bu dersi sonraki haftalara da kopyala
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {isRecurring && (
                        <FormField
                            control={form.control}
                            name="recurring_weeks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kaç hafta tekrar edecek?</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" max="52" {...field} />
                                    </FormControl>
                                    <FormDescription>Örn: 4 yazarsanız, bu ders ve sonraki 3 hafta (toplam 4 ders) oluşturulur.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                    onClick={() => console.log('🔘 Submit button clicked!')}
                >
                    {loading ? "Planlanıyor..." : `${config.labels.appointment} Oluştur`}
                </Button>
            </form>
        </Form >
    )
}
