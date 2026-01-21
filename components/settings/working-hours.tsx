"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateConfiguration } from "@/app/settings/actions"
import { toast } from "sonner"
import { Loader2, Clock } from "lucide-react"

interface WorkingHoursProps {
    settings: any // assuming { working_hours: { [day: string]: { open: string, close: string, isOpen: boolean } } }
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

export function WorkingHours({ settings }: WorkingHoursProps) {
    const [loading, setLoading] = useState(false)
    // Initialize with defaults if empty
    const [schedule, setSchedule] = useState<any>(settings?.working_hours || DAYS.reduce((acc: any, day) => {
        acc[day.key] = { isOpen: true, open: "09:00", close: "18:00" }
        return acc
    }, {}))

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
                ...settings,
                working_hours: schedule
            })

            if (result.success) {
                toast.success("Çalışma saatleri güncellendi")
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Çalışma Saatleri
                </CardTitle>
                <CardDescription>
                    Salonunuzun açık olduğu gün ve saatleri belirleyin. Randevu takvimi bu saatlere göre düzenlenir.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {DAYS.map((day) => {
                        const dayConfig = schedule[day.key] || { isOpen: true, open: "09:00", close: "18:00" }
                        return (
                            <div key={day.key} className="flex items-center justify-between pb-2 border-b last:border-0">
                                <div className="flex items-center space-x-4 w-40">
                                    <Switch
                                        checked={dayConfig.isOpen}
                                        onCheckedChange={(checked) => handleToggle(day.key, checked)}
                                    />
                                    <Label className={dayConfig.isOpen ? "text-slate-900" : "text-slate-400"}>
                                        {day.label}
                                    </Label>
                                </div>

                                {dayConfig.isOpen ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            className="w-32"
                                            value={dayConfig.open}
                                            onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                                        />
                                        <span className="text-slate-400">-</span>
                                        <Input
                                            type="time"
                                            className="w-32"
                                            value={dayConfig.close}
                                            onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 text-center text-sm text-slate-400 italic">
                                        Kapalı
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
