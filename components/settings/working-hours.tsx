"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { updateConfiguration } from "@/app/settings/actions"
import { toast } from "sonner"
import { Loader2, Clock, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WorkingHoursProps {
    settings: any
}

const DAYS = [
    { key: "monday", label: "Pazartesi" },
    { key: "tuesday", label: "Salı" },
    { key: "wednesday", label: "Çarşamba" },
    { key: "thursday", label: "Perşembe" },
    { key: "friday", label: "Cuma" },
    { key: "saturday", label: "Cumartesi" },
    { key: "sunday", label: "Pazar" },
]

const generateTimeOptions = () => {
    const times = []
    for (let h = 0; h <= 23; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0')
            const minute = m.toString().padStart(2, '0')
            times.push(`${hour}:${minute}`)
        }
    }
    return times
}

const TIME_OPTIONS = generateTimeOptions()

export function WorkingHours({ settings }: WorkingHoursProps) {
    const [loading, setLoading] = useState(false)

    // Initialize with fallbacks
    const [schedule, setSchedule] = useState<any>(() => {
        const base = DAYS.reduce((acc: any, day) => {
            acc[day.key] = { isOpen: true, open: "09:00", close: "18:00" }
            return acc
        }, {})

        return {
            ...base,
            ...(settings?.working_hours || {})
        }
    })

    const handleToggle = (day: string, isOpen: boolean) => {
        setSchedule((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], isOpen }
        }))
    }

    const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
        setSchedule((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], [type]: value }
        }))
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            const result = await updateConfiguration({
                ...(settings || {}),
                working_hours: schedule
            })

            if (result.success) {
                toast.success("Çalışma saatleri başarıyla kaydedildi")
            } else {
                toast.error("Hata", { description: result.error })
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b p-4 px-6">
                <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    İşletme Çalışma Saatleri (Genel)
                </CardTitle>
                <CardDescription>
                    Tüm salonun genel çalışma saatlerini belirleyin. Kapalı olan günlerde kesinlikle randevu alınamaz.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                    {DAYS.map((day) => {
                        const dayConfig = schedule[day.key]
                        return (
                            <div key={day.key} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex flex-col gap-0.5">
                                    <Label className={dayConfig.isOpen ? "text-slate-900 font-bold text-base" : "text-slate-400 font-medium text-base"}>
                                        {day.label}
                                    </Label>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter">
                                        {dayConfig.isOpen ? "İŞLETME AÇIK" : "İŞLETME KAPALI"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className={dayConfig.isOpen ? "flex items-center gap-2" : "hidden"}>
                                        <Select
                                            value={dayConfig.open}
                                            onValueChange={(val) => handleTimeChange(day.key, 'open', val)}
                                        >
                                            <SelectTrigger className="w-28 bg-white h-9 shadow-sm border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white z-50">
                                                {TIME_OPTIONS.map(time => (
                                                    <SelectItem key={`open-${day.key}-${time}`} value={time}>{time}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-slate-300 font-bold px-1">—</span>
                                        <Select
                                            value={dayConfig.close}
                                            onValueChange={(val) => handleTimeChange(day.key, 'close', val)}
                                        >
                                            <SelectTrigger className="w-28 bg-white h-9 shadow-sm border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white z-50">
                                                {TIME_OPTIONS.map(time => (
                                                    <SelectItem key={`close-${day.key}-${time}`} value={time}>{time}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {!dayConfig.isOpen && (
                                        <div className="flex-1 text-right">
                                            <span className="text-rose-600 italic text-xs font-black bg-rose-50 border border-rose-100 px-6 py-2 rounded-full uppercase tracking-widest shadow-sm">
                                                KAPALI
                                            </span>
                                        </div>
                                    )}

                                    <div className="border-l pl-8 h-8 flex items-center">
                                        <Switch
                                            checked={dayConfig.isOpen}
                                            onCheckedChange={(checked) => handleToggle(day.key, checked)}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="p-6 bg-slate-50 border-t flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-10 shadow-lg shadow-blue-200 transition-all rounded-lg"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
