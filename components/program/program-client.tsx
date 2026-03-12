"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WeeklyCalendar } from "@/components/appointments/weekly-calendar"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppointmentForm } from "@/components/forms/appointment-form"
import { useState } from "react"

import { useOrganization } from "@/providers/organization-provider"

interface ProgramClientProps {
    role?: string
    staffId?: string  // Supabase users.id (UUID)
}

export function ProgramClient({ role, staffId }: ProgramClientProps) {
    const { config } = useOrganization()
    const [open, setOpen] = useState(false)

    return (
        <DashboardLayout
            title={config.labels.program}
            role={role}
            headerAction={
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            {config.labels.createAppointment}
                        </Button>
                    </DialogTrigger>
                    <DialogContent
                        className="max-w-3xl border-none bg-white p-0"
                        style={{ display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}
                    >
                        <div className="px-6 pt-6 pb-3 border-b border-slate-100 shrink-0">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black text-navy uppercase tracking-tight">{config.labels.createAppointment}</DialogTitle>
                            </DialogHeader>
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <AppointmentForm
                                formId="program-apt-form"
                                hideSubmit
                                staffId={staffId}
                                onSuccess={() => {
                                    setOpen(false)
                                    window.location.reload()
                                }}
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0">
                            <button
                                type="submit"
                                form="program-apt-form"
                                style={{ background: '#2E66F1', color: '#fff', width: '100%', height: '56px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}
                            >
                                {config.labels.createAppointment.toUpperCase()}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            }
        >
            <WeeklyCalendar />
        </DashboardLayout >
    )
}
