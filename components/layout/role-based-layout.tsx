"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RoleBasedLayoutProps {
    children: React.ReactNode
    allowedRoles: ("super_admin" | "owner" | "staff" | "customer")[]
}

export function RoleBasedLayout({ children, allowedRoles }: RoleBasedLayoutProps) {
    const { user, isLoaded } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (isLoaded && user) {
            const userRole = user.publicMetadata.role as string

            if (!allowedRoles.includes(userRole as any)) {
                // Redirect to unauthorized or dashboard
                router.push("/unauthorized")
            }
        }
    }, [isLoaded, user, router, allowedRoles])

    if (!isLoaded) {
        return <div>Loading...</div>
    }

    // Optional: You can also hide content here if you want strict null return
    // But usually redirect handles it.

    return <>{children}</>
}
