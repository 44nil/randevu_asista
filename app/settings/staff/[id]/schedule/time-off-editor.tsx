"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertCircle, Plus, Loader2 } from "lucide-react";
import { createStaffTimeOff, deleteStaffTimeOff } from "@/app/actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TimeOff {
    id: string;
    start_date: string;
    end_date: string;
    reason: string;
}

export function TimeOffEditor({ staffId, initialTimeOffs }: { staffId: string, initialTimeOffs: TimeOff[] }) {
    const [timeOffs, setTimeOffs] = useState<TimeOff[]>(initialTimeOffs);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!startDate || !endDate) {
            toast.error("Lütfen başlangıç ve bitiş tarihlerini seçiniz.");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error("Bitiş tarihi başlangıç tarihinden önce olamaz.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await createStaffTimeOff(staffId, {
                start_date: startDate,
                end_date: endDate,
                reason: reason || "Belirtilmedi",
            });

            if (res.success) {
                toast.success("İzin / kapalı gün eklendi.");
                // Optimistically reload or reset form. Since we don't have the new ID, a real app might refetch.
                // For layout simplicity, we'll prompt a reload to sync from DB
                window.location.reload();
            } else {
                toast.error("Hata: " + res.error);
            }
        } catch (err) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu izni silmek istediğinizden emin misiniz?")) return;

        setIsDeleting(id);
        try {
            const res = await deleteStaffTimeOff(id);
            if (res.success) {
                toast.success("İzin silindi.");
                setTimeOffs(prev => prev.filter(t => t.id !== id));
            } else {
                toast.error("Hata: " + res.error);
            }
        } catch (err) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 border rounded-lg p-5">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    Yeni İzin Ekle
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Başlangıç Tarihi</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Bitiş Tarihi</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Açıklama (Opsiyonel)</label>
                        <Input
                            placeholder="Tatil, sağlık izni vb."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleAdd} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 h-9">
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        İzni Ekle
                    </Button>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    Kayıtlı İzinler & Kapalı Günler
                </h4>

                {timeOffs.length === 0 ? (
                    <div className="text-center p-8 text-sm text-slate-500 border border-dashed rounded-lg bg-slate-50/50">
                        Şu anda kayıtlı bir izin bulunmuyor.
                    </div>
                ) : (
                    <div className="border rounded-lg divide-y bg-white">
                        {timeOffs.map(t => (
                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div>
                                    <div className="font-medium text-slate-900 text-sm">
                                        {format(new Date(t.start_date), "dd MMMM yyyy", { locale: tr })} - {format(new Date(t.end_date), "dd MMMM yyyy", { locale: tr })}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">{t.reason}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8"
                                    onClick={() => handleDelete(t.id)}
                                    disabled={isDeleting === t.id}
                                >
                                    {isDeleting === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
