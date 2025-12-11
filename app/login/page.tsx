"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const PIN_CORRETO = "191018"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simular um pequeno delay para melhor UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (pin === PIN_CORRETO) {
      // Salvar no localStorage que o usuário está autenticado
      localStorage.setItem("auth", "true")
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao sistema de contas.",
      })
      router.push("/")
    } else {
      toast({
        title: "PIN incorreto",
        description: "Por favor, verifique o PIN e tente novamente.",
        variant: "destructive",
      })
      setPin("")
    }

    setLoading(false)
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setPin(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Financeiro Gonçalves</CardTitle>
          <CardDescription className="text-base">Digite seu PIN de 6 dígitos para acessar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="password"
                inputMode="numeric"
                placeholder="000000"
                value={pin}
                onChange={handlePinChange}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-bold h-14"
                autoFocus
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground text-center">Apenas números de 0 a 9</p>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={pin.length !== 6 || loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verificando...
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground">Sistema de gerenciamento de contas</p>
            <p className="text-xs text-muted-foreground mt-1">Seguro e prático para seu dia a dia</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
