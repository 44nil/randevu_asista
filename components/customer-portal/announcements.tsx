"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, Calendar, Flame } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"

const getAnnouncements = (labels: any) => [
    {
        title: "Bayram Tatili Çalışma Saatleri",
        desc: `Bayram tatili süresince işletmemiz 2 gün kapalı olacaktır. Tüm ${labels.appointment?.toLowerCase()}larınız için önceden planlama yapmanızı rica ederiz.`,
        time: "2 SAAT ÖNCE",
        icon: Calendar,
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: `Yeni ${labels.package} ${labels.session}ları Başlıyor!`,
        desc: `Önümüzdeki aydan itibaren yeni ${labels.package?.toLowerCase()} programlarımız aktif olacaktır.`,
        time: "DÜN",
        icon: Flame,
        color: "bg-orange-50 text-orange-600"
    }
]

export function Announcements() {
    const { config } = useOrganization()
    const items = getAnnouncements(config.labels)

    return (
        <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base font-bold text-slate-900">Merkez Duyuruları</CardTitle>
                </div>
                <Button variant="link" className="text-xs text-blue-600 p-0 h-auto font-semibold">Tümünü Gör</Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-navy group-hover:text-electric transition-colors line-clamp-1">
                                    {item.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                    {item.desc}
                                </p>
                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-2 block tracking-wide">
                                    {item.time}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
