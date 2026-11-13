import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono-sim' })

export const metadata: Metadata = {
  title: '¿Qué ocurre dentro del expediente electrónico? | Simulación SDIT',
  description:
    'Simulación animada de la arquitectura propuesta para el Sistema Ministerial de Expedientes Electrónicos (SME) del MOP: dependencias, estados intermedios y coordinación entre sistemas independientes.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#102a4c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
