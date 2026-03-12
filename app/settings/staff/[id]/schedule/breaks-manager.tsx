"use client";

import { useState } from "react";
import { BreakEditor } from "./break-editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateStaffSchedule } from "@/app/actions";
import { Loader2, Save } from "lucide-react";

interface Break {
    start: string;
    end: string;
    name: string;
}

interface Schedule {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_working_day: boolean;
    breaks?: Break[];
}

interface BreaksManagerProps {
    staffId: string;
    initialSchedules: Schedule[];
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

export function BreaksManager({ staffId, initialSchedules }: BreaksManagerProps) {
    const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
    const [isSaving, setIsSaving] = useState(false);

    const updateBreaksForDay = (dayOfWeek: number, breaks: Break[]) => {
        setSchedules(prev => prev.map(schedule => 
            schedule.day_of_week === dayOfWeek 
                ? { ...schedule, breaks }
                : schedule
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateStaffSchedule(staffId, schedules);
            if (res.success) {
                toast.success("Molalar başarıyla kaydedildi.");
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
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-navy">Günlük Molalar</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Her gün için öğle arası, kahve molası gibi tekrarlayan molaları tanımlayın.
                    </p>
                </div>
                
                <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand hover:bg-brand/90 text-white"
                >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Molaları Kaydet
                </Button>
            </div>

            <div className="space-y-6">
                {DAYS.map(day => {
                    const schedule = schedules.find(s => s.day_of_week === day.id);
                    if (!schedule?.is_working_day) return null; // Don't show breaks for non-working days
                    
                    return (
                        <div key={day.id} className="bg-slate-50 rounded-[16px] p-6 border border-slate-100">
                            <BreakEditor
                                staffId={staffId}
                                dayOfWeek={day.id}
                                dayName={day.name}
                                initialBreaks={schedule.breaks || []}
                                onBreaksUpdate={updateBreaksForDay}
                            />
                        </div>
                    );
                })}
            </div>

            {DAYS.filter(day => {
                const schedule = schedules.find(s => s.day_of_week === day.id);
                return schedule?.is_working_day;
            }).length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <p>Çalışma günü tanımlanmamış</p>
                    <p className="text-sm">Önce çalışma saatlerini ayarlayın</p>
                </div>
            )}
        </div>
    );
}