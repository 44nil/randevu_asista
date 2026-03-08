"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateStaffSchedule } from "@/app/actions";
import { Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
            <div className="bg-white border-none rounded-[20px] shadow-brand overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {DAYS.map(day => {
                        const schedule = schedules.find(s => s.day_of_week === day.id)!;
                        return (
                            <div key={day.id} className="flex items-center justify-between p-7 hover:bg-slate-50/30 transition-all group">
                                <div className="flex flex-col gap-1.5">
                                    <span className={cn(
                                        "text-sm font-black tracking-tight transition-colors",
                                        schedule.is_working_day ? "text-navy" : "text-slate-400"
                                    )}>
                                        {day.name}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] font-black tracking-widest leading-none transition-colors",
                                        schedule.is_working_day ? "text-electric" : "text-slate-300"
                                    )}>
                                        {schedule.is_working_day ? 'İŞLETME AÇIK' : 'İŞLETME KAPALI'}
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    <div className={cn(
                                        "flex items-center gap-4 transition-all duration-300",
                                        !schedule.is_working_day && "opacity-20 pointer-events-none grayscale"
                                    )}>
                                        <Select
                                            value={schedule.start_time}
                                            onValueChange={(val) => updateDay(day.id, { start_time: val })}
                                        >
                                            <SelectTrigger className="w-[110px] h-11 bg-bg border-none font-bold text-navy rounded-[12px] shadow-none hover:bg-surface focus:ring-0 transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-border-brand/30 shadow-elevated z-50">
                                                {TIME_OPTIONS.map(time => (
                                                    <SelectItem key={`start-${time}`} value={time} className="font-medium">{time}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="w-4 h-px bg-slate-200" />

                                        <Select
                                            value={schedule.end_time}
                                            onValueChange={(val) => updateDay(day.id, { end_time: val })}
                                        >
                                            <SelectTrigger className="w-[110px] h-11 bg-bg border-none font-bold text-navy rounded-[12px] shadow-none hover:bg-surface focus:ring-0 transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-border-brand/30 shadow-elevated z-50">
                                                {TIME_OPTIONS.map(time => (
                                                    <SelectItem key={`end-${time}`} value={time} className="font-medium">{time}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="h-10 w-px bg-slate-100 mx-8 hidden md:block" />

                                    <Switch
                                        checked={schedule.is_working_day}
                                        onCheckedChange={(checked) => updateDay(day.id, { is_working_day: checked })}
                                        className="data-[state=checked]:bg-electric"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="h-12 px-8 bg-navy text-white rounded-btn font-black text-sm shadow-cta hover:bg-electric transition-all gap-2 uppercase tracking-widest">
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    );
}
