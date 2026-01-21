"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { OrganizationSetup } from "@/components/onboarding/organization-setup"
import MainDashboard from "@/components/dashboard/main-dashboard"
import { CustomerDashboard } from "@/components/customer-portal/customer-dashboard"
import { getUserProfile } from "./actions"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function Home() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [userProfile, setUserProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoaded) return

        if (!user) {
            router.push("/sign-in")
            return
        }

        getUserProfile().then((profile) => {
            setUserProfile(profile)
            setLoading(false)
        })
    }, [user, isLoaded, router])

    if (!isLoaded || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // If user doesn't have an organization AND not a customer (customers usually invited to existing org)
    // But for MVP, if profile exists and has org_id, we check role.
    if (!userProfile || !userProfile.organization_id) {
        return <OrganizationSetup />
    }

    // Role Based Rendering
    if (userProfile.role === 'customer') {
        return <CustomerDashboard />
    }

    // Default to Admin/Owner Dashboard
    return <MainDashboard role={userProfile.role} />
}
