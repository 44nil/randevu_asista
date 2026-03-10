"use client"

import { Button } from "@/components/ui/button"
import { PlayCircle } from "lucide-react"
import { useOrganization } from "@/providers/organization-provider"

export function HeroSection({ userName }: { userName: string }) {
    const { config, organization } = useOrganization()
    // real_industry: onboarding'de seçilen asıl sektör (yoga, pt, physio, psychologist, beauty, vs.)
    const realIndustry: string = organization?.settings?.real_industry || organization?.industry_type || 'general'

    const isDental = realIndustry === 'dental'
    const isHair = realIndustry === 'hair' || realIndustry === 'beauty'
    const isFitness = ['pilates', 'yoga', 'pt'].includes(realIndustry)
    const isHealth = ['physio', 'dietitian'].includes(realIndustry)
    const isPsychologist = realIndustry === 'psychologist'

    const bgImage = isDental
        ? "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80')"
        : isHair
            ? "url('https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80')"
            : "url('https://images.unsplash.com/photo-1518310383802-640c2de311b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80')"

    const badge = isDental ? 'Ağız ve Diş Sağlığı'
        : isHair ? 'Güzellik & Bakım'
            : isHealth ? 'Sağlık & Rehabilitasyon'
                : isPsychologist ? 'Psikoloji & Danışmanlık'
                    : 'Günlük Motivasyon'

    const quote = isDental ? '"Gülüşünüz, imzanızdır. Sağlıklı dişler, mutlu yarınlar."'
        : isHair ? '"Güzelliğiniz, uzman ellerde sanat eserine dönüşür."'
            : isFitness ? '"Vücudun senin tapınağındır, ona iyi bak."'
                : isHealth ? '"Sağlıklı bir beden, sağlıklı bir yaşamın temelidir."'
                    : isPsychologist ? '"Kendine iyi bakmak, güçlü olmanın en önemli adımıdır."'
                        : `Hoş Geldiniz, ${userName}`

    const attribution = isDental ? '— Sağlıklı Gülüşler'
        : isHair ? '— Profesyonel Bakım'
            : isFitness ? '— Joseph Pilates'
                : isHealth ? '— Sağlıklı Yaşam'
                    : isPsychologist ? '— Zihinsel Sağlık'
                        : '— Asista Yönetim'

    const ctaLabel = isDental ? 'Tedavi Rehberini Gör'
        : isHair ? 'Bakım Rehberini Gör'
            : isFitness ? 'Antrenman Rehberini Gör'
                : 'Hizmet Rehberini Gör'

    return (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[300px] flex flex-col justify-end p-8 shadow-xl">
            {/* Background Image Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: bgImage }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative z-10 max-w-2xl space-y-4">
                <span className="inline-block bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {badge}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    {quote}
                </h2>
                <p className="text-slate-300 italic font-medium text-lg">
                    {attribution}
                </p>

                <div className="pt-4">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 backdrop-blur-sm gap-2 rounded-full h-12 px-6">
                        <PlayCircle className="h-5 w-5" />
                        {ctaLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}
