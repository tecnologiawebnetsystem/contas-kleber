// Página mostrada quando o usuário está offline

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <WifiOff className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="mt-6 text-3xl font-bold">Você está offline</h1>
        <p className="mt-2 text-muted-foreground">
          Não foi possível conectar à internet. Verifique sua conexão e tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Tentar Novamente</Link>
        </Button>
      </div>
    </div>
  )
}
