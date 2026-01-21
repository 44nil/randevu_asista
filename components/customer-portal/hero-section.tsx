"use client"

import { Button } from "@/components/ui/button"
import { PlayCircle } from "lucide-react"

export function HeroSection({ userName }: { userName: string }) {
    return (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[300px] flex flex-col justify-end p-8 shadow-xl">
            {/* Background Image Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518310383802-640c2de311b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative z-10 max-w-2xl space-y-4">
                <span className="inline-block bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Günlük Motivasyon
                </span>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    "Vücudun senin tapınağındır, ona iyi bak."
                </h2>
                <p className="text-slate-300 italic font-medium text-lg">
                    — Joseph Pilates
                </p>

                <div className="pt-4">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 backdrop-blur-sm gap-2 rounded-full h-12 px-6">
                        <PlayCircle className="h-5 w-5" />
                        Antrenman Rehberini Gör
                    </Button>
                </div>
            </div>
        </div>
    )
}
