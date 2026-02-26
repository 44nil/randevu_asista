"use client"

import { createContext, useContext, ReactNode } from "react"
import { IndustryConfig, getIndustryConfig } from "@/lib/config/industries"

interface Organization {
    id: string
    name: string
    industry_type: string
    subdomain: string
    settings?: any
}

interface UserProfile {
    id: string
    role: 'admin' | 'owner' | 'staff' | 'customer'
    full_name?: string
}

interface OrganizationContextType {
    organization: Organization | null
    user: UserProfile | null
    config: IndustryConfig
    isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    user: null,
    config: getIndustryConfig('general'),
    isLoading: true
})

interface OrganizationProviderProps {
    children: ReactNode
    organization: Organization | null
    user: UserProfile | null
}

export function OrganizationProvider({ children, organization, user }: OrganizationProviderProps) {
    const config = getIndustryConfig(organization?.industry_type)

    return (
        <OrganizationContext.Provider value={{
            organization,
            user,
            config,
            isLoading: false
        }}>
            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = useContext(OrganizationContext)
    if (context === undefined) {
        throw new Error("useOrganization must be used within an OrganizationProvider")
    }
    return context
}
