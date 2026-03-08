"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateStaffSchedule } from "@/app/actions";
import { Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Schedule {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_working_day: boolean;
}

const DAYS = [
    { id: 1, name: "Pazartesi" },
    { id: 2, name: "Salı" },
    { id: 3, name: "Çarşamba" },
    { id: 4, name: "Perşembe" },
    { id: 5, name: "Cuma" },
    { id: 6, name: "Cumartesi" },
    { id: 0, name: "Pazar" },
];

const generateTimeOptions = () => {
    const times = [];
    for (let h = 6; h <= 23; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            times.push(`${hour}:${minute}`);
        }
    }
    return times;
};

const TIME_OPTIONS = generateTimeOptions();

export function ScheduleEditor({ staffId, initialSchedules }: { staffId: string, initialSchedules: Schedule[] }) {
    const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
    const [isSaving, setIsSaving] = useState(false);

    const updateDay = (day_of_week: number, updates: Partial<Schedule>) => {
        setSchedules(prev => prev.map(s => s.day_of_week === day_of_week ? { ...s, ...updates } : s));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateStaffSchedule(staffId, schedules);
            if (res.success) {
                toast.success("Çalışma saatleri başarıyla kaydedildi.");
            } else {
                toast.error("Hata: " + res.error);
            }
        } catch (err: any) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[140px_1fr_1fr] items-center gap-4 p-4 text-sm font-semibold text-slate-500 bg-slate-100 border-b">
                    <div>Gün</div>
                    <div>Mesai Başlangıç</div>
                    <div>Mesai Bitiş</div>
                </div>

                <div className="divide-y">
                    {DAYS.map(day => {
                        const schedule = schedules.find(s => s.day_of_week === day.id)!;
                        return (
                            <div key={day.id} className="grid grid-cols-[140px_1fr_1fr] items-center gap-6 p-4 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={schedule.is_working_day}
                                        onCheckedChange={(checked) => updateDay(day.id, { is_working_day: checked })}
                                    />
                                    <Label className={schedule.is_working_day ? "text-slate-900 font-medium" : "text-slate-400"}>
                                        {day.name}
                                    </Label>
                                </div>

                                <div className={schedule.is_working_day ? "opacity-100" : "opacity-30 pointer-events-none"}>
                                    <Select
                                        value={schedule.start_time}
                                        onValueChange={(val) => updateDay(day.id, { start_time: val })}
                                    >
                                        <SelectTrigger className="w-[120px] bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white z-50">
                                            {TIME_OPTIONS.map(time => (
                                                <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className={schedule.is_working_day ? "opacity-100" : "opacity-30 pointer-events-none"}>
                                    <Select
                                        value={schedule.end_time}
                                        onValueChange={(val) => updateDay(day.id, { end_time: val })}
                                    >
                                        <SelectTrigger className="w-[120px] bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white z-50">
                                            {TIME_OPTIONS.map(time => (
                                                <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    );
}
