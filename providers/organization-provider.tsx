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

interface OrganizationContextType {
    organization: Organization | null
    config: IndustryConfig
    isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    config: getIndustryConfig('general'),
    isLoading: true
})

interface OrganizationProviderProps {
    children: ReactNode
    organization: Organization | null
}

export function OrganizationProvider({ children, organization }: OrganizationProviderProps) {
    const config = getIndustryConfig(organization?.industry_type)

    return (
        <OrganizationContext.Provider value={{
            organization,
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
