import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "PillMind - Приймати ліки стало простіше",
  description:
    "PillMind нагадує про прийом, аналізує ваші дані та підказує безпечні комбінації. З вашим дозволом — і лише для вас.",
  keywords: "ліки, нагадування, здоров'я, медицина, додаток",
  openGraph: {
    title: "PillMind - Приймати ліки стало простіше",
    description: "PillMind нагадує про прийом, аналізує ваші дані та підказує безпечні комбінації.",
    type: "website",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
