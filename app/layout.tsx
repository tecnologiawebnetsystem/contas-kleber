import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google"

import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Contas - Talent Money Family",
  description: "Sistema completo para gerenciar suas contas fixas e parceladas",
  manifest: "/manifest.json",
  applicationName: "TalentMoney",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TalentMoney",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: [
      { url: "/apple-icon.jpg", sizes: "180x180", type: "image/jpeg" },
    ],
    shortcut: "/icon-192.jpg",
  },
  generator: "v0.app",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#ef4444",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />

        {/* PWA — Android / Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ef4444" />

        {/* PWA — iOS / Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TalentMoney" />

        {/* Ícone para iOS (add to home screen) */}
        <link rel="apple-touch-icon" href="/apple-icon.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.jpg" />

        {/* Ícone favicon */}
        <link rel="icon" type="image/jpeg" sizes="192x192" href="/icon-192.jpg" />
        <link rel="shortcut icon" href="/icon-192.jpg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const userData = localStorage.getItem('userData');
                  const theme = localStorage.getItem('theme') || 'dark';
                  
                  // Aplicar tema de usuario (rosa para Pamela)
                  if (userData) {
                    const user = JSON.parse(userData);
                    if (user.tema === 'rosa') {
                      document.documentElement.classList.add('theme-rosa');
                    }
                  }
                  
                  // Aplicar modo dark/light (dark e o padrao)
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                  // Se dark (padrao), a classe ja esta no html
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
