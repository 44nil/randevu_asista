"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Calendar, History, User, LogOut, Settings, TrendingUp } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { Logo } from "@/components/ui/logo"
import { useOrganization } from "@/providers/organization-provider"

export function CustomerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { config, organization } = useOrganization()

    const navItems = [
        { href: "/", label: "Kontrol Paneli", icon: LayoutDashboard },
        { href: "/reservations", label: "Rezervasyon", icon: Calendar },
        { href: "/history", label: `${config.labels.appointment || 'İşlem'} Geçmişi`, icon: History },
        { href: "/progress", label: "Gelişim Takibi", icon: TrendingUp },
        { href: "/settings", label: "Ayarlar", icon: Settings },
    ]

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        {/* Brand Logo */}
                        <Logo showText={false} className="shrink-0" iconClassName="w-10 h-10" />
                        <div>
                            <h1 className="font-bold text-slate-800 leading-tight">
                                {organization?.name || 'İşletme'}
                            </h1>
                            <p className="text-xs text-slate-500">{config.labels.customer} Paneli</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 h-12 ${isActive
                                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <SignOutButton>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <LogOut className="h-5 w-5" />
                            Çıkış Yap
                        </Button>
                    </SignOutButton>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
