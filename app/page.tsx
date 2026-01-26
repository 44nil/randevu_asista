"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

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
        }).catch((err) => {
            console.error("Profile load error:", err)
        }).finally(() => {
            setLoading(false)
        })
    }, [user, isLoaded, router])

    useEffect(() => {
        if (!loading && isLoaded && userProfile && !userProfile.organization_id) {
            router.push("/onboarding")
        }
    }, [loading, isLoaded, userProfile, router])

    if (!isLoaded || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // If user doesn't have an organization, show loader while redirecting (handled by useEffect above)
    if (!userProfile || !userProfile.organization_id) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // Role Based Rendering
    if (userProfile.role === 'customer') {
        return <CustomerDashboard />
    }

    // Default to Admin/Owner Dashboard
    return <MainDashboard role={userProfile.role} />
}
