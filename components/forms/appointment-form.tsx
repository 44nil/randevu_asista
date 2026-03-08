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
import { CalendarIcon, X, Check, Search, UserPlus, Trash2 } from "lucide-react"
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
    customer_ids: z.array(z.string()), // Optional - can be empty
    instructor_id: z.string().optional(), // Added
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
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    // Track when component is mounted on client side
    useEffect(() => {
        setMounted(true)
    }, [])

    // Load customers for selection
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

    // Load customers and staff schedule
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

    // Update schedules and timeoffs when instructor changes
    useEffect(() => {
        if (currentInstructorId) {
            getStaffSchedule(currentInstructorId).then(res => {
                if (res.success) setSchedules(res.data || [])
            })
            getStaffTimeOffs(currentInstructorId).then(res => {
                if (res.success) setTimeOffs(res.data || [])
            })
        } else {
            setSchedules([])
            setTimeOffs([])
        }
    }, [currentInstructorId])

    const selectedDate = form.watch("appointment_date")

    // Update available times based on selected date and staff schedule
    useEffect(() => {
        if (!selectedDate) {
            setAvailableTimes([])
            return
        }

        if (!currentInstructorId || schedules.length === 0) {
            // Check organization-level working hours for general availability
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[selectedDate.getDay()];
            const orgDayConfig = (organization as any)?.settings?.working_hours?.[dayName];

            if (orgDayConfig && orgDayConfig.isOpen === false) {
                setAvailableTimes([]);
                form.setValue("time", "");
                return;
            }

            const times = []
            // If org day config exists and is open, use its times, otherwise use default 8-22
            let startH = 8, endH = 22;
            if (orgDayConfig?.isOpen && orgDayConfig.open && orgDayConfig.close) {
                [startH] = orgDayConfig.open.split(':').map(Number);
                [endH] = orgDayConfig.close.split(':').map(Number);
            }

            for (let h = startH; h <= endH; h++) {
                times.push(`${h.toString().padStart(2, '0')}:00`)
                times.push(`${h.toString().padStart(2, '0')}:30`)
            }
            setAvailableTimes(times)
            return
        }

        const dayOfWeek = selectedDate.getDay()
        const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek)

        if (!daySchedule || !daySchedule.is_working_day) {
            setAvailableTimes([])
            form.setValue("time", "")
            return
        }

        const times = []
        const [startH, startM] = daySchedule.start_time.split(':').map(Number)
        const [endH, endM] = daySchedule.end_time.split(':').map(Number)

        let currentH = startH
        let currentM = startM

        while (currentH < endH || (currentH === endH && currentM <= endM)) {
            times.push(`${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`)
            currentM += 30
            if (currentM >= 60) {
                currentM -= 60
                currentH += 1
            }
        }

        setAvailableTimes(times)

        const currentTime = form.getValues("time")
        if (currentTime && !times.includes(currentTime)) {
            form.setValue("time", "")
        }

    }, [selectedDate, schedules, currentInstructorId, form])

    const selectedCustomerIds = form.watch("customer_ids")
    const isRecurring = form.watch("is_recurring")

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        )
    }, [customers, searchTerm])

    const handleAddCustomer = (customerId: string) => {
        const current = form.getValues("customer_ids")
        if (config.features.classes) {
            // Group class: multiple allowed
            if (!current.includes(customerId)) {
                form.setValue("customer_ids", [...current, customerId])
            }
        } else {
            // Individual (Dental/Hair): only one allowed
            form.setValue("customer_ids", [customerId])
            setIsPickerOpen(false)
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
                instructor_id: data.instructor_id,
                appointment_date: startDateTime.toISOString(),
                duration_minutes: parseInt(data.duration),
                type: data.type,
                recurring_weeks: data.is_recurring ? parseInt(data.recurring_weeks || "1") : 1,
                capacity: parseInt(data.max_attendees)
            })

            console.log('📊 Result from createClassSession:', result)

            if (result.success) {
                toast.success("Randevu Planlandı", {
                    description: data.is_recurring
                        ? `${parseInt(data.recurring_weeks || "0")} haftalık program başarıyla oluşturuldu.`
                        : "Randevunuz sisteme eklendi ve onaylandı."
                })
                form.reset()
                if (onSuccess) onSuccess()
            } else {
                console.error('❌ Error from createClassSession:', result.error)
                toast.error("İşlem Başarısız", { description: result.error })
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-2">
                <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-navy tracking-tight uppercase">
                        YENİ {config.labels.appointment.toUpperCase()}
                    </h2>
                    <p className="text-t2 text-xs font-medium mt-1">Lütfen gerekli bilgileri eksiksiz doldurun.</p>
                </div>

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-navy font-bold text-[11px] uppercase tracking-wider mb-2">Hizmet Başlığı</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={`Örn: ${config.labels.appointment} - Muayene`}
                                    {...field}
                                    className="rounded-input border-[1.5px] border-border-brand h-12 focus:border-electric focus:ring-4 focus:ring-electric/5 transition-all font-medium text-navy bg-white shadow-sm"
                                />
                            </FormControl>
                            <FormMessage className="text-[11px] font-bold" />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="mb-2">{config.labels.appointment} Tipi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-medium text-navy hover:bg-bg transition-all shadow-sm">
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

                    {/* Instructor Selection (Only for Admin/Owner) */}
                    {['owner', 'admin'].includes((organization as any)?.role || 'owner') && staffList.length > 0 ? (
                        <FormField
                            control={form.control}
                            name="instructor_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="mb-2">{config.labels.instructor}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-medium text-navy hover:bg-bg transition-all shadow-sm">
                                                <SelectValue placeholder={`${config.labels.instructor} Seçiniz`} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {staffList.map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <FormItem className="flex flex-col justify-end">
                            <FormLabel className="mb-2">{config.labels.customer} Seçimi</FormLabel>
                            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
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
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <div className="flex flex-col p-2 space-y-2">
                                        <div className="flex items-center border rounded-md px-3 bg-slate-50">
                                            <Search className="h-4 w-4 mr-2 opacity-50" />
                                            <Input
                                                placeholder="İsim veya telefon..."
                                                className="border-0 focus-visible:ring-0 bg-transparent h-9 p-0"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((c) => (
                                                    <div
                                                        key={c.id}
                                                        className={cn(
                                                            "flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-slate-100 text-sm",
                                                            selectedCustomerIds.includes(c.id) && "bg-blue-50 text-blue-700 font-medium"
                                                        )}
                                                        onClick={() => handleAddCustomer(c.id)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{c.name}</span>
                                                            <span className="text-xs opacity-50">{c.phone}</span>
                                                        </div>
                                                        {selectedCustomerIds.includes(c.id) && <Check className="h-4 w-4" />}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-6 text-center text-sm text-slate-500 italic">
                                                    {config.labels.customer} bulunamadı
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t pt-2">
                                            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium h-9">
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        Yeni {config.labels.customer} Ekle
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Yeni {config.labels.customer} Kaydı</DialogTitle>
                                                    </DialogHeader>
                                                    <CustomerForm
                                                        industryType={(organization?.industry_type as any) || "general"}
                                                        onSuccess={() => {
                                                            loadCustomers()
                                                            setIsCustomerDialogOpen(false)
                                                        }}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Selected Customers Display (Especially for Group Classes) */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedCustomerIds.map((id: string) => {
                                    const customer = customers.find(c => c.id === id)
                                    return (
                                        <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100">
                                            {customer?.name || "Bilinmeyen"}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 hover:bg-transparent text-blue-400 hover:text-red-500 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRemoveCustomer(id)
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    )
                                })}
                            </div>
                        </FormItem>
                    )}
                </div>

                {/* Always show customer selection if instructor selection replaced its sibling above */}
                {['owner', 'admin'].includes((organization as any)?.role || 'owner') && (
                    <div className="grid grid-cols-1 gap-6">
                        <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">{config.labels.customer} Seçimi</FormLabel>
                            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
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
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <div className="flex flex-col p-2 space-y-2">
                                        <div className="flex items-center border rounded-md px-3 bg-slate-50">
                                            <Search className="h-4 w-4 mr-2 opacity-50" />
                                            <Input
                                                placeholder="İsim veya telefon..."
                                                className="border-0 focus-visible:ring-0 bg-transparent h-9 p-0"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((c) => (
                                                    <div
                                                        key={c.id}
                                                        className={cn(
                                                            "flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-slate-100 text-sm",
                                                            selectedCustomerIds.includes(c.id) && "bg-blue-50 text-blue-700 font-medium"
                                                        )}
                                                        onClick={() => handleAddCustomer(c.id)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{c.name}</span>
                                                            <span className="text-xs opacity-50">{c.phone}</span>
                                                        </div>
                                                        {selectedCustomerIds.includes(c.id) && <Check className="h-4 w-4" />}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-6 text-center text-sm text-slate-500 italic">
                                                    {config.labels.customer} bulunamadı
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t pt-2">
                                            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium h-9">
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        Yeni {config.labels.customer} Ekle
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Yeni {config.labels.customer} Kaydı</DialogTitle>
                                                    </DialogHeader>
                                                    <CustomerForm
                                                        industryType={(organization?.industry_type as any) || "general"}
                                                        onSuccess={() => {
                                                            loadCustomers()
                                                            setIsCustomerDialogOpen(false)
                                                        }}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedCustomerIds.map((id: string) => {
                                    const customer = customers.find(c => c.id === id)
                                    return (
                                        <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100">
                                            {customer?.name || "Bilinmeyen"}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 hover:bg-transparent text-blue-400 hover:text-red-500 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRemoveCustomer(id)
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    )
                                })}
                            </div>
                        </FormItem>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="appointment_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="mb-2">Tarih</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-bold h-12 rounded-input border-[1.5px] border-border-brand bg-white text-navy hover:bg-bg transition-all shadow-sm",
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
                                            disabled={(date) => {
                                                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                                                if (isPast) return true

                                                // 0. Check Organization-wide Working Hours
                                                if ((organization as any)?.settings?.working_hours) {
                                                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                                                    const dayName = dayNames[date.getDay()]
                                                    const orgDayConfig = (organization as any).settings.working_hours[dayName]
                                                    if (orgDayConfig && orgDayConfig.isOpen === false) return true
                                                }

                                                if (currentInstructorId) {
                                                    // 1. Check Time Offs (hard overrides working hours)
                                                    if (timeOffs.length > 0) {
                                                        const dateWithoutTime = new Date(date).setHours(0, 0, 0, 0);
                                                        const hasTimeOff = timeOffs.some(t => {
                                                            const s = new Date(t.start_date).setHours(0, 0, 0, 0);
                                                            const e = new Date(t.end_date).setHours(23, 59, 59, 999);
                                                            return dateWithoutTime >= s && dateWithoutTime <= e;
                                                        });
                                                        if (hasTimeOff) return true;
                                                    }

                                                    // 2. Check Weekly Schedule
                                                    if (schedules.length > 0) {
                                                        const daySchedule = schedules.find(s => s.day_of_week === date.getDay())
                                                        if (daySchedule && !daySchedule.is_working_day) return true
                                                    }
                                                }
                                                return false
                                            }}
                                            locale={tr}
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
                                <FormLabel className="mb-2">Saat</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-medium text-navy hover:bg-bg transition-all shadow-sm">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableTimes.length > 0 ? (
                                            availableTimes.map(time => (
                                                <SelectItem key={time} value={time}>
                                                    {time}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                Müsait Saat Yok
                                            </SelectItem>
                                        )}
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
                                <FormLabel className="mb-2">Süre (Dk)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-medium text-navy hover:bg-bg transition-all shadow-sm">
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
                                    <FormLabel className="mb-2">Kontenjan</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" {...field} className="h-12 rounded-input border-[1.5px] border-border-brand bg-white font-medium text-navy shadow-sm focus:border-electric focus:ring-4 focus:ring-electric/5 transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Recurring Options */}
                {config.features.recurring && (
                    <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                        <FormField
                            control={form.control}
                            name="is_recurring"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Tekrarlı {config.labels.appointment}</FormLabel>
                                        <FormDescription>
                                            Bu {config.labels.appointment.toLowerCase()}i sonraki haftalara da kopyala
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
                                        <FormDescription>Örn: 4 yazarsanız, bu {(config.labels.appointment || "randevu").toLowerCase()} ve sonraki 3 hafta (toplam 4 {(config.labels.appointment || "randevu").toLowerCase()}) oluşturulur.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-electric text-white rounded-btn font-extrabold text-sm shadow-cta hover:bg-navy transition-all h-12 uppercase tracking-wide"
                    disabled={loading}
                    style={{ fontWeight: 800 }}
                >
                    {loading ? "Planlanıyor..." : `${config.labels.appointment} Oluştur`}
                </Button>
            </form>
        </Form >
    )
}
