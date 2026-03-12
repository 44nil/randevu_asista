"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { format, differenceInDays, isPast, isFuture } from "date-fns"
import { tr } from "date-fns/locale"
import {
    Phone, Mail, Calendar, ArrowLeft, Package, Clock, CheckCircle,
    XCircle, TrendingUp, Activity, ChevronDown,
    AlertCircle, PackagePlus, Plus, Trash2, Loader2, Check, Pencil
} from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"
import { PackageSaleDialog } from "@/components/packages/package-sale-dialog"
import { MeasurementsList } from "@/components/customers/measurements-list"
import { upsertTreatmentPlanItem, deleteTreatmentPlanItem } from "@/app/customer-actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CustomerDetailClientProps {
    role?: string
    data: {
        customer: any
        packages: any[]
        appointments: any[]
        measurements: any[]
        stats: {
            totalSessions: number
            thisMonth: number
            upcoming: number
            memberSince: string
        }
    }
}

const statusColor: Record<string, string> = {
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-blue-50 text-blue-700',
    cancelled: 'bg-red-50 text-red-500',
    pending: 'bg-yellow-50 text-yellow-700',
}
const statusLabel: Record<string, string> = {
    confirmed: 'Onaylı',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    pending: 'Bekliyor',
}

const planStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    planned:     { label: 'Planlandı',   color: '#F59E0B', bg: '#FEF3C7' },
    in_progress: { label: 'Devam Ediyor', color: '#2E66F1', bg: '#EFF6FF' },
    completed:   { label: 'Tamamlandı',  color: '#10B981', bg: '#D1FAE5' },
    cancelled:   { label: 'İptal',       color: '#EF4444', bg: '#FEE2E2' },
}

