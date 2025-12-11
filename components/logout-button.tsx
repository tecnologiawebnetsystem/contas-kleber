"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = () => {
    localStorage.removeItem("auth")
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    })
    router.push("/login")
  }

  return (
    <Button onClick={handleLogout} variant="ghost" size="sm">
      <LogOut className="mr-2 h-4 w-4" />
      Sair
    </Button>
  )
}
