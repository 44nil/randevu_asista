'use client'

import { useState } from "react";
import { createOrganization } from "./actions";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={pending}>
            {pending ? "Oluşturuluyor..." : "İşletmemi Oluştur"}
        </Button>
    );
}

export default function OnboardingPage() {
    const [state, setState] = useState<{ error?: string } | null>(null);

    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        try {
            const result = await createOrganization(null, formData);
            if (result?.error) {
                toast.error(result.error);
                setState({ error: result.error });
            } else if (result?.success) {
                toast.success("İşletme başarıyla oluşturuldu!");
                router.push("/");
            }
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
                <div className="bg-zinc-900 p-8 text-center">
                    <div className="mx-auto h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 mb-4">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Hoş Geldiniz! 🎉</h1>
                    <p className="text-zinc-400">
                        Randevu Asista'yı kullanmaya başlamak için işletmenizi oluşturalım.
                    </p>
                </div>

                <div className="p-8">
                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="businessName">İşletme Adı</Label>
                            <Input
                                id="businessName"
                                name="businessName"
                                placeholder="Örn: Elif Pilates Stüdyosu"
                                required
                                className="bg-zinc-50 border-zinc-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industryType">Sektör</Label>
                            <Select name="industryType" required>
                                <SelectTrigger className="bg-zinc-50 border-zinc-200">
                                    <SelectValue placeholder="Sektör seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pilates">Pilates Stüdyosu</SelectItem>
                                    <SelectItem value="yoga">Yoga Stüdyosu</SelectItem>
                                    <SelectItem value="pt">Personal Training (PT)</SelectItem>
                                    <SelectItem value="physio">Fizyoterapi Merkezi</SelectItem>
                                    <SelectItem value="dietitian">Diyetisyen</SelectItem>
                                    <SelectItem value="psychologist">Psikolog</SelectItem>
                                    <SelectItem value="beauty">Güzellik Merkezi</SelectItem>
                                    <SelectItem value="hair">Kuaför / Saç Tasarım</SelectItem>
                                    <SelectItem value="other">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">İletişim Numarası (Opsiyonel)</Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="0555 555 55 55"
                                className="bg-zinc-50 border-zinc-200"
                            />
                        </div>

                        {state?.error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                {state.error}
                            </div>
                        )}

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
