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
  title: "PillMind - Taking medicine has become easier",
  description:
    "PillMind reminds you about your intake, analyzes your data, and suggests safe combinations. With your permission — and only for you.",
  keywords: "medicine, reminders, health, medicine, app",
  openGraph: {
    title: "PillMind - Taking medicine has become easier",
    description: "PillMind reminds you about your intake, analyzes your data, and suggests safe combinations.",
    type: "website",
  },
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
