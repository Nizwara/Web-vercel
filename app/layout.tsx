import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeDebugger } from "@/components/theme-debugger"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Inconigto-MODE | VPN Tunnel | CloudFlare",
  description: "VPN Configuration Generator",
  icons: {
    icon: "https://raw.githubusercontent.com/AFRcloud/BG/main/icons8-film-noir-80.png",
    apple: "https://raw.githubusercontent.com/AFRcloud/BG/main/icons8-film-noir-80.png",
  },
  openGraph: {
    title: "Inconigto-MODE | VPN Tunnel | CloudFlare",
    description: "VPN Configuration Generator",
    images: [
      {
        url: "https://raw.githubusercontent.com/akulelaki696/bg/refs/heads/main/20250106_010158.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
      },
    ],
  },
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          rel="icon"
          href="https://raw.githubusercontent.com/AFRcloud/BG/main/icons8-film-noir-80.png"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="https://raw.githubusercontent.com/AFRcloud/BG/main/icons8-film-noir-80.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:image:secure_url"
          content="https://raw.githubusercontent.com/akulelaki696/bg/refs/heads/main/20250106_010158.jpg"
        />
        <meta property="og:audio" content="URL-to-audio-if-any" />
        <meta property="og:video" content="URL-to-video-if-any" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f8f9fa" media="(prefers-color-scheme: light)" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <ThemeDebugger />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'