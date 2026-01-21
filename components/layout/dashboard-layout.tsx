"use client"

import { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Bell, HelpCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DashboardLayoutProps {
    children: ReactNode
    title: string
    subtitle?: string
    headerAction?: ReactNode
    role?: string // Added role prop
}

export function DashboardLayout({ children, title, subtitle, headerAction, role }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <Sidebar role={role} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-64 overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-64 hidden md:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Hızlı ara (Üye, Ders...)"
                                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                            <HelpCircle className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {/* Page Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                                {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
                            </div>
                            {headerAction && (
                                <div>
                                    {headerAction}
                                </div>
                            )}
                        </div>

                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
