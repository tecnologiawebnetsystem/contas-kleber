# ContasKleber - Sistema de Contas a Pagar

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/kleberlinux-8687s-projects/v0-contas-kleber)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/rAADARyPveP)

## Sistema de Gerenciamento Financeiro

Progressive Web App (PWA) completo para gerenciar contas fixas, parceladas, caixinha de economia e crédito disponível. Otimizado para tablets Android com funcionamento offline.

## Funcionalidades

- Gerenciamento de contas fixas e parceladas
- Caixinha de economia com sistema de metas
- Controle de crédito disponível
- Histórico completo de transações
- Alertas de contas próximas ao vencimento
- Notificações automáticas por e-mail
- Compartilhamento via WhatsApp com API integrada
- Funciona 100% offline após instalação
- Interface otimizada para tablets

## Instalação no Tablet Android

1. Acesse o app no Chrome do tablet
2. Aguarde o banner de instalação aparecer
3. Clique em "Instalar Agora"
4. O app será adicionado à tela inicial

Documentação completa: [`docs/instalar-pwa-tablet.md`](docs/instalar-pwa-tablet.md)

## Configuração

### Variáveis de Ambiente Necessárias

**WhatsApp API (APIBrasil)**
- `WHATSAPP_API_TOKEN` - Token de autenticação
- `WHATSAPP_DEVICE_TOKEN` - Token do dispositivo

**Resend (Notificações por E-mail)**
- `RESEND_API_KEY` - Chave da API Resend

**Supabase (Banco de Dados)**
- Configuradas automaticamente pela integração

Guia completo: [`docs/configurar-vercel-pwa.md`](docs/configurar-vercel-pwa.md)

## Tecnologias

- **Next.js 16** com App Router e React 19
- **Supabase** para banco de dados PostgreSQL
- **Tailwind CSS v4** para estilização
- **shadcn/ui** para componentes
- **Resend** para envio de e-mails
- **APIBrasil** para integração WhatsApp
- **PWA** com service workers para offline

## Deploy

Your project is live at:

**[https://vercel.com/kleberlinux-8687s-projects/v0-contas-kleber](https://vercel.com/kleberlinux-8687s-projects/v0-contas-kleber)**

## Desenvolvimento

Continue building your app on:

**[https://v0.app/chat/rAADARyPveP](https://v0.app/chat/rAADARyPveP)**

## Estrutura do Projeto

```
├── app/                    # Páginas Next.js (App Router)
│   ├── api/               # API Routes
│   ├── caixinha/          # Página da caixinha
│   ├── configuracoes/     # Configurações do sistema
│   ├── consulta/          # Consulta de histórico
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   └── *.tsx             # Componentes customizados
├── docs/                 # Documentação
│   ├── configurar-vercel-pwa.md
│   ├── instalar-pwa-tablet.md
│   └── configurar-cron-vercel.md
├── lib/                  # Utilitários e helpers
├── public/              # Assets estáticos
│   ├── manifest.json    # Manifest PWA
│   └── icon-*.png       # Ícones do app
└── scripts/             # Scripts SQL

```

## Como Funciona

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Suporte

Para dúvidas ou problemas, consulte a documentação em `/docs` ou abra uma issue.
