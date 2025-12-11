"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Delete } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const PIN_CORRETO = "191018"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (pin.length === 6) {
      handleAutoLogin()
    }
  }, [pin])

  const handleAutoLogin = async () => {
    setLoading(true)

    // Simular um pequeno delay para melhor UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (pin === PIN_CORRETO) {
      // Salvar no localStorage que o usuário está autenticado
      localStorage.setItem("auth", "true")
      toast({
        title: "Bem-vindo!",
        description: "Acesso liberado ao sistema.",
      })
      router.push("/")
    } else {
      // Animação de erro
      setShake(true)
      setTimeout(() => setShake(false), 500)

      toast({
        title: "PIN incorreto",
        description: "Tente novamente.",
        variant: "destructive",
      })
      setPin("")
    }

    setLoading(false)
  }

  const handleNumberClick = (num: string) => {
    if (pin.length < 6 && !loading) {
      setPin((prev) => prev + num)
    }
  }

  const handleBackspace = () => {
    if (!loading) {
      setPin((prev) => prev.slice(0, -1))
    }
  }

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "backspace"],
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Financeiro Gonçalves
          </CardTitle>
          <CardDescription className="text-base">Digite seu PIN de 6 dígitos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className={`flex justify-center gap-3 mb-6 ${shake ? "animate-shake" : ""}`}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length ? "bg-primary border-primary scale-110" : "bg-background border-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <div className="grid gap-3">
            {numbers.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-3">
                {row.map((num, colIndex) => {
                  if (num === "") {
                    return <div key={colIndex} />
                  }

                  if (num === "backspace") {
                    return (
                      <Button
                        key={colIndex}
                        variant="outline"
                        size="lg"
                        onClick={handleBackspace}
                        disabled={loading || pin.length === 0}
                        className="h-16 text-xl font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 bg-transparent"
                      >
                        <Delete className="h-6 w-6" />
                      </Button>
                    )
                  }

                  return (
                    <Button
                      key={colIndex}
                      variant="outline"
                      size="lg"
                      onClick={() => handleNumberClick(num)}
                      disabled={loading}
                      className="h-16 text-2xl font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:scale-105 transition-all active:scale-95"
                    >
                      {num}
                    </Button>
                  )
                })}
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-primary pt-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">Verificando...</span>
            </div>
          )}

          <div className="pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">Sistema de gerenciamento financeiro</p>
            <p className="text-xs text-muted-foreground mt-1">Seguro e prático para seu dia a dia</p>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}
