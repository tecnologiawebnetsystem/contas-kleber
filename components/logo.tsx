"use client"

interface LogoProps {
  variant?: "full" | "icon" | "text" | "minimal"
  size?: "sm" | "md" | "lg" | "xl"
  glow?: boolean
  className?: string
}

const sizeMap = {
  sm: { icon: 28, text: "text-sm" },
  md: { icon: 36, text: "text-lg" },
  lg: { icon: 48, text: "text-2xl" },
  xl: { icon: 64, text: "text-3xl" },
}

export function Logo({ variant = "full", size = "md", glow = false, className = "" }: LogoProps) {
  const s = sizeMap[size]

  const IconSVG = () => (
    <svg
      width={s.icon}
      height={s.icon}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={glow ? "glow-red" : ""}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="blueAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* Hexagon background */}
      <path
        d="M32 4L56.785 18V46L32 60L7.215 46V18L32 4Z"
        fill="url(#logoGrad)"
        stroke="url(#logoGrad)"
        strokeWidth="1"
      />
      {/* Inner hexagon outline */}
      <path
        d="M32 10L51.32 21V43L32 54L12.68 43V21L32 10Z"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      {/* Stylized "T" letter */}
      <rect x="20" y="22" width="24" height="3.5" rx="1.75" fill="white" />
      <rect x="30" y="22" width="4" height="22" rx="2" fill="white" />
      {/* Connection dots (financial network concept) */}
      <circle cx="16" cy="32" r="2.5" fill="url(#blueAccent)" />
      <circle cx="48" cy="32" r="2.5" fill="url(#blueAccent)" />
      <circle cx="32" cy="50" r="2.5" fill="url(#blueAccent)" />
      {/* Connection lines */}
      <line x1="18.5" y1="32" x2="28" y2="32" stroke="url(#blueAccent)" strokeWidth="1" opacity="0.5" />
      <line x1="36" y1="32" x2="45.5" y2="32" stroke="url(#blueAccent)" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="44" x2="32" y2="47.5" stroke="url(#blueAccent)" strokeWidth="1" opacity="0.5" />
    </svg>
  )

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <IconSVG />
      </div>
    )
  }

  if (variant === "text") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span className={`font-heading font-bold tracking-tight text-gradient ${s.text}`}>
          Tecnologia Web Net
        </span>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          Contas a Pagar
        </span>
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <IconSVG />
        <span className={`font-heading font-bold text-gradient ${s.text}`}>TWN</span>
      </div>
    )
  }

  // Full variant
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <IconSVG />
      <div className="flex flex-col">
        <span className={`font-heading font-bold tracking-tight text-gradient leading-tight ${s.text}`}>
          Talent Money Family
        </span>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
          Contas a Pagar
        </span>
      </div>
    </div>
  )
}
