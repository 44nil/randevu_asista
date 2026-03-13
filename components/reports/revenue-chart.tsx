"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts"

interface RevenueChartProps {
    data: { name: string, value: number }[]
    type?: "area" | "bar"
}

const fmt = (v: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v)

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 shadow-xl text-sm">
            <p className="font-black mb-1">{label}</p>
            <p className="text-emerald-400 font-bold">{fmt(payload[0].value)}</p>
        </div>
    )
}

export function RevenueChart({ data, type = "area" }: RevenueChartProps) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            {type === "bar" ? (
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#2E66F1" radius={[6, 6, 0, 0]} />
                </BarChart>
            ) : (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
            )}
        </ResponsiveContainer>
    )
}
