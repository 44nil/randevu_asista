"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
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
    const { config, organization, user: dbUser } = useOrganization()

    // Fallback to prop if provided, otherwise use the context user role
    const activeRole = role || dbUser?.role || 'staff'

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
        if (!config.features.packages && item.href === '/packages') {
            return false
        }
        if (activeRole === 'staff') {
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
        <div className="w-64 border-r border-r-indigo-900/30 bg-navy h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-10 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6">
                <Logo variant="dark" className="mb-2" />
                <p className="text-[10px] text-blue-200 font-bold tracking-widest">{industryLabel}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                <div className="text-xs font-bold text-white mb-4 px-2 uppercase tracking-wider">MENÜ</div>
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-electric text-white shadow-sm shadow-blue-900/50"
                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                            )}>
                                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                                {item.label}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 mt-auto">
                <div className="text-xs font-bold text-white mb-2 px-2 uppercase tracking-wider">HIZLI İŞLEMLER</div>
                <Button variant="outline" className="w-full justify-start gap-2 bg-white/5 border-dashed border-slate-600 hover:border-electric hover:bg-electric text-slate-300 hover:text-white transition-all">
                    <Plus className="h-4 w-4" />
                    {config.labels.createAppointment}
                </Button>
            </div>

            {/* Profile */}
            <div className="p-4 border-t border-white/10 flex items-center gap-3">
                <UserButton afterSignOutUrl="/sign-in" />
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">
                        {user?.fullName || "Kullanıcı"}
                    </p>
                    <p className="text-xs text-slate-400 truncate capitalize">
                        {activeRole === 'owner' ? 'Kurucu' : activeRole === 'admin' ? 'Yönetici' : config.labels.instructor}
                    </p>
                </div>
            </div>
        </div>
    )
}
