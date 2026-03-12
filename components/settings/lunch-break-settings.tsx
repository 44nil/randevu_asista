"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Coffee } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrganizationLunchBreak } from "@/app/settings/lunch-actions";

interface LunchBreakSettingsProps {
    orgId: string;
    initialSettings: {
        lunch_break_enabled: boolean;
        lunch_break_start: string;
        lunch_break_end: string;
    };
}

const generateTimeOptions = () => {
    const times = [];
    for (let h = 8; h <= 17; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            times.push(`${hour}:${minute}:00`);
        }
    }
    return times;
};

const TIME_OPTIONS = generateTimeOptions();

export function LunchBreakSettings({ orgId, initialSettings }: LunchBreakSettingsProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isSaving, setIsSaving] = useState(false);

    if (!orgId) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="text-red-600">Organization ID bulunamadı. Lütfen sayfayı yenileyin.</p>
            </div>
        );
    }

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateOrganizationLunchBreak(orgId, settings);
            if (res.success) {
                toast.success("Öğle arası ayarları başarıyla kaydedildi.");
            } else {
                toast.error("Hata: " + res.error);
            }
        } catch (err: any) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (timeStr: string) => {
        return timeStr.slice(0, 5); // "12:00:00" -> "12:00"
    };

    const isValidTimeRange = settings.lunch_break_start < settings.lunch_break_end;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 h-10 w-10 flex items-center justify-center rounded-lg">
                        <Coffee className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-navy">Öğle Arası Ayarları</h3>
                        <p className="text-sm text-slate-500">Tüm personel için geçerli öğle arası saatleri</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Enable/Disable Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                        <Label className="text-sm font-bold text-navy">Öğle Arası Aktif</Label>
                        <p className="text-xs text-slate-500 mt-1">
                            Tüm personel için öğle arası molası etkinleştirilsin mi?
                        </p>
                    </div>
                    <Switch 
                        checked={settings.lunch_break_enabled}
                        onCheckedChange={(checked) => updateSetting('lunch_break_enabled', checked)}
                    />
                </div>

                {/* Time Range Settings */}
                {settings.lunch_break_enabled && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Start Time */}
                            <div>
                                <Label className="text-sm font-bold text-navy mb-2 block">
                                    Başlangıç Saati
                                </Label>
                                <Select 
                                    value={settings.lunch_break_start}
                                    onValueChange={(val) => updateSetting('lunch_break_start', val)}
                                >
                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_OPTIONS.filter(t => t <= '14:00:00').map(time => (
                                            <SelectItem key={time} value={time}>
                                                {formatTime(time)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* End Time */}
                            <div>
                                <Label className="text-sm font-bold text-navy mb-2 block">
                                    Bitiş Saati
                                </Label>
                                <Select 
                                    value={settings.lunch_break_end}
                                    onValueChange={(val) => updateSetting('lunch_break_end', val)}
                                >
                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_OPTIONS.filter(t => t >= settings.lunch_break_start && t >= '11:30:00').map(time => (
                                            <SelectItem key={time} value={time}>
                                                {formatTime(time)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Validation & Preview */}
                        {!isValidTimeRange && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-700 text-sm font-medium">
                                    ⚠️ Bitiş saati başlangıç saatinden sonra olmalı
                                </p>
                            </div>
                        )}

                        {isValidTimeRange && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-green-700 text-sm font-medium">
                                    ✅ Öğle arası: {formatTime(settings.lunch_break_start)} - {formatTime(settings.lunch_break_end)}
                                    <span className="ml-2 text-green-600">
                                        ({Math.round((new Date(`2000-01-01T${settings.lunch_break_end}`).getTime() - 
                                                     new Date(`2000-01-01T${settings.lunch_break_start}`).getTime()) / (1000 * 60))} dakika)
                                    </span>
                                </p>
                                <p className="text-green-600 text-xs mt-1">
                                    Bu saat aralığında randevu alınamaz, tüm personel için geçerlidir.
                                </p>
                                
                                {/* Working Save Button */}
                                <Button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium shadow-sm"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Değişiklikleri Kaydet
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}