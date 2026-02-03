"use client"

import { cn } from "@/lib/utils"

interface ParcelaProgressProps {
  parcelaAtual: number
  totalParcelas: number
  className?: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function ParcelaProgress({ 
  parcelaAtual, 
  totalParcelas, 
  className,
  showLabel = true,
  size = "md"
}: ParcelaProgressProps) {
  const percentual = totalParcelas > 0 ? (parcelaAtual / totalParcelas) * 100 : 0
  const isComplete = parcelaAtual >= totalParcelas
  const isNearComplete = percentual >= 75
  const isHalfway = percentual >= 50

  const sizeClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2"
  }

  const getColor = () => {
    if (isComplete) return "bg-green-500 dark:bg-green-400"
    if (isNearComplete) return "bg-emerald-500 dark:bg-emerald-400"
    if (isHalfway) return "bg-amber-500 dark:bg-amber-400"
    return "bg-blue-500 dark:bg-blue-400"
  }

  const getBgColor = () => {
    if (isComplete) return "bg-green-100 dark:bg-green-900/30"
    if (isNearComplete) return "bg-emerald-100 dark:bg-emerald-900/30"
    if (isHalfway) return "bg-amber-100 dark:bg-amber-900/30"
    return "bg-blue-100 dark:bg-blue-900/30"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex-1 rounded-full overflow-hidden",
        sizeClasses[size],
        getBgColor()
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getColor()
          )}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          "text-xs font-medium whitespace-nowrap",
          isComplete 
            ? "text-green-600 dark:text-green-400" 
            : "text-muted-foreground"
        )}>
          {parcelaAtual}/{totalParcelas}
        </span>
      )}
    </div>
  )
}

// Componente visual alternativo com bolinhas
export function ParcelaProgressDots({ 
  parcelaAtual, 
  totalParcelas, 
  className,
  maxDots = 12
}: ParcelaProgressProps & { maxDots?: number }) {
  const dotsToShow = Math.min(totalParcelas, maxDots)
  const showEllipsis = totalParcelas > maxDots

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: dotsToShow }).map((_, index) => {
        const isPaid = index < parcelaAtual
        return (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              isPaid 
                ? "bg-green-500 dark:bg-green-400 scale-100" 
                : "bg-gray-200 dark:bg-gray-700 scale-90"
            )}
          />
        )
      })}
      {showEllipsis && (
        <span className="text-xs text-muted-foreground ml-1">
          +{totalParcelas - maxDots}
        </span>
      )}
    </div>
  )
}
