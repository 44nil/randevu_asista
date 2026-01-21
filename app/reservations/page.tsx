"use client"

import { CustomerLayout } from "@/components/layout/customer-layout"
import { ReservationCalendar } from "@/components/customer-portal/reservation-calendar"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"

export default function ReservationsPage() {
    return (
        <CustomerLayout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                <ReservationCalendar />
            </div>
        </CustomerLayout>
    )
}
