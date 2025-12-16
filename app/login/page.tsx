"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Delete } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const USUARIOS = [
  { pin: "191018", nome: "Pamela Gonçalves", tema: "rosa" as const },
  { pin: "080754", nome: "Kleber Gonçalves", tema: "verde" as const },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-900 dark:via-slate-900 dark:to-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl border-2 border-gray-200/50 dark:border-gray-800/50 relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
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
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 border-transparent scale-110 shadow-md"
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
                      className="h-14 text-xl font-semibold hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:text-indigo-700 hover:border-indigo-400 dark:hover:from-blue-950 dark:hover:to-indigo-950 dark:hover:text-indigo-300 hover:scale-105 transition-all active:scale-95 shadow-sm"
                    >
                      {num}
                    </Button>
                  )
                })}
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 pt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              <span className="text-sm font-medium">Verificando...</span>
            </div>
          )}

          <div className="pt-3 border-t text-center">
            <p className="text-sm text-muted-foreground">Gestão financeira familiar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
