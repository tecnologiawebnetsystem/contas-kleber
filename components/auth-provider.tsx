"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const auth = localStorage.getItem("auth")

    if (pathname === "/login") {
      // Se já está autenticado e tenta acessar login, redireciona para home
      if (auth === "true") {
        router.push("/")
      } else {
        setIsAuthenticated(false)
      }
    } else {
      // Para qualquer outra rota, verificar autenticação
      if (auth !== "true") {
        router.push("/login")
      } else {
        setIsAuthenticated(true)
      }
    }
  }, [pathname, router])

  // Mostrar loading enquanto verifica autenticação
  if (isAuthenticated === null && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
