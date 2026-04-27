import type { Metadata } from "next"
import { DM_Sans, DM_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Nav } from "@/components/nav"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Cantina Escolar",
  description: "Sistema de controle de contas da cantina",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${dmSans.variable} ${dmMono.variable} font-sans`}>
        <Providers>
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
