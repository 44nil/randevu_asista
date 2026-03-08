"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WeeklyCalendar } from "@/components/appointments/weekly-calendar"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppointmentForm } from "@/components/forms/appointment-form"
import { useState, useEffect } from "react"

import { useOrganization } from "@/providers/organization-provider"
import { useSession } from "@clerk/nextjs"

interface ProgramClientProps {
    role?: string
}

export function ProgramClient({ role }: ProgramClientProps) {
    const { config } = useOrganization()
    const { session } = useSession()
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <DashboardLayout
            title={config.labels.program}
            role={role}
            headerAction={
                mounted ? (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                {config.labels.createAppointment}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="sr-only">{config.labels.createAppointment}</DialogTitle>
                            </DialogHeader>
                            <AppointmentForm staffId={session?.user?.id} onSuccess={() => {
                                setOpen(false)
                                window.location.reload()
                            }} />
                        </DialogContent>
                    </Dialog>
                ) : null
            }
        >
            <WeeklyCalendar />
        </DashboardLayout >
    )
}
