"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"

type Reminder = {
    id?: string
    customer?: { name?: string } | { name?: string }[] | null
    title?: string
    date?: string
    [key: string]: unknown
}

interface RemindersPanelProps {
    data?: Reminder[] // Expecting array of upcoming appointments or custom reminders
}

export function RemindersPanel({ data }: RemindersPanelProps) {
    const { config } = useOrganization()
    const hasData = data && data.length > 0;

    return (
        <Card className="bg-blue-50 border-none">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-base font-bold text-blue-900">Yaklaşan Bildirimler</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 mb-4">
                    {!hasData ? (
                        <li className="text-sm text-blue-800/60 italic">Okunmamış bildiriminiz yok.</li>
                    ) : (
                        data!.map((item, index) => {
                            const customerName = Array.isArray(item.customer) ? item.customer[0]?.name : item.customer?.name
                            return (
                                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    {customerName ? `${customerName} ile ${config.labels.appointment.toLowerCase()} yaklaşıyor.` : "Hatırlatma"}
                                </li>
                            )
                        })
                    )}
                </ul>
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-100 border-none shadow-sm">
                    Hatırlatıcı Ekle
                </Button>
            </CardContent>
        </Card>
    )
}