export function CustomerDetailClient({ role, data }: CustomerDetailClientProps) {
    const { config, organization } = useOrganization()
    const router = useRouter()
    const { customer, packages, appointments, measurements, stats } = data

    const isDental = organization?.industry_type === 'dental' ||
        organization?.settings?.real_industry === 'dental'

    const [packageOpen, setPackageOpen] = useState(false)
    const [treatmentPlans, setTreatmentPlans] = useState<any[]>(
        customer?.metadata?.treatment_plans || []
    )
    const [showAddPlan, setShowAddPlan] = useState(false)
    const [planForm, setPlanForm] = useState({ title: '', tooth: '', status: 'planned', notes: '' })
    const [planLoading, setPlanLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const activePackage = packages.find(p => p.status === 'active')
    const memberDays = differenceInDays(new Date(), new Date(stats.memberSince))

    const upcomingApts = appointments.filter(a =>
        isFuture(new Date(a.start_time)) && a.status !== 'cancelled'
    )
    const pastApts = appointments.filter(a =>
        isPast(new Date(a.start_time)) || a.status === 'cancelled'
    )

    const handleAddPlan = async () => {
        if (!planForm.title.trim()) return
        setPlanLoading(true)
        const res = await upsertTreatmentPlanItem(customer.id, {
            title: planForm.title,
            tooth: planForm.tooth || undefined,
            status: planForm.status as any,
            notes: planForm.notes || undefined,
        })
        setPlanLoading(false)
        if (res.success) {
            toast.success("Tedavi planı eklendi")
            // optimistic update
            setTreatmentPlans(prev => [...prev, {
                ...planForm, id: Date.now().toString(), created_at: new Date().toISOString()
            }])
            setPlanForm({ title: '', tooth: '', status: 'planned', notes: '' })
            setShowAddPlan(false)
        } else {
            toast.error(res.error || "Hata")
        }
    }

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        const res = await upsertTreatmentPlanItem(customer.id, { ...item, status: newStatus })
        if (res.success) {
            setTreatmentPlans(prev => prev.map(p => p.id === item.id ? { ...p, status: newStatus } : p))
        } else {
            toast.error("Güncellenemedi")
        }
    }

    const handleDeletePlan = async (itemId: string) => {
        setDeletingId(itemId)
        const res = await deleteTreatmentPlanItem(customer.id, itemId)
        setDeletingId(null)
        if (res.success) {
            toast.success("Silindi")
            setTreatmentPlans(prev => prev.filter(p => p.id !== itemId))
        } else {
            toast.error("Silinemedi")
        }
    }

    // Sekme yapısı sektöre göre
    const tabs = isDental
        ? [
            { value: 'appointments', label: 'Randevular' },
            { value: 'history', label: 'Tedavi Geçmişi' },
            { value: 'plan', label: 'Tedavi Planı' },
          ]
        : config.features.measurements
        ? [
            { value: 'appointments', label: 'Randevular' },
            { value: 'packages', label: config.labels.package || 'Paketler' },
            { value: 'measurements', label: 'Ölçümler' },
          ]
        : [
            { value: 'appointments', label: 'Randevular' },
            { value: 'packages', label: config.labels.package || 'Paketler' },
          ]

    return (
        <DashboardLayout
            title=""
            role={role}
            headerAction={
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" /> Geri
                </Button>
            }
        >
            <div className="max-w-3xl mx-auto space-y-5 pb-16">

                {/* ── Profil Header ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0F2044, #2E66F1)' }} />
                    <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14 shrink-0 ring-4 ring-slate-100">
                                <AvatarFallback className="text-lg font-black" style={{ background: '#0F2044', color: '#fff' }}>
                                    {customer.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-black text-slate-900">{customer.name}</h1>
                                    {activePackage ? (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">AKTİF</span>
                                    ) : (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">PASİF</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    {customer.phone && (
                                        <span className="flex items-center gap-1 text-sm text-slate-500">
                                            <Phone className="h-3 w-3" /> {customer.phone}
                                        </span>
                                    )}
                                    {customer.email && (
                                        <span className="flex items-center gap-1 text-sm text-slate-500">
                                            <Mail className="h-3 w-3" /> {customer.email}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                        <Calendar className="h-3 w-3" />
                                        {memberDays} gündür {config.labels.customer.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {role !== 'staff' && !isDental && (
                            <Button size="sm" onClick={() => setPackageOpen(true)} className="shrink-0 flex items-center gap-1.5 text-xs rounded-xl" style={{ background: '#0F2044', color: '#fff' }}>
                                <PackagePlus className="h-3.5 w-3.5" /> {config.labels.package || 'Paket'} Ekle
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── İstatistik Kartları ── */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Toplam Seans', value: stats.totalSessions, icon: Activity, color: '#2E66F1' },
                        { label: 'Bu Ay', value: stats.thisMonth, icon: TrendingUp, color: '#10B981' },
                        { label: 'Yaklaşan', value: stats.upcoming, icon: Clock, color: '#F59E0B' },
                        isDental
                            ? { label: 'Aktif Plan', value: treatmentPlans.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length, icon: Package, color: '#8B5CF6' }
                            : { label: 'Kalan Hak', value: activePackage ? activePackage.remaining_credits : '—', icon: Package, color: activePackage && activePackage.remaining_credits <= 2 ? '#EF4444' : '#8B5CF6' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '18' }}>
                                <Icon className="h-4 w-4" style={{ color }} />
                            </div>
                            <p className="text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Aktif Paket Özeti (dental değilse) ── */}
                {!isDental && activePackage && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">AKTİF {(config.labels.package || 'PAKET').toUpperCase()}</p>
                                <p className="text-base font-black text-slate-900">{activePackage.package_name}</p>
                            </div>
                            {activePackage.expiry_date && (
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Son Kullanım</p>
                                    <p className={`text-sm font-bold ${isPast(new Date(activePackage.expiry_date)) ? 'text-red-500' : 'text-slate-700'}`}>
                                        {format(new Date(activePackage.expiry_date), 'd MMM yyyy', { locale: tr })}
                                    </p>
                                </div>
                            )}
                        </div>
                        <Progress
                            value={(activePackage.remaining_credits / activePackage.initial_credits) * 100}
                            className={`h-3 rounded-full ${activePackage.remaining_credits <= 2 ? 'bg-red-100 [&>div]:bg-red-500' : 'bg-slate-100 [&>div]:bg-blue-600'}`}
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>{activePackage.initial_credits - activePackage.remaining_credits} kullanıldı</span>
                            <span className="font-bold text-slate-900">{activePackage.remaining_credits} hak kaldı</span>
                        </div>
                    </div>
                )}

                {/* ── Sekmeler ── */}
                <Tabs defaultValue="appointments">
                    <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl w-full flex gap-1 h-auto mb-4">
                        {tabs.map(t => (
                            <TabsTrigger key={t.value} value={t.value} className="flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* ── Randevular ── */}
                    <TabsContent value="appointments" className="space-y-4">
                        {upcomingApts.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Yaklaşan</p>
                                {upcomingApts.map(apt => (
                                    <div key={apt.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#2E66F115' }}>
                                                <Calendar className="h-5 w-5" style={{ color: '#2E66F1' }} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-900">{apt.class_sessions?.title || config.labels.appointment}</p>
                                                <p className="text-xs text-slate-500">
                                                    {format(new Date(apt.start_time), "d MMM EEEE, HH:mm", { locale: tr })}
                                                    {apt.class_sessions?.users?.full_name && <> · {apt.class_sessions.users.full_name}</>}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={`text-[10px] font-black px-2 py-0.5 border-0 ${statusColor[apt.status] || 'bg-slate-50 text-slate-500'}`}>
                                            {statusLabel[apt.status] || apt.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Geçmiş ({pastApts.length})</p>
                            {pastApts.length === 0 && (
                                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">Geçmiş randevu yok.</div>
                            )}
                            {pastApts.map(apt => (
                                <div key={apt.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between ${apt.status === 'cancelled' ? 'opacity-50' : 'border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${apt.status === 'cancelled' ? 'bg-red-50' : 'bg-slate-50'}`}>
                                            {apt.status === 'cancelled' ? <XCircle className="h-5 w-5 text-red-400" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900">{apt.class_sessions?.title || config.labels.appointment}</p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(apt.start_time), "d MMM yyyy, HH:mm", { locale: tr })}
                                                {apt.class_sessions?.users?.full_name && <> · {apt.class_sessions.users.full_name}</>}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={`text-[10px] font-black px-2 py-0.5 border-0 ${statusColor[apt.status] || 'bg-slate-50 text-slate-500'}`}>
                                        {statusLabel[apt.status] || apt.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ── Dental: Tedavi Geçmişi ── */}
                    <TabsContent value="history" className="space-y-3">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Tamamlanan Tedaviler ({pastApts.filter(a => a.status !== 'cancelled').length})</p>
                        {pastApts.filter(a => a.status !== 'cancelled').length === 0 && (
                            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">Henüz tamamlanan tedavi yok.</div>
                        )}
                        {pastApts.filter(a => a.status !== 'cancelled').map(apt => (
                            <div key={apt.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-900">{apt.class_sessions?.title || 'Tedavi'}</p>
                                    <p className="text-xs text-slate-500">
                                        {format(new Date(apt.start_time), "d MMMM yyyy, HH:mm", { locale: tr })}
                                        {apt.class_sessions?.users?.full_name && <> · Dr. {apt.class_sessions.users.full_name}</>}
                                    </p>
                                    {apt.notes && <p className="text-xs text-slate-400 italic mt-1">"{apt.notes}"</p>}
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    {/* ── Dental: Tedavi Planı ── */}
                    <TabsContent value="plan" className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Planlanan Tedaviler ({treatmentPlans.length})</p>
                            {role !== 'staff' && (
                                <Button size="sm" onClick={() => setShowAddPlan(v => !v)} style={{ background: '#0F2044', color: '#fff' }} className="text-xs font-bold h-8 px-3 rounded-lg flex items-center gap-1.5">
                                    <Plus className="h-3.5 w-3.5" /> Ekle
                                </Button>
                            )}
                        </div>

                        {/* Ekleme formu */}
                        {showAddPlan && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tedavi</Label>
                                        <Input
                                            placeholder="ör. İmplant Tedavisi, Kanal Tedavisi..."
                                            value={planForm.title}
                                            onChange={e => setPlanForm(f => ({ ...f, title: e.target.value }))}
                                            className="h-10 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Diş No (opsiyonel)</Label>
                                        <Input
                                            placeholder="ör. 17, 36"
                                            value={planForm.tooth}
                                            onChange={e => setPlanForm(f => ({ ...f, tooth: e.target.value }))}
                                            className="h-10 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Durum</Label>
                                        <Select value={planForm.status} onValueChange={v => setPlanForm(f => ({ ...f, status: v }))}>
                                            <SelectTrigger className="h-10 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                <SelectItem value="planned">Planlandı</SelectItem>
                                                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                                                <SelectItem value="completed">Tamamlandı</SelectItem>
                                                <SelectItem value="cancelled">İptal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Not (opsiyonel)</Label>
                                        <Input
                                            placeholder="Notlar..."
                                            value={planForm.notes}
                                            onChange={e => setPlanForm(f => ({ ...f, notes: e.target.value }))}
                                            className="h-10 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowAddPlan(false)} className="h-9 px-4 text-xs font-bold rounded-lg border border-slate-200 text-slate-600">İptal</button>
                                    <button onClick={handleAddPlan} disabled={planLoading} style={{ background: '#2E66F1', color: '#fff' }} className="h-9 px-4 text-xs font-bold rounded-lg flex items-center gap-1.5">
                                        {planLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        )}

                        {treatmentPlans.length === 0 && !showAddPlan && (
                            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-sm">
                                Henüz tedavi planı eklenmemiş.
                            </div>
                        )}

                        {treatmentPlans.map(plan => {
                            const sc = planStatusConfig[plan.status] || planStatusConfig.planned
                            return (
                                <div key={plan.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start gap-4">
                                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: sc.bg }}>
                                        <span className="text-[10px] font-black" style={{ color: sc.color }}>{plan.tooth || '🦷'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-bold text-sm text-slate-900">{plan.title}</p>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <select
                                                    value={plan.status}
                                                    onChange={e => handleUpdateStatus(plan, e.target.value)}
                                                    className="text-[10px] font-black rounded-full px-2 py-0.5 border-0 cursor-pointer"
                                                    style={{ background: sc.bg, color: sc.color }}
                                                >
                                                    {Object.entries(planStatusConfig).map(([v, c]) => (
                                                        <option key={v} value={v}>{c.label}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleDeletePlan(plan.id)} className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                    {deletingId === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </div>
                                        {plan.notes && <p className="text-xs text-slate-400 mt-0.5 italic">"{plan.notes}"</p>}
                                        <p className="text-[10px] text-slate-300 mt-1">{format(new Date(plan.created_at), "d MMM yyyy", { locale: tr })}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </TabsContent>

                    {/* ── Pilates/Genel: Paketler ── */}
                    <TabsContent value="packages" className="space-y-3">
                        {packages.length === 0 && (
                            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
                                <Package className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">Henüz {config.labels.package?.toLowerCase() || 'paket'} yok.</p>
                                {role !== 'staff' && (
                                    <Button size="sm" className="mt-4" style={{ background: '#2E66F1', color: '#fff' }} onClick={() => setPackageOpen(true)}>
                                        <PackagePlus className="h-3.5 w-3.5 mr-1.5" /> Ekle
                                    </Button>
                                )}
                            </div>
                        )}
                        {packages.map(pkg => (
                            <div key={pkg.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-black text-slate-900">{pkg.package_name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{format(new Date(pkg.created_at), "d MMM yyyy", { locale: tr })} tarihinde başladı</p>
                                    </div>
                                    <Badge className={`text-[10px] font-black px-2.5 py-1 border-0 ${pkg.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {pkg.status === 'active' ? 'AKTİF' : 'BİTTİ'}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Kullanılan: {pkg.initial_credits - pkg.remaining_credits}</span>
                                        <span>Kalan: <strong className="text-slate-800">{pkg.remaining_credits}</strong> / {pkg.initial_credits}</span>
                                    </div>
                                    <Progress value={(pkg.remaining_credits / pkg.initial_credits) * 100} className={`h-2 ${pkg.status === 'active' ? 'bg-blue-100 [&>div]:bg-blue-600' : 'bg-slate-100 [&>div]:bg-slate-400'}`} />
                                </div>
                                {pkg.expiry_date && (
                                    <p className={`text-xs font-medium flex items-center gap-1 ${isPast(new Date(pkg.expiry_date)) ? 'text-red-500' : 'text-slate-500'}`}>
                                        <AlertCircle className="h-3 w-3" />
                                        Son kullanım: {format(new Date(pkg.expiry_date), "d MMMM yyyy", { locale: tr })}
                                    </p>
                                )}
                            </div>
                        ))}
                    </TabsContent>

                    {/* ── Pilates: Ölçümler ── */}
                    <TabsContent value="measurements">
                        <MeasurementsList customerId={customer.id} />
                    </TabsContent>
                </Tabs>
            </div>

            <PackageSaleDialog
                customer={{ id: customer.id, name: customer.name }}
                open={packageOpen}
                onOpenChange={setPackageOpen}
                onSuccess={() => { setPackageOpen(false); router.refresh() }}
            />
        </DashboardLayout>
    )
}
