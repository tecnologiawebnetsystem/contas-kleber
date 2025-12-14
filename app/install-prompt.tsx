"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Mostrar prompt apenas se não foi instalado e não foi fechado antes
      const promptClosed = localStorage.getItem("installPromptClosed")
      if (!promptClosed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("[v0] App instalado com sucesso")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
    localStorage.setItem("installPromptClosed", "true")
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Download className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Instalar ContasKleber</h3>
            <p className="text-sm text-white/90 mb-3">Instale o app no seu tablet para acesso rápido e uso offline!</p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="bg-white text-emerald-600 hover:bg-white/90">
                Instalar Agora
              </Button>
              <Button onClick={handleClose} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                Agora Não
              </Button>
            </div>
          </div>
          <Button onClick={handleClose} size="icon" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
