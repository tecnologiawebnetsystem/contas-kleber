"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Delete, Receipt, Wallet, CreditCard, TrendingUp, DollarSign, PiggyBank } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"

const USUARIOS = [
  { pin: "191018", nome: "Pamela Goncalves", tema: "rosa" as const },
  { pin: "080754", nome: "Kleber Goncalves", tema: "verde" as const },
]

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

    const usuario = USUARIOS.find((u) => u.pin === pin)

    if (usuario) {
      localStorage.setItem("auth", "true")
      localStorage.setItem("userData", JSON.stringify(usuario))

      if (usuario.tema === "rosa") {
        document.documentElement.classList.add("theme-rosa")
      } else {
        document.documentElement.classList.remove("theme-rosa")
      }

      toast({
        title: `Seja bem-vind${usuario.tema === "rosa" ? "a" : "o"}!`,
        description: usuario.nome,
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating financial icons background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] animate-float">
          <div className="bg-primary/5 p-6 rounded-2xl">
            <Receipt className="h-12 w-12 text-primary/30" />
          </div>
        </div>
        <div className="absolute top-[20%] right-[8%] animate-float-delayed">
          <div className="bg-[#1e3a5f]/10 p-6 rounded-2xl">
            <Wallet className="h-12 w-12 text-[#1e3a5f]/40 dark:text-[#3b82f6]/30" />
          </div>
        </div>
        <div className="absolute bottom-[25%] left-[10%] animate-float-slow">
          <div className="bg-accent/5 p-6 rounded-2xl">
            <CreditCard className="h-12 w-12 text-accent/30" />
          </div>
        </div>
        <div className="absolute bottom-[15%] right-[15%] animate-float">
          <div className="bg-primary/5 p-6 rounded-2xl">
            <TrendingUp className="h-12 w-12 text-primary/30" />
          </div>
        </div>
        <div className="absolute top-[50%] left-[15%] animate-float-delayed">
          <div className="bg-[#1e3a5f]/10 p-6 rounded-2xl">
            <DollarSign className="h-12 w-12 text-[#1e3a5f]/40 dark:text-[#3b82f6]/30" />
          </div>
        </div>
        <div className="absolute top-[60%] right-[20%] animate-float-slow">
          <div className="bg-accent/5 p-6 rounded-2xl">
            <PiggyBank className="h-12 w-12 text-accent/30" />
          </div>
        </div>
      </div>

      {/* Ambient glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1e3a5f]/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border border-border/50 relative z-10 bg-card/90 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center mb-2">
            <Logo variant="icon" size="xl" glow />
          </div>
          <CardTitle className="text-3xl font-heading font-bold text-gradient">
            Talent Money Family
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Gestao financeira familiar inteligente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          {/* PIN dots display */}
          <div className={`flex justify-center gap-3 mb-6 ${shake ? "animate-shake" : ""}`}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  i < pin.length
                    ? "bg-primary border-transparent scale-125 glow-red"
                    : "bg-muted border-muted-foreground/30"
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
                        className="h-16 text-xl font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 bg-card border-border transition-all hover:scale-105 active:scale-95"
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
                      className="h-16 text-2xl font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:scale-105 transition-all active:scale-95 bg-card border-border"
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
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              <span className="text-sm font-semibold">Verificando...</span>
            </div>
          )}

          <div className="pt-4 border-t border-border/50 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              Digite seu PIN de 6 digitos
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Acesso seguro e protegido</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
