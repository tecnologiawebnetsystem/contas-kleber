"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Undo } from "lucide-react"

interface UndoToastProps {
  message: string
  onUndo: () => void
  duration?: number
}

export function UndoToast({ message, onUndo, duration = 5000 }: UndoToastProps) {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 100)
        if (newProgress <= 0) {
          setVisible(false)
          return 0
        }
        return newProgress
      })
    }, 100)

    const timeout = setTimeout(() => {
      setVisible(false)
    }, duration)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [duration])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in">
      <div className="bg-card border shadow-lg rounded-lg p-4 flex items-center gap-4 min-w-[300px]">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            onUndo()
            setVisible(false)
          }}
          className="gap-2"
        >
          <Undo className="h-4 w-4" />
          Desfazer
        </Button>
      </div>
    </div>
  )
}
