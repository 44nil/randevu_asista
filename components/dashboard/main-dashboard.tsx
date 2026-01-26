"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DailySchedule } from "@/components/dashboard/daily-schedule"
import { SalesPanel } from "@/components/dashboard/sales-panel"
import { RemindersPanel } from "@/components/dashboard/reminders-panel"
import { WeeklyOccupancy } from "@/components/dashboard/weekly-occupancy"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { getDashboardStats } from "@/app/stats-actions"
import { Loader2, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { PendingRequestsPanel } from "@/components/dashboard/pending-requests"

interface MainDashboardProps {
  role?: string
}

import { useOrganization } from "@/providers/organization-provider"

export default function MainDashboard({ role }: MainDashboardProps) {
  const { config } = useOrganization()
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    stats: {
      totalMembers: 0,
      todayAttendance: 0,
      monthlyRevenue: 0, // Staff should see 0 or hidden
      activePackages: 0
    },
    dailySchedule: [],
    recentSales: [],
    upcomingReminders: [],
    cancellationRequests: []
  })

  // Determine if sensitive info should be hidden
  const isStaff = role === 'staff'

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getDashboardStats()
        if (result.success && result.data) {
          setData(result.data)
        } else {
          console.error("Dashboard data load error:", result.error)
        }
      } catch (error) {
        console.error("Dashboard load exception:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="Genel Bakış" role={role}>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Genel Bakış" role={role}>
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hoş geldin, {user?.firstName} {isStaff ? "" : "Hanım"}</h2>
          <p className="text-slate-500 mt-1">
            İşte {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} günü için {config.labels.package?.toLowerCase()} ve {config.labels.appointment?.toLowerCase()} özetiniz.
          </p>
        </div>
        {!isStaff && (
          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/program')}>
              + {config.labels.createAppointment}
            </Button>
            <Button variant="outline" onClick={() => router.push('/customers')}>
              + {config.labels.createCustomer}
            </Button>
          </div>
        )}
        {/* Staff Action Buttons (Simplified) */}
        {isStaff && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/program')}>
            <Calendar className="mr-2 h-4 w-4" />
            Programı Görüntüle
          </Button>
        )}
      </div>

      {/* Pending Requests Panel - Only for Admin/Staff */}
      {isStaff && data.cancellationRequests && data.cancellationRequests.length > 0 && (
        <div className="mb-8">
          <PendingRequestsPanel requests={data.cancellationRequests} />
        </div>
      )}
      {!isStaff && role === 'owner' && data.cancellationRequests && data.cancellationRequests.length > 0 && (
        <div className="mb-8">
          <PendingRequestsPanel requests={data.cancellationRequests} />
        </div>
      )}

      {/* Stats Cards - Hide Revenue for Staff */}
      {!isStaff && (
        <div className="mb-8">
          <StatsCards data={data.stats} />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className={isStaff ? "lg:col-span-3 space-y-8" : "lg:col-span-2 space-y-8"}>
          {/* Pass real schedule data */}
          <DailySchedule data={data.dailySchedule} />
        </div>

        {/* Right Column (1/3) */}
        {!isStaff && (
          <div className="space-y-6">
            <SalesPanel data={data.recentSales} />
            <RemindersPanel data={data.upcomingReminders} />
            <WeeklyOccupancy />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
