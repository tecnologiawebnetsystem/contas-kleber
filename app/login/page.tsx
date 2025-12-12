"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Delete, TrendingUp, DollarSign, PiggyBank, Wallet } from "lucide-react"
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

    await new Promise((resolve) => setTimeout(resolve, 300))

    if (pin === PIN_CORRETO) {
      localStorage.setItem("auth", "true")
      toast({
        title: "Bem-vindo!",
        description: "Acesso liberado ao sistema.",
      })
      router.push("/")
    } else {
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-violet-50 dark:from-gray-900 dark:via-emerald-950 dark:to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <DollarSign className="absolute top-20 left-10 w-16 h-16 text-emerald-600 animate-float" />
        <TrendingUp className="absolute top-32 right-20 w-20 h-20 text-blue-600 animate-float-delayed" />
        <PiggyBank className="absolute bottom-24 left-1/4 w-24 h-24 text-violet-600 animate-float" />
        <Wallet className="absolute bottom-32 right-1/4 w-20 h-20 text-emerald-600 animate-float-delayed" />
      </div>

      <Card className="w-full max-w-sm shadow-2xl border-2 border-emerald-200/50 dark:border-emerald-800/50 relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto bg-gradient-to-br from-emerald-500 via-blue-500 to-violet-500 w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-violet-600 dark:from-emerald-400 dark:via-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
            Financeiro Gonçalves
          </CardTitle>
          <CardDescription className="text-sm">Digite seu PIN de 6 dígitos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`flex justify-center gap-2 mb-4 ${shake ? "animate-shake" : ""}`}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 border-transparent scale-110 shadow-md"
                    : "bg-background border-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <div className="grid gap-2">
            {numbers.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2">
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
                        className="h-14 text-xl font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400 bg-transparent transition-all"
                      >
                        <Delete className="h-5 w-5" />
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
                      className="h-14 text-xl font-semibold hover:bg-gradient-to-br hover:from-emerald-50 hover:to-blue-50 hover:text-blue-700 hover:border-blue-400 dark:hover:from-emerald-950 dark:hover:to-blue-950 dark:hover:text-blue-300 hover:scale-105 transition-all active:scale-95 shadow-sm"
                    >
                      {num}
                    </Button>
                  )
                })}
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 pt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="text-sm font-medium">Verificando...</span>
            </div>
          )}

          <div className="pt-3 border-t text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Controle</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium">Organização</span>
              </div>
              <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                <PiggyBank className="h-4 w-4" />
                <span className="text-xs font-medium">Economia</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Gestão financeira inteligente</p>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
