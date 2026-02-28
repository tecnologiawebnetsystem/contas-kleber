"use client"

import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OnlineStatusProps {
  userName?: string
}

export function OnlineStatus({ userName }: OnlineStatusProps) {
  const { isOnline, isSyncing, pendingCount, syncPendingOperations } = useOffline()

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Status Online/Offline */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-md ${
                isOnline
                  ? "text-emerald-500"
                  : "text-muted-foreground"
              }`}
            >
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline ? "Online" : "Offline"}
            {pendingCount > 0 && ` (${pendingCount} pendentes)`}
          </TooltipContent>
        </Tooltip>

        {/* Sync Button */}
        {isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={syncPendingOperations}
                disabled={isSyncing}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isSyncing ? "Sincronizando..." : "Sincronizar"}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
