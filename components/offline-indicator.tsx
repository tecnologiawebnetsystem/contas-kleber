// Indicador visual de status offline/online

"use client"

import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { cn } from "@/lib/utils"

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount } = useOffline()

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null // Não mostra nada quando está tudo OK
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg",
        isOnline ? "bg-blue-500 text-white" : "bg-red-500 text-white",
      )}
    >
      {isSyncing ? (
        <>
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Sincronizando... ({pendingCount})</span>
        </>
      ) : isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span className="text-sm font-medium">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <span className="text-sm font-medium">Offline {pendingCount > 0 && `(${pendingCount} pendentes)`}</span>
        </>
      )}
    </div>
  )
}
