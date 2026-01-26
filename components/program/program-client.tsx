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
}

export function ProgramClient({ role }: ProgramClientProps) {
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{config.labels.createAppointment}</DialogTitle>
                        </DialogHeader>
                        <AppointmentForm onSuccess={() => {
                            setOpen(false)
                            window.location.reload()
                        }} />
                    </DialogContent>
                </Dialog>
            }
        >
            <WeeklyCalendar />
        </DashboardLayout >
    )
}
