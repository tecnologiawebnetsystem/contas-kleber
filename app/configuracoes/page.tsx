"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Mail, Save, Send, MessageCircle, Plus, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Configuracoes {
  emailDestino: string
  notificacoesAtivadas: boolean
  notificarVencimento: boolean
  notificarAtraso: boolean
  whatsappAtivado: boolean
  whatsappNumeros: string[]
  notificarVencimentoWhatsapp: boolean
  notificarAtrasoWhatsapp: boolean
  whatsappMensagemTemplate: string
}

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<Configuracoes>({
    emailDestino: "",
    notificacoesAtivadas: true,
    notificarVencimento: true,
    notificarAtraso: true,
    whatsappAtivado: false,
    whatsappNumeros: [],
    notificarVencimentoWhatsapp: true,
    notificarAtrasoWhatsapp: true,
    whatsappMensagemTemplate: "🔔 *Alerta de Contas - Financeiro Gonçalves*\n\n",
  })
  const [novoNumero, setNovoNumero] = useState("")
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false)
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
          emailDestino: data.email_destino || "",
          notificacoesAtivadas: data.notificacoes_ativadas ?? true,
          notificarVencimento: data.notificar_vencimento ?? true,
          notificarAtraso: data.notificar_atraso ?? true,
          whatsappAtivado: data.whatsapp_ativado ?? false,
          whatsappNumeros: data.whatsapp_numeros || [],
          notificarVencimentoWhatsapp: data.notificar_vencimento_whatsapp ?? true,
          notificarAtrasoWhatsapp: data.notificar_atraso_whatsapp ?? true,
          whatsappMensagemTemplate:
            data.whatsapp_mensagem_template || "🔔 *Alerta de Contas - Financeiro Gonçalves*\n\n",
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
      console.log("[v0] Salvando configurações:", config)
      const response = await fetch("/api/configuracoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_destino: config.emailDestino,
          notificacoes_ativadas: config.notificacoesAtivadas,
          notificar_vencimento: config.notificarVencimento,
          notificar_atraso: config.notificarAtraso,
          whatsapp_ativado: config.whatsappAtivado,
          whatsapp_numeros: config.whatsappNumeros,
          notificar_vencimento_whatsapp: config.notificarVencimentoWhatsapp,
          notificar_atraso_whatsapp: config.notificarAtrasoWhatsapp,
          whatsapp_mensagem_template: config.whatsappMensagemTemplate,
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Erro na resposta:", errorData)
        throw new Error("Erro ao salvar configurações")
      }

      const result = await response.json()
      console.log("[v0] Configurações salvas com sucesso:", result)

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

  const adicionarNumero = () => {
    if (!novoNumero) return

    // Validar formato +5511999999999
    const numeroLimpo = novoNumero.replace(/\D/g, "")
    if (numeroLimpo.length < 12 || numeroLimpo.length > 13) {
      toast({
        title: "Número inválido",
        description: "Use o formato +5511999999999 (com código do país e DDD)",
        variant: "destructive",
      })
      return
    }

    const numeroFormatado = `+${numeroLimpo}`
    if (config.whatsappNumeros.includes(numeroFormatado)) {
      toast({
        title: "Número já adicionado",
        description: "Este número já está na lista",
        variant: "destructive",
      })
      return
    }

    setConfig({ ...config, whatsappNumeros: [...config.whatsappNumeros, numeroFormatado] })
    setNovoNumero("")
  }

  const removerNumero = (numero: string) => {
    setConfig({ ...config, whatsappNumeros: config.whatsappNumeros.filter((n) => n !== numero) })
  }

  const enviarEmailTeste = async () => {
    try {
      setEnviandoEmail(true)
      const response = await fetch("/api/verificar-contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceTest: true }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "E-mail de teste enviado!",
          description: `Verifique sua caixa de entrada em ${config.emailDestino}`,
        })
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
      setEnviandoEmail(false)
    }
  }

  const enviarWhatsappTeste = async () => {
    if (config.whatsappNumeros.length === 0) {
      toast({
        title: "Números não configurados",
        description: "Adicione pelo menos um número de WhatsApp.",
        variant: "destructive",
      })
      return
    }

    setEnviandoWhatsapp(true)

    try {
      const response = await fetch("/api/whatsapp/verificar", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        if (data.mensagensEnviadas > 0) {
          toast({
            title: "WhatsApp enviado com sucesso!",
            description: `${data.mensagensEnviadas} mensagem(ns) enviada(s).`,
          })
        } else {
          toast({
            title: "Nenhuma notificação necessária",
            description: data.message || "Não há contas próximas do vencimento ou atrasadas.",
          })
        }
      } else {
        toast({
          title: "Erro ao enviar WhatsApp",
          description: data.error || "Verifique as configurações do Twilio.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar WhatsApp",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setEnviandoWhatsapp(false)
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
              <p className="text-muted-foreground mt-1">Configure notificações por e-mail e WhatsApp</p>
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
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="text-amber-600 dark:text-amber-400 text-xl">⚠️</div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                      Limitação do Plano Gratuito do Resend
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      No plano gratuito, você só pode enviar e-mails para o endereço cadastrado na sua conta Resend (
                      <strong>tecnologiawebnetsystem@gmail.com</strong>).
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Para enviar para outros e-mails, você precisa:
                    </p>
                    <ul className="text-xs text-amber-800 dark:text-amber-200 list-disc list-inside ml-2 space-y-1">
                      <li>
                        Verificar um domínio em{" "}
                        <a
                          href="https://resend.com/domains"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-semibold"
                        >
                          resend.com/domains
                        </a>
                      </li>
                      <li>Usar um e-mail desse domínio no campo "E-mail de Destino" abaixo</li>
                    </ul>
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold mt-2">
                      💡 Dica: Para testes, use tecnologiawebnetsystem@gmail.com como destinatário.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail de Destino</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tecnologiawebnetsystem@gmail.com"
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
                <Button onClick={enviarEmailTeste} variant="outline" disabled={enviandoEmail}>
                  <Send className="mr-2 h-4 w-4" />
                  {enviandoEmail ? "Enviando..." : "Testar Agora"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Notificações por WhatsApp
              </CardTitle>
              <CardDescription>Receba alertas automáticos no WhatsApp via Twilio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">Receber notificações automáticas no WhatsApp</p>
                </div>
                <Switch
                  checked={config.whatsappAtivado}
                  onCheckedChange={(checked) => setConfig({ ...config, whatsappAtivado: checked })}
                />
              </div>

              {config.whatsappAtivado && (
                <>
                  <div className="space-y-2">
                    <Label>Números de WhatsApp</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Adicione até 2 números que receberão as notificações (formato: +5511999999999)
                    </p>

                    <div className="flex gap-2">
                      <Input
                        placeholder="+5511999999999"
                        value={novoNumero}
                        onChange={(e) => setNovoNumero(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && adicionarNumero()}
                        disabled={config.whatsappNumeros.length >= 2}
                      />
                      <Button onClick={adicionarNumero} disabled={config.whatsappNumeros.length >= 2} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {config.whatsappNumeros.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {config.whatsappNumeros.map((numero) => (
                          <div key={numero} className="flex items-center justify-between bg-muted p-3 rounded-md">
                            <span className="font-mono">{numero}</span>
                            <Button variant="ghost" size="sm" onClick={() => removerNumero(numero)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contas Próximas do Vencimento</Label>
                      <p className="text-sm text-muted-foreground">Alertas 3 dias antes do vencimento</p>
                    </div>
                    <Switch
                      checked={config.notificarVencimentoWhatsapp}
                      onCheckedChange={(checked) => setConfig({ ...config, notificarVencimentoWhatsapp: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contas Atrasadas</Label>
                      <p className="text-sm text-muted-foreground">Alertas de contas vencidas</p>
                    </div>
                    <Switch
                      checked={config.notificarAtrasoWhatsapp}
                      onCheckedChange={(checked) => setConfig({ ...config, notificarAtrasoWhatsapp: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem Personalizada</Label>
                    <Textarea
                      placeholder="Digite a mensagem que será enviada..."
                      value={config.whatsappMensagemTemplate}
                      onChange={(e) => setConfig({ ...config, whatsappMensagemTemplate: e.target.value })}
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Esta é a mensagem inicial. As contas serão adicionadas automaticamente após este texto.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={salvarConfiguracoes} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </Button>
                    <Button onClick={enviarWhatsappTeste} variant="outline" disabled={enviandoWhatsapp}>
                      <Send className="mr-2 h-4 w-4" />
                      {enviandoWhatsapp ? "Enviando..." : "Testar WhatsApp"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
