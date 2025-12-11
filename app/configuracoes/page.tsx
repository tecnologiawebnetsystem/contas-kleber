"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Mail, Save, Send } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Configuracoes {
  emailDestino: string
  notificacoesAtivadas: boolean
  notificarVencimento: boolean
  notificarAtraso: boolean
}

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<Configuracoes>({
    emailDestino: "",
    notificacoesAtivadas: true,
    notificarVencimento: true,
    notificarAtraso: true,
  })
  const [enviando, setEnviando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfiguracao()
  }, [])

  const fetchConfiguracao = async () => {
    try {
      const response = await fetch("/api/configuracoes")
      if (!response.ok) throw new Error("Erro ao buscar configurações")
      const data = await response.json()

      if (data) {
        setConfig({
          emailDestino: data.email_destino,
          notificacoesAtivadas: data.notificacoes_ativadas,
          notificarVencimento: data.notificar_vencimento,
          notificarAtraso: data.notificar_atraso,
        })
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const salvarConfiguracoes = async () => {
    try {
      const response = await fetch("/api/configuracoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!response.ok) throw new Error("Erro ao salvar configurações")

      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("[v0] Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    }
  }

  const enviarEmailTeste = async () => {
    if (!config.emailDestino) {
      toast({
        title: "E-mail não configurado",
        description: "Por favor, informe o e-mail de destino.",
        variant: "destructive",
      })
      return
    }

    setEnviando(true)

    try {
      const response = await fetch("/api/verificar-contas", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        if (data.emailsEnviados.length > 0) {
          toast({
            title: "E-mails enviados com sucesso!",
            description: `${data.emailsEnviados.length} notificação(ões) enviada(s).`,
          })
        } else {
          toast({
            title: "Nenhuma notificação necessária",
            description: "Não há contas próximas do vencimento ou atrasadas no momento.",
          })
        }
      } else {
        toast({
          title: "Erro ao enviar e-mail",
          description: data.error || "Verifique se a API Key do Resend está configurada.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar e-mail",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Configurações</h1>
              <p className="text-muted-foreground mt-1">Configure notificações e e-mails</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notificações por E-mail
              </CardTitle>
              <CardDescription>Configure o envio automático de alertas sobre suas contas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail de Destino</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={config.emailDestino}
                  onChange={(e) => setConfig({ ...config, emailDestino: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Informe o e-mail que receberá as notificações de vencimento e atraso
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar Notificações</Label>
                  <p className="text-sm text-muted-foreground">Receber e-mails automáticos</p>
                </div>
                <Switch
                  checked={config.notificacoesAtivadas}
                  onCheckedChange={(checked) => setConfig({ ...config, notificacoesAtivadas: checked })}
                />
              </div>

              {config.notificacoesAtivadas && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contas Próximas do Vencimento</Label>
                      <p className="text-sm text-muted-foreground">Alertas 3 dias antes do vencimento</p>
                    </div>
                    <Switch
                      checked={config.notificarVencimento}
                      onCheckedChange={(checked) => setConfig({ ...config, notificarVencimento: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contas Atrasadas</Label>
                      <p className="text-sm text-muted-foreground">Alertas de contas vencidas</p>
                    </div>
                    <Switch
                      checked={config.notificarAtraso}
                      onCheckedChange={(checked) => setConfig({ ...config, notificarAtraso: checked })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={salvarConfiguracoes} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
                <Button onClick={enviarEmailTeste} variant="outline" disabled={enviando}>
                  <Send className="mr-2 h-4 w-4" />
                  {enviando ? "Enviando..." : "Testar Agora"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Como Configurar o Resend API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <h3 className="font-semibold mb-2">1. Criar conta no Resend</h3>
                <p>
                  Acesse{" "}
                  <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">
                    resend.com
                  </a>{" "}
                  e crie uma conta gratuita
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Obter API Key</h3>
                <p>No dashboard do Resend, vá em API Keys e crie uma nova chave</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Configurar Variável de Ambiente</h3>
                <p>
                  Na barra lateral esquerda desta página, clique em <strong>Vars</strong> e adicione:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">RESEND_API_KEY</code> = sua chave API
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Configurar Envio Automático (Opcional)</h3>
                <p>Para envios automáticos diários, configure um Cron Job na Vercel:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Acesse o projeto na Vercel</li>
                  <li>Vá em Settings → Cron Jobs</li>
                  <li>
                    Adicione: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">0 8 * * *</code> (todo dia às
                    8h)
                  </li>
                  <li>
                    URL: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/verificar-contas</code>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <p className="font-semibold">Teste o envio usando o botão "Testar Agora" acima!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
