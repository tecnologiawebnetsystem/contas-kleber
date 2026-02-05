"use client"

import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { Button } from "@/components/ui/button"

interface OnlineStatusProps {
  userName?: string
}

export function OnlineStatus({ userName }: OnlineStatusProps) {
  const { isOnline, isSyncing, pendingCount, syncPendingOperations } = useOffline()

  return (
    <div className="flex items-center gap-2">
      {/* Status Online/Offline */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          isOnline
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>
          {isOnline ? "Online" : "Offline"}
          {pendingCount > 0 && ` (${pendingCount})`}
        </span>
      </div>

      {/* Sync Button */}
      {isOnline && (
        <Button
          onClick={syncPendingOperations}
          disabled={isSyncing}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </Button>
      )}
    </div>
  )
}
