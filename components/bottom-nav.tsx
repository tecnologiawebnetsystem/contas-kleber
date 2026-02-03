"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, PiggyBank, Plane, Car, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  showForKleber?: boolean
}

interface BottomNavProps {
  isKleber?: boolean
}

export function BottomNav({ isKleber = false }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems: NavItem[] = [
    { icon: Home, label: "Inicio", href: "/" },
    { icon: PiggyBank, label: "Caixinha", href: "/caixinha" },
    { icon: Plane, label: "Viagem", href: "/viagem" },
    { icon: Car, label: "Carro", href: "/carro", showForKleber: true },
    { icon: BarChart3, label: "Relatorios", href: "/relatorios" },
  ]

  const filteredItems = navItems.filter(item => {
    if (item.showForKleber && !isKleber) return false
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full px-2 transition-colors",
                "active:scale-95 transition-transform",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-all",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
