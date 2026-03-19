"use client"

import type React from "react"
import { useEffect, useState, createContext, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"

type User = {
  id?: number
  nome: string
  pin?: string
  perfil: number  // 1 = acesso total, 2 = consulta
  tema: "verde" | "rosa" | string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  logout: () => void // Added logout function to type
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: () => {}, // Added default logout function
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem("auth")
    const userDataString = localStorage.getItem("userData")

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString)
        if (userData.tema === "rosa") {
          document.documentElement.classList.add("theme-rosa")
        } else {
          document.documentElement.classList.remove("theme-rosa")
        }
      } catch (e) {
        console.error("[v0] Erro ao aplicar tema:", e)
      }
    }

    if (pathname === "/login") {
      if (auth === "true" && userDataString) {
        router.push("/")
      } else {
        setIsAuthenticated(false)
      }
    } else {
      if (auth !== "true" || !userDataString) {
        router.push("/login")
      } else {
        const userData = JSON.parse(userDataString)
        setUser(userData)
        setIsAuthenticated(true)
      }
    }
  }, [pathname, router])

  const logout = () => {
    localStorage.removeItem("auth")
    localStorage.removeItem("userData")
    document.documentElement.classList.remove("theme-rosa")
    setUser(null)
    setIsAuthenticated(false)
  }

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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: isAuthenticated === true, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
