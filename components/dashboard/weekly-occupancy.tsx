"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function WeeklyOccupancy() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-center text-slate-400 uppercase tracking-wider">
                    Haftalik Doluluk
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative h-32 w-32 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="h-full w-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-slate-100"
                        />
                        {/* Progress Circle (82%) */}
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={351.86}
                            strokeDashoffset={351.86 * (1 - 0.82)}
                            strokeLinecap="round"
                            className="text-blue-600"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">82%</span>
                        <span className="text-xs font-semibold text-blue-500 uppercase">DOLULUK</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
