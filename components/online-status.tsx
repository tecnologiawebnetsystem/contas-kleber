"use client"

import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { Button } from "@/components/ui/button"

interface OnlineStatusProps {
  userName?: string
}

export function OnlineStatus({ userName }: OnlineStatusProps) {
  const { isOnline, isSyncing, pendingCount, syncPendingOperations } = useOffline()

  // Cores baseadas no usuário
  const isKleber = userName === "Kleber Gonçalves"
  const isPamela = userName === "Pamela Gonçalves"

  return (
    <div className="flex items-center gap-2">
      {/* Status Online/Offline */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isOnline
            ? isKleber
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : isPamela
                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
        }`}
      >
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isOnline ? "Online" : "Offline"}
          {pendingCount > 0 && ` (${pendingCount})`}
        </span>
      </div>

      {/* Botão Sincronizar */}
      {isOnline && (
        <Button
          onClick={syncPendingOperations}
          disabled={isSyncing}
          size="sm"
          className={
            isKleber
              ? "bg-green-600 hover:bg-green-700 text-white"
              : isPamela
                ? "bg-pink-500 hover:bg-pink-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </Button>
      )}
    </div>
  )
}
