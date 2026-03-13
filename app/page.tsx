"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import MainDashboard from "@/components/dashboard/main-dashboard"
import { CustomerDashboard } from "@/components/customer-portal/customer-dashboard"
import { useOrganization } from "@/providers/organization-provider"

export default function Home() {
    const { user: clerkUser, isLoaded } = useUser()
    const router = useRouter()
    const { organization, user: profile, isLoading: isOrgLoading } = useOrganization()

    useEffect(() => {
        if (!isLoaded) return

        if (!clerkUser) {
            router.push("/sign-in")
            return
        }

        if (!isOrgLoading && !organization) {
            router.push("/onboarding")
        }
    }, [clerkUser, isLoaded, organization, isOrgLoading, router])

    if (!isLoaded || isOrgLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // Org yoksa onboarding'e gidene kadar boş ekran göster (flash önleme)
    if (!organization) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // Role Based Rendering
    if (profile?.role === 'customer') {
        return <CustomerDashboard />
    }

    // Default to Admin/Owner Dashboard
    return <MainDashboard role={profile?.role} />
}
