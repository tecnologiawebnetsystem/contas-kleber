import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Contas a Pagar - Financeiro Gonçalves",
  description: "Sistema completo para gerenciar suas contas fixas e parceladas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ContasKleber",
  },
  applicationName: "ContasKleber",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-192.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        url: "/icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
    apple: "/apple-icon.jpg",
  },
    generator: 'v0.app'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ContasKleber" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const userData = localStorage.getItem('userData');
                  const theme = localStorage.getItem('theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  
                  // Aplicar tema de usuário (rosa para Pamela, verde para Kleber)
                  if (userData) {
                    const user = JSON.parse(userData);
                    if (user.tema === 'rosa') {
                      document.documentElement.classList.add('theme-rosa');
                    } else if (user.tema === 'verde') {
                      // Tema verde já é o padrão, não precisa adicionar classe
                    }
                  }
                  
                  // Aplicar modo dark/light
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  console.error('[Theme] Erro ao aplicar tema:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
                    },
                    function(err) {
                      console.log('[SW] Falha ao registrar Service Worker:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
