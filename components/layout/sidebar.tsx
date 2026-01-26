"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Calendar,
    Users,
    Package,
    Settings,
    Plus,
    BarChart3,
    LogOut
} from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import { useOrganization } from "@/providers/organization-provider"


export function Sidebar({ role }: { role?: string }) {
    const pathname = usePathname()
    const { user } = useUser()
    const { config, organization } = useOrganization()

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: Calendar, label: config.labels.program, href: "/program" },
        { icon: Users, label: config.labels.customer ? `${config.labels.customer}ler` : "Müşteriler", href: "/customers" },
        { icon: Package, label: config.labels.package ? `${config.labels.package}ler` : "Paketler", href: "/packages" },
        { icon: BarChart3, label: "Raporlar", href: "/reports" },
        { icon: Settings, label: "Ayarlar", href: "/settings" },
    ]

    // Filter items based on role
    const filteredItems = sidebarItems.filter(item => {
        if (role === 'staff') {
            return !['/settings', '/reports', '/packages'].includes(item.href)
        }
        return true
    })

    const industryLabelMap: Record<string, string> = {
        'pilates': 'PİLATES STÜDYOSU',
        'hair': 'KUAFÖR YÖNETİMİ',
        'dental': 'DİŞ KLİNİĞİ',
        'general': 'İŞLETME YÖNETİMİ'
    }
    const industryLabel = industryLabelMap[organization?.industry_type || 'general'] || 'YÖNETİM PANELİ'

    return (
        <div className="w-64 border-r bg-white h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-10 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6">
                <div className="flex items-center gap-2 p-2 bg-blue-600 rounded-lg w-fit text-white mb-2 shadow-md shadow-blue-200">
                    {/* Placeholder logo icon */}
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 className="font-bold text-xl text-slate-800 tracking-tight">YÖNETİM PANELİ</h1>
                <p className="text-xs text-slate-400 font-medium">{industryLabel}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                <div className="text-xs font-bold text-slate-400 mb-4 px-2 uppercase tracking-wider">MENÜ</div>
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}>
                                <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-400")} />
                                {item.label}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 mt-auto">
                <div className="text-xs font-semibold text-slate-400 mb-2 px-2">HIZLI İŞLEMLER</div>
                <Button variant="outline" className="w-full justify-start gap-2 bg-slate-50 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600">
                    <Plus className="h-4 w-4" />
                    {config.labels.createAppointment}
                </Button>
            </div>

            {/* Profile */}
            <div className="p-4 border-t bg-slate-50">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/sign-in" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {user?.fullName || "Kullanıcı"}
                        </p>
                        <p className="text-xs text-slate-500 truncate capitalize">
                            {role === 'owner' ? 'Kurucu' : role === 'admin' ? 'Yönetici' : 'Eğitmen'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
