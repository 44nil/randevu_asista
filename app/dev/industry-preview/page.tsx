"use client"

/**
 * DEV ONLY — Industry Config Preview
 * DB'ye dokunmaz, auth gerektirmez.
 * Sadece process.env.NODE_ENV === 'development' ortamında çalışır.
 * URL: http://localhost:3000/dev/industry-preview
 */

import { redirect } from "next/navigation"
import { getIndustryConfig } from "@/lib/config/industries"

const ALL_INDUSTRIES = [
    { key: 'pilates',      label: '🧘 Pilates' },
    { key: 'yoga',         label: '🌿 Yoga' },
    { key: 'pt',           label: '🏋️ PT / Antrenör' },
    { key: 'physio',       label: '🩺 Fizyoterapi' },
    { key: 'dietitian',    label: '🥗 Diyetisyen' },
    { key: 'psychologist', label: '🧠 Psikolog' },
    { key: 'hair',         label: '✂️ Kuaför' },
    { key: 'beauty',       label: '💅 Güzellik Salonu' },
    { key: 'dental',       label: '🦷 Diş Kliniği' },
    { key: 'general',      label: '📋 Genel' },
]

function LabelRow({ name, value }: { name: string; value: string }) {
    return (
        <div className="flex justify-between text-sm py-0.5 border-b border-slate-100">
            <span className="text-slate-400 font-medium w-36 shrink-0">{name}</span>
            <span className="font-bold text-slate-800">{value}</span>
        </div>
    )
}

export default function IndustryPreviewPage() {
    if (process.env.NODE_ENV !== 'development') {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-slate-900">🔍 Industry Config Preview</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Tüm sektörlerin config çıktısı — DB/auth yok. Sadece dev ortamında görünür.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {ALL_INDUSTRIES.map(({ key, label }) => {
                        const config = getIndustryConfig(key)
                        // DB'de hangi config'e düştüğünü hesapla
                        const ALIAS: Record<string, string> = {
                            pilates: 'pilates', yoga: 'pilates', pt: 'pilates',
                            dental: 'dental', physio: 'dental', dietitian: 'dental', psychologist: 'dental',
                            hair: 'hair', beauty: 'hair', general: 'general', other: 'general',
                        }
                        const mappedTo = ALIAS[key] || 'general'
                        const isSameKey = mappedTo === key

                        return (
                            <div key={key} className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <h2 className="font-black text-slate-900 text-base">{label}</h2>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSameKey
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                        {isSameKey ? `✓ ${mappedTo}` : `→ ${mappedTo}`}
                                    </span>
                                </div>

                                {/* Labels */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Etiketler</p>
                                    <LabelRow name="appointment" value={config.labels.appointment} />
                                    <LabelRow name="createAppointment" value={config.labels.createAppointment} />
                                    <LabelRow name="customer" value={config.labels.customer} />
                                    <LabelRow name="createCustomer" value={config.labels.createCustomer} />
                                    <LabelRow name="instructor" value={config.labels.instructor} />
                                    <LabelRow name="package" value={config.labels.package} />
                                    <LabelRow name="session" value={config.labels.session} />
                                    <LabelRow name="program" value={config.labels.program} />
                                </div>

                                {/* Appointment Types */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Randevu Tipleri ({config.appointmentTypes.length})
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {config.appointmentTypes.map(t => (
                                            <span key={t.value} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                {t.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Package Types (first 4) */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Paket Tipleri (ilk 4 / {config.packageTypes.length})
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {config.packageTypes.slice(0, 4).map(t => (
                                            <span key={t.value} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                                {t.label}
                                            </span>
                                        ))}
                                        {config.packageTypes.length > 4 && (
                                            <span className="text-xs text-slate-400 font-medium">+{config.packageTypes.length - 4} daha</span>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Özellikler</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(config.features).map(([feat, enabled]) => (
                                            <span key={feat} className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${enabled
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-slate-100 text-slate-400 line-through'
                                                }`}>
                                                {feat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
