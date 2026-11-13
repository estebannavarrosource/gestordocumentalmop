import type { Metadata } from 'next'
import { V3App } from '@/components/sim/v3-app'

export const metadata: Metadata = {
  title: 'Gestor Ministerial v3 · simulación de la arquitectura propuesta',
  description: 'Simulación interactiva de la arquitectura propuesta: un único Gestor, MongoDB, Object Storage y workers asíncronos.',
}

export default function Page() {
  return <V3App />
}
