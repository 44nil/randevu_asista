import { cn } from "@/lib/utils"

interface LogoProps {
    variant?: 'light' | 'dark'
    className?: string
    iconClassName?: string
    textClassName?: string
    showText?: boolean
    text?: string
}

export function Logo({
    variant = 'light',
    className,
    iconClassName,
    textClassName,
    showText = true,
    text = "ASISTA"
}: LogoProps) {
    const isDark = variant === 'dark'
    const strokeColor = isDark ? "white" : "#0F2044"
    const textColor = isDark ? "text-white" : "text-navy" // use text-navy for #0F2044

    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <svg
                className={cn("w-8 h-8 shrink-0", iconClassName)}
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Takvim gövde */}
                <rect x="4" y="10" width="38" height="34" rx="6" fill={isDark ? "transparent" : "white"} stroke={strokeColor} strokeWidth="2.5" />
                {/* Ayırıcı çizgi */}
                <line x1="4" y1="20" x2="42" y2="20" stroke={strokeColor} strokeWidth="2.5" />
                {/* Halka ipler */}
                <line x1="14" y1="5" x2="14" y2="14" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                <line x1="32" y1="5" x2="32" y2="14" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                {/* Gün kutucukları */}
                <rect x="9" y="26" width="6" height="5" rx="1.5" fill={isDark ? "rgba(255,255,255,0.2)" : "#E6ECF8"} />
                <rect x="19" y="26" width="6" height="5" rx="1.5" fill={isDark ? "rgba(255,255,255,0.2)" : "#E6ECF8"} />
                <rect x="29" y="26" width="6" height="5" rx="1.5" fill={isDark ? "rgba(255,255,255,0.2)" : "#E6ECF8"} />
                <rect x="9" y="35" width="6" height="5" rx="1.5" fill={isDark ? "rgba(255,255,255,0.2)" : "#E6ECF8"} />
                <rect x="19" y="35" width="6" height="5" rx="1.5" fill="rgba(37,99,235,0.15)" />

                {/* Rozet tik */}
                <circle cx="46" cy="46" r="13" fill="#2563EB" stroke={isDark ? "#0F2044" : "white"} strokeWidth="3" />
                <path d="M40 46L44.5 50.5L53 42" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {showText && (
                <span className={cn(
                    "font-extrabold tracking-[-1px] text-xl leading-none pt-1 uppercase",
                    textColor,
                    textClassName
                )}>
                    {text}
                </span>
            )}
        </div>
    )
}
