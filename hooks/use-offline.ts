"use client"

// Hook para detectar status online/offline e sincronizar

import { useState, useEffect } from "react"
import { offlineStorage } from "@/lib/offline/storage"
import { useToast } from "@/hooks/use-toast"

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Inicializar IndexedDB
    offlineStorage.init()

    // Detectar status online/offline
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)

      if (online && !isOnline) {
        toast({
          title: "Conectado",
          description: "Sincronizando dados...",
        })
        syncPendingOperations()
      } else if (!online) {
        toast({
          title: "Offline",
          description: "Trabalhando no modo offline. Dados serão sincronizados quando voltar online.",
          variant: "destructive",
        })
      }
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    updateOnlineStatus()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  // Sincronizar operações pendentes
  const syncPendingOperations = async () => {
    try {
      setIsSyncing(true)
      const operations = await offlineStorage.getPendingOperations()
      setPendingCount(operations.length)

      console.log("[v0] Sincronizando operações pendentes:", operations.length)

      for (const operation of operations) {
        try {
          // Executar operação no servidor
          await executeOperation(operation)

          // Remover da fila
          await offlineStorage.removePendingOperation(operation.id)
        } catch (error) {
          console.error("[v0] Erro ao sincronizar operação:", error)
        }
      }

      toast({
        title: "Sincronizado",
        description: "Todos os dados foram sincronizados com sucesso.",
      })

      setPendingCount(0)
    } catch (error) {
      console.error("[v0] Erro ao sincronizar:", error)
      toast({
        title: "Erro na sincronização",
        description: "Alguns dados não foram sincronizados. Tentaremos novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Executar operação no servidor
  const executeOperation = async (operation: any) => {
    const { type, table, data } = operation

    switch (type) {
      case "insert":
        await fetch(`/api/${table}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        break

      case "update":
        await fetch(`/api/${table}/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        break

      case "delete":
        await fetch(`/api/${table}/${data.id}`, {
          method: "DELETE",
        })
        break
    }
  }

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingOperations,
  }
}
