"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, Clock, Coffee } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Break {
    start: string; // "12:00:00"
    end: string;   // "13:00:00"
    name: string;  // "Lunch Break"
}

interface BreakEditorProps {
    staffId: string;
    dayOfWeek: number; // 0=Sunday, 1=Monday...
    dayName: string;   // "Pazartesi"
    initialBreaks: Break[];
    onBreaksUpdate: (dayOfWeek: number, breaks: Break[]) => void;
}

const generateTimeOptions = () => {
    const times = [];
    for (let h = 6; h <= 23; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            times.push(`${hour}:${minute}:00`);
        }
    }
    return times;
};

const TIME_OPTIONS = generateTimeOptions();

const DEFAULT_BREAK_TEMPLATES = [
    { name: "Öğle Arası", start: "12:00:00", end: "13:00:00" },
    { name: "Kahve Molası", start: "15:00:00", end: "15:15:00" },
    { name: "Kısa Mola", start: "10:30:00", end: "10:45:00" },
];

export function BreakEditor({ staffId, dayOfWeek, dayName, initialBreaks, onBreaksUpdate }: BreakEditorProps) {
    const [breaks, setBreaks] = useState<Break[]>(initialBreaks || []);

    const addBreak = (template?: Break) => {
        const newBreak = template || { 
            name: "Yeni Mola", 
            start: "12:00:00", 
            end: "12:30:00" 
        };
        
        const updatedBreaks = [...breaks, newBreak];
        setBreaks(updatedBreaks);
        onBreaksUpdate(dayOfWeek, updatedBreaks);
    };

    const updateBreak = (index: number, field: keyof Break, value: string) => {
        const updatedBreaks = breaks.map((breakItem, i) => 
            i === index ? { ...breakItem, [field]: value } : breakItem
        );
        setBreaks(updatedBreaks);
        onBreaksUpdate(dayOfWeek, updatedBreaks);
    };

    const removeBreak = (index: number) => {
        const updatedBreaks = breaks.filter((_, i) => i !== index);
        setBreaks(updatedBreaks);
        onBreaksUpdate(dayOfWeek, updatedBreaks);
    };

    const validateBreakTime = (breakItem: Break, index: number) => {
        if (breakItem.start >= breakItem.end) {
            return "Başlangıç saati bitiş saatinden önce olmalı";
        }
        
        // Check for overlapping breaks
        for (let i = 0; i < breaks.length; i++) {
            if (i === index) continue;
            const other = breaks[i];
            if (
                (breakItem.start < other.end && breakItem.end > other.start)
            ) {
                return "Mola saatleri çakışıyor";
            }
        }
        
        return null;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-electric" />
                    <span className="text-sm font-bold text-navy">{dayName} Molaları</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Quick add templates */}
                    {DEFAULT_BREAK_TEMPLATES.map((template, i) => (
                        <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => addBreak(template)}
                            className="h-8 px-2 text-xs hover:bg-electric/10 hover:border-electric"
                        >
                            {template.name}
                        </Button>
                    ))}
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addBreak()}
                        className="h-8 px-2 hover:bg-brand/10 hover:border-brand"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Özel
                    </Button>
                </div>
            </div>

            {breaks.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Bu gün için mola tanımlanmamış</p>
                    <p className="text-xs">Yukarıdaki butonları kullanarak mola ekleyebilirsin</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {breaks.map((breakItem, index) => {
                        const error = validateBreakTime(breakItem, index);
                        
                        return (
                            <div 
                                key={index}
                                className={cn(
                                    "bg-white border rounded-[12px] p-4 shadow-sm transition-all",
                                    error ? "border-red-200 bg-red-50/30" : "border-slate-100 hover:border-electric/30"
                                )}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Mola adı (örn: Öğle Arası)"
                                            value={breakItem.name}
                                            onChange={(e) => updateBreak(index, 'name', e.target.value)}
                                            className="border-none bg-transparent font-medium text-navy placeholder:text-slate-400 focus:ring-0 px-0"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={breakItem.start}
                                            onValueChange={(val) => updateBreak(index, 'start', val)}
                                        >
                                            <SelectTrigger className="w-[90px] h-8 bg-bg border-none font-mono text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_OPTIONS.map(time => (
                                                    <SelectItem key={time} value={time}>
                                                        {time.slice(0, 5)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <span className="text-slate-400">-</span>

                                        <Select
                                            value={breakItem.end}
                                            onValueChange={(val) => updateBreak(index, 'end', val)}
                                        >
                                            <SelectTrigger className="w-[90px] h-8 bg-bg border-none font-mono text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_OPTIONS.map(time => (
                                                    <SelectItem key={time} value={time}>
                                                        {time.slice(0, 5)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeBreak(index)}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                        <span>⚠️</span>
                                        {error}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}