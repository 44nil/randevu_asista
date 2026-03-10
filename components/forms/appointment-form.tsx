"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCustomers, getStaffSchedule, getStaffTimeOffs } from "@/app/actions"
import { getStaffList } from "@/app/staff-actions"
import { createClassSession } from "@/app/appointment-actions"
import { toast } from "sonner"
import { useEffect, useState, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X, Check, Search, UserPlus, Trash2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CustomerForm } from "@/components/forms/customer-form"

import { useOrganization } from "@/providers/organization-provider"

const appointmentFormSchema = z.object({
    title: z.string().min(2, "Başlık en az 2 karakter olmalıdır"),
    customer_ids: z.array(z.string()),
    instructor_id: z.string().optional(),
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
    staffId?: string
}

export function AppointmentForm({ onSuccess, defaultDate, staffId }: AppointmentFormProps) {
    const { config, organization } = useOrganization()
    const [customers, setCustomers] = useState<any[]>([])
    const [staffList, setStaffList] = useState<any[]>([])
    const [schedules, setSchedules] = useState<any[]>([])
    const [timeOffs, setTimeOffs] = useState<any[]>([])
    const [availableTimes, setAvailableTimes] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [customerPage, setCustomerPage] = useState(0)
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const loadCustomers = async () => {
        const res = await getCustomers()
        if (res.success) setCustomers(res.data)
    }

    useEffect(() => {
        loadCustomers()
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
            instructor_id: staffId || "",
            is_recurring: false,
            recurring_weeks: "4"
        },
    })

    useEffect(() => {
        const loadInitialData = async () => {
            const [custRes, staffRes] = await Promise.all([
                getCustomers(),
                getStaffList()
            ])
            if (custRes.success) setCustomers(custRes.data)
            if (staffRes.success) setStaffList(staffRes.data || [])
        }
        loadInitialData()
    }, [])

    const currentInstructorId = form.watch("instructor_id")
    const appointmentDate = form.watch("appointment_date")
    const isRecurring = form.watch("is_recurring")

    useEffect(() => {
        const loadSchedule = async () => {
            if (!currentInstructorId) return
            const [schedRes, offRes] = await Promise.all([
                getStaffSchedule(currentInstructorId),
                getStaffTimeOffs(currentInstructorId)
            ])
            if (schedRes.success) setSchedules(schedRes.data || [])
            if (offRes.success) setTimeOffs(offRes.data || [])
        }
        loadSchedule()
    }, [currentInstructorId])

    useEffect(() => {
        if (!appointmentDate) return

        const times: string[] = []
        for (let h = 8; h <= 20; h++) {
            times.push(`${h.toString().padStart(2, '0')}:00`)
            times.push(`${h.toString().padStart(2, '0')}:30`)
        }
        setAvailableTimes(times)
    }, [appointmentDate])

    const PAGE_SIZE = 5

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers
        return customers.filter(c =>
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        )
    }, [customers, searchTerm])

    useEffect(() => {
        setCustomerPage(0)
    }, [searchTerm])

    const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE)
    const pagedCustomers = filteredCustomers.slice(customerPage * PAGE_SIZE, (customerPage + 1) * PAGE_SIZE)

    const selectedCustomerIds = form.watch("customer_ids") || []

    const handleAddCustomer = (id: string) => {
        const current = form.getValues("customer_ids") || []
        if (current.includes(id)) return
        form.setValue("customer_ids", [...current, id])
        setIsPickerOpen(false)
        setSearchTerm("")
    }

    const handleRemoveCustomer = (id: string) => {
        const current = form.getValues("customer_ids") || []
        form.setValue("customer_ids", current.filter(cid => cid !== id))
    }

    async function onSubmit(values: AppointmentFormValues) {
        setLoading(true)
        setFormError(null)
        try {
            const dateStr = format(values.appointment_date, 'yyyy-MM-dd')
            // Yerel saat olarak işle — UTC'ye çevirme (timezone offset ekle)
            const [hours, minutes] = values.time.split(':').map(Number)
            const start = new Date(values.appointment_date)
            start.setHours(hours, minutes, 0, 0)
            const end = new Date(start.getTime() + parseInt(values.duration) * 60000)

            const res = await createClassSession({
                title: values.title,
                type: values.type,
                instructor_id: values.instructor_id,
                appointment_date: start.toISOString(),
                duration_minutes: parseInt(values.duration),
                capacity: parseInt(values.max_attendees),
                customer_ids: values.customer_ids,
                recurring_weeks: values.is_recurring ? parseInt(values.recurring_weeks || "4") : 1
            })

            if (res.success) {
                toast.success(`${config.labels.appointment} başarıyla oluşturuldu`)
                onSuccess?.()
            } else {
                setFormError(res.error || "Bir hata oluştu")
                toast.error(res.error || "Bir hata oluştu")
            }
        } catch (error) {
            setFormError("İşlem sırasında bir hata oluştu")
            toast.error("İşlem sırasında bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    // Reset error when values change
    useEffect(() => {
        const subscription = form.watch(() => setFormError(null))
        return () => subscription.unsubscribe()
    }, [form.watch])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6 bg-white overflow-visible">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">YENİ {config.labels.appointment.toUpperCase()}</h2>
                    <p className="text-sm text-t3 font-medium">Lütfen gerekli bilgileri eksiksiz doldurun.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black text-navy uppercase tracking-widest">HİZMET BAŞLIĞI</FormLabel>
                                <FormControl>
                                    <Input placeholder={`Örn: ${config.labels.appointment} - Muayene`} {...field} className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-medium text-navy shadow-sm focus:border-electric focus:ring-4 focus:ring-electric/5 transition-all px-4" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black text-navy uppercase tracking-widest">{config.labels.appointment} Tipi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-bold text-navy hover:bg-bg transition-all px-4 shadow-sm">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-border-brand/30 shadow-elevated">
                                        {config.appointmentTypes?.map(type => (
                                            <SelectItem key={type.value} value={type.value} className="font-medium">{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="instructor_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black text-navy uppercase tracking-widest">{config.labels.instructor}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-bold text-navy hover:bg-bg transition-all px-4 shadow-sm">
                                            <SelectValue placeholder={`${config.labels.instructor} Seçiniz`} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-border-brand/30 shadow-elevated">
                                        {staffList.map(staff => (
                                            <SelectItem key={staff.id} value={staff.id} className="font-medium">{staff.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <FormItem className="flex flex-col">
                        <FormLabel className="text-xs font-black text-navy uppercase tracking-widest">{config.labels.customer} Seçimi</FormLabel>
                        <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isPickerOpen}
                                    className="w-full justify-between font-bold h-12 rounded-input border-[1.5px] border-border-brand bg-white text-navy hover:bg-bg hover:border-electric/30 transition-all px-4 shadow-sm"
                                >
                                    <span className="truncate">
                                        {selectedCustomerIds.length > 0
                                            ? customers.find((c) => c.id === selectedCustomerIds[0])?.name
                                            : `${config.labels.customer} Seç...`}
                                    </span>
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 text-electric" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[340px] p-0 bg-white border border-border-brand/40 shadow-elevated z-[200]" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
                                <div className="flex flex-col p-3 space-y-3 bg-white">
                                    <div className="flex items-center border rounded-md px-3 bg-slate-50">
                                        <Search className="h-4 w-4 mr-2 opacity-50" />
                                        <Input
                                            placeholder="İsim veya telefon..."
                                            className="border-0 focus-visible:ring-0 bg-transparent h-10 p-0 text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        {pagedCustomers.length > 0 ? (
                                            pagedCustomers.map((c) => (
                                                <div
                                                    key={c.id}
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-slate-100 text-sm transition-colors",
                                                        selectedCustomerIds.includes(c.id) && "bg-blue-50 text-blue-700 font-bold"
                                                    )}
                                                    onClick={() => handleAddCustomer(c.id)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span>{c.name}</span>
                                                        <span className="text-[10px] opacity-60 font-medium">{c.phone}</span>
                                                    </div>
                                                    {selectedCustomerIds.includes(c.id) && <Check className="h-4 w-4" />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-sm text-slate-500 italic font-medium">
                                                {config.labels.customer} bulunamadı
                                            </div>
                                        )}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-1 pt-2">
                                            <button type="button" onClick={() => setCustomerPage(p => Math.max(0, p - 1))} disabled={customerPage === 0} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-sm font-bold flex items-center justify-center transition-colors">&lt;</button>
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <button key={i} type="button" onClick={() => setCustomerPage(i)} className={cn("w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors", customerPage === i ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600")}>{i + 1}</button>
                                            ))}
                                            <button type="button" onClick={() => setCustomerPage(p => Math.min(totalPages - 1, p + 1))} disabled={customerPage === totalPages - 1} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-sm font-bold flex items-center justify-center transition-colors">&gt;</button>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t">
                                        <Button type="button" variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold h-10 text-xs" onClick={() => { setIsPickerOpen(false); setIsCustomerDialogOpen(true) }}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            YENİ {config.labels.customer.toUpperCase()} EKLE
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                            <DialogContent className="max-w-md bg-white">
                                <DialogHeader>
                                    <DialogTitle>Yeni {config.labels.customer} Kaydı</DialogTitle>
                                </DialogHeader>
                                <CustomerForm
                                    industryType={(organization?.industry_type as any) || "general"}
                                    onSuccess={() => { loadCustomers(); setIsCustomerDialogOpen(false) }}
                                />
                            </DialogContent>
                        </Dialog>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedCustomerIds.map((id: string) => {
                                const customer = customers.find(c => c.id === id)
                                return (
                                    <Badge key={id} variant="secondary" className="pl-3 pr-1.5 py-1.5 flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-100 font-bold rounded-full text-[10px]">
                                        {customer?.name}
                                        <button
                                            type="button"
                                            className="h-4 w-4 flex items-center justify-center hover:bg-blue-200 text-blue-400 hover:text-red-500 rounded-full transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleRemoveCustomer(id)
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )
                            })}
                        </div>
                    </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="appointment_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-black text-navy uppercase tracking-widest">Tarih</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "w-full pl-4 text-left font-bold h-12 rounded-input border-[1.5px] border-border-brand bg-white text-navy hover:bg-bg transition-all shadow-sm",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {mounted && field.value ? (
                                                    format(field.value, "PPP", { locale: tr })
                                                ) : (
                                                    <span>Tarih seçin</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-electric" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white border-border-brand/30 shadow-elevated z-[200]" align="start" side="bottom" avoidCollisions={false}>
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            locale={tr}
                                            initialFocus
                                            className="bg-white"
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
                                <FormLabel className="text-xs font-black text-navy uppercase tracking-widest">Saat</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-bold text-navy hover:bg-bg transition-all px-4 shadow-sm">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-border-brand/30 shadow-elevated">
                                        {availableTimes.map(time => (
                                            <SelectItem key={time} value={time} className="font-medium">{time}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black text-navy uppercase tracking-widest">Süre (Dk)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-bold text-navy hover:bg-bg transition-all px-4 shadow-sm">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-border-brand/30 shadow-elevated">
                                        <SelectItem value="30" className="font-medium">30 Dakika</SelectItem>
                                        <SelectItem value="45" className="font-medium">45 Dakika</SelectItem>
                                        <SelectItem value="60" className="font-medium">60 Dakika</SelectItem>
                                        <SelectItem value="90" className="font-medium">90 Dakika</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {formError && (
                    <div className="bg-red-50 border-[1.5px] border-red-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-red-500 rounded-full p-1 mt-0.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-[11px] font-black text-red-600 uppercase tracking-widest leading-none">İŞLEM ENGELLENDİ</p>
                            <p className="text-sm font-bold text-red-900 leading-tight">{formError}</p>
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    className={cn(
                        "w-full bg-electric text-white rounded-btn font-black text-sm shadow-cta hover:bg-navy transition-all h-14 uppercase tracking-widest",
                        formError && "bg-red-600 hover:bg-red-700 shadow-none"
                    )}
                    disabled={loading}
                >
                    {loading ? "Planlanıyor..." : `${config.labels.appointment.toUpperCase()} OLUŞTUR`}
                </Button>
            </form>
        </Form>
    )
}
