"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Wallet, 
  PiggyBank, 
  Plane, 
  Car, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Bell,
  ArrowRight,
  Check,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const features = [
    {
      icon: Wallet,
      title: "Controle Total",
      description: "Gerencie contas fixas, parceladas e gastos diarios em um so lugar."
    },
    {
      icon: PiggyBank,
      title: "Poupanca Inteligente",
      description: "Acompanhe suas economias e metas financeiras com facilidade."
    },
    {
      icon: Plane,
      title: "Fundo de Viagem",
      description: "Planeje suas proximas aventuras com controle financeiro dedicado."
    },
    {
      icon: Car,
      title: "Gestao de Veiculos",
      description: "Controle pagamentos e custos do seu veiculo separadamente."
    },
    {
      icon: BarChart3,
      title: "Relatorios Detalhados",
      description: "Visualize graficos e insights sobre seus gastos mensais."
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      description: "Receba notificacoes de contas proximas ao vencimento."
    }
  ]

  const benefits = [
    "Acesso rapido com PIN de 6 digitos",
    "Funciona offline - seus dados sempre disponiveis",
    "Compartilhe resumos via WhatsApp",
    "Tema personalizado por usuario",
    "100% gratuito para uso familiar"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Financeiro Goncalves</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              Entrar
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Controle financeiro familiar simplificado
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight text-balance">
            Suas financas em ordem,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              sua familia tranquila.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto text-pretty">
            O app completo para gerenciar as financas da sua familia. 
            Controle contas, poupanca, viagens e muito mais em um unico lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-12 text-base">
                Comecar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 h-12 text-base"
              onClick={() => {
                const featuresSection = document.getElementById('features')
                featuresSection?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Ver funcionalidades
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-slate-400">Gratuito</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">Offline</div>
              <div className="text-sm text-slate-400">Sempre disponivel</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">Seguro</div>
              <div className="text-sm text-slate-400">Dados protegidos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">PWA</div>
              <div className="text-sm text-slate-400">Instale no celular</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tudo que voce precisa
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Funcionalidades pensadas para facilitar o controle financeiro da sua familia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-colors group"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-colors">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Por que escolher o Financeiro Goncalves?
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-3xl" />
              <Card className="relative bg-slate-800 border-slate-700 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600" />
                    <div>
                      <div className="font-medium text-white">Usuario Exemplo</div>
                      <div className="text-sm text-slate-400">Familia Goncalves</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50">
                      <span className="text-slate-400 text-sm">Total do Mes</span>
                      <span className="font-semibold text-white">R$ 3.450,00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10">
                      <span className="text-emerald-400 text-sm">Ja Pago</span>
                      <span className="font-semibold text-emerald-400">R$ 2.100,00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/10">
                      <span className="text-amber-400 text-sm">Pendente</span>
                      <span className="font-semibold text-amber-400">R$ 1.350,00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-cyan-500/10 border border-slate-700">
            <Smartphone className="h-12 w-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Instale como App
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Adicione o Financeiro Goncalves na tela inicial do seu celular 
              para acesso rapido e use mesmo sem internet.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                Acessar o App
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">Financeiro Goncalves</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield className="h-4 w-4" />
              <span>Seus dados estao seguros</span>
            </div>
            <div className="text-sm text-slate-500">
              Feito com carinho para a familia
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
