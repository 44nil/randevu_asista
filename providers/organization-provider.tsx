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
    // real_industry: onboarding'de seçilen asıl sektör (yoga, pt, physio, vs.)
    // industry_type: DB'deki kısıtlı tip (pilates, hair, dental, general)
    // Config için her zaman real_industry'i tercih et
    const realIndustry = organization?.settings?.real_industry || organization?.industry_type
    const config = getIndustryConfig(realIndustry)

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
