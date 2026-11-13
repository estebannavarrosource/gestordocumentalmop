export type Status = 'idle' | 'running' | 'ok' | 'pending' | 'error'
export type Tone = Status | 'info'
export type Outcome = 'ok' | 'error' | 'pending' | 'lost'

export type NodeKind = 'group' | 'chip' | 'card'

export interface NodeDef {
  id: string
  kind: NodeKind
  x: number
  y: number
  w: number
  h: number
  label: string
  sub?: string
  icon?: string
  dashed?: boolean
  /** servicio independiente de la arquitectura (para "puntos de falla") */
  independent?: boolean
  /** muestra puntos / pila proporcionales al volumen documental */
  dense?: boolean
  /** texto de partes internas (tarjeta de expediente) */
  parts?: string[]
  enter?: { at: number; dur: number; fromX?: number; fromY?: number; fromScale?: number }
  exit?: { at: number; dur: number }
  /** nodo pequeño (tipografía reducida) */
  small?: boolean
  /** estilo de énfasis */
  emphasis?: 'navy' | 'azure'
  /** variante compacta (tipografía e iconos reducidos) */
  compact?: boolean
}

export interface LinkDef {
  from: string
  to: string
  at?: number
  independent?: boolean
  label?: string
  faint?: boolean
  /** curvatura de la conexión (fracción de la distancia); sustituye la curvatura por defecto */
  bend?: number
}

export interface Op {
  from: string
  to: string
  start: number
  dur: number
  label?: string
  outcome: Outcome
  /** espera tras la llegada (indicador de espera sobre la conexión) */
  hold?: number
  holdLabel?: string
  event?: string
  coord?: boolean
  final?: boolean
  big?: boolean
  /** etiqueta de conteo para indicadores derivados */
  tag?: string
}

export interface NodeEvent {
  at: number
  node: string
  status: Status
  /** undefined mantiene la insignia previa; null la elimina */
  badge?: string | null
}

export interface StepDef {
  at: number
  n: number
  status: Status
}

export interface Caption {
  at: number
  text: string
  tone?: Tone
}

export interface Banner {
  at: number
  until: number
  text: string
  tone?: Tone
}

export interface TimelineEvent {
  at: number
  level: number
}

export interface Script {
  id: string
  duration: number
  loop?: number
  stage: { w: number; h: number }
  nodes: NodeDef[]
  links: LinkDef[]
  ops: Op[]
  events: NodeEvent[]
  steps?: { labels: string[]; events: StepDef[] }
  captions: Caption[]
  banners: Banner[]
  bannerPos?: { x: number; y: number; w: number }
  volume: TimelineEvent[]
  activity: TimelineEvent[]
  overlay?: 'steps' | 'growth' | 'history' | 'compare' | 'none'
  meta?: Record<string, number | string>
  /** conexiones curvas por defecto */
  curved?: boolean
}

export interface NodeFrame {
  status: Status
  badge: string | null
  x: number
  y: number
  opacity: number
  scale: number
  pulse: Outcome | null
  pulseAlpha: number
}

export interface PacketFrame {
  key: string
  x: number
  y: number
  outcome: Outcome
  label?: string
  opacity: number
  big?: boolean
}

export type LineState = 'idle' | 'run' | 'wait' | 'ok' | 'err'

export interface LineFrame {
  key: string
  from: string
  to: string
  x1: number
  y1: number
  x2: number
  y2: number
  state: LineState
  independent: boolean
  faint: boolean
  opacity: number
  ephemeral: boolean
  /** punto de control de la curva cuadrática (si existe) */
  cx?: number
  cy?: number
}

export interface WaitFrame {
  key: string
  x: number
  y: number
  label?: string
  tone: 'pending' | 'error'
}

export interface Frame {
  t: number
  nodes: Record<string, NodeFrame>
  lines: LineFrame[]
  packets: PacketFrame[]
  waits: WaitFrame[]
  caption?: Caption
  banner?: Banner
  stepStatus: Status[]
  ticker: { text: string; tone: Tone }[]
  volume: number
  activity: number
  stats: { executed: number; calls: number; pending: number; activeLinks: number }
}
