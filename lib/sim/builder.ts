import type {
  Banner,
  Caption,
  NodeEvent,
  Op,
  Script,
  Status,
  StepDef,
  Tone,
  NodeDef,
  LinkDef,
  TimelineEvent,
} from './types'

export const STAGE = { w: 1600, h: 760 }

/** Constructor fluido de guiones: cada llamada agrega operaciones/eventos en el tiempo. */
export class Builder {
  ops: Op[] = []
  events: NodeEvent[] = []
  captions: Caption[] = []
  banners: Banner[] = []
  steps: StepDef[] = []
  volume: TimelineEvent[] = [{ at: 0, level: 0 }]
  activity: TimelineEvent[] = [{ at: 0, level: 0 }]

  /** Agrega un paquete; devuelve el instante de llegada. */
  op(from: string, to: string, start: number, dur: number, o: Partial<Op> = {}) {
    this.ops.push({ from, to, start, dur, outcome: 'ok', ...o })
    return start + dur + (o.hold ?? 0)
  }

  ev(at: number, node: string, status: Status, badge?: string | null) {
    this.events.push({ at, node, status, badge })
    return this
  }

  reset(at: number) {
    return this.ev(at, '*', 'idle')
  }

  cap(at: number, text: string, tone?: Tone) {
    this.captions.push({ at, text, tone })
    return this
  }

  ban(at: number, until: number, text: string, tone?: Tone) {
    this.banners.push({ at, until, text, tone })
    return this
  }

  step(at: number, n: number, status: Status) {
    this.steps.push({ at, n, status })
    return this
  }

  build(args: {
    id: string
    duration: number
    nodes: NodeDef[]
    links: LinkDef[]
    overlay?: Script['overlay']
    stepLabels?: string[]
    loop?: number
    bannerPos?: Script['bannerPos']
    meta?: Script['meta']
  }): Script {
    return {
      id: args.id,
      duration: args.duration,
      loop: args.loop,
      stage: STAGE,
      nodes: args.nodes,
      links: args.links,
      ops: this.ops,
      events: this.events,
      steps: args.stepLabels ? { labels: args.stepLabels, events: this.steps } : undefined,
      captions: this.captions,
      banners: this.banners,
      bannerPos: args.bannerPos,
      volume: this.volume,
      activity: this.activity,
      overlay: args.overlay ?? 'none',
      meta: args.meta,
    }
  }
}

/** Mezcla guiones secuenciales en uno (para "tour" automático). */
export function concat(parts: Script[], gap = 0, id = 'tour'): Script {
  const base = parts[0]
  let offset = 0
  const out: Script = {
    ...base,
    id,
    ops: [],
    events: [],
    captions: [],
    banners: [],
    volume: [],
    activity: [],
    steps: base.steps ? { labels: base.steps.labels, events: [] } : undefined,
    duration: 0,
    loop: undefined,
  }
  for (const p of parts) {
    for (const o of p.ops) out.ops.push({ ...o, start: o.start + offset })
    for (const e of p.events) out.events.push({ ...e, at: e.at + offset })
    for (const c of p.captions) out.captions.push({ ...c, at: c.at + offset })
    for (const b of p.banners) out.banners.push({ ...b, at: b.at + offset, until: b.until + offset })
    for (const v of p.volume) out.volume.push({ ...v, at: v.at + offset })
    for (const v of p.activity) out.activity.push({ ...v, at: v.at + offset })
    if (p.steps && out.steps) {
      for (const s of p.steps.events) out.steps.events.push({ ...s, at: s.at + offset })
      // Reinicia el riel de pasos al comenzar cada segmento
      for (let n = 0; n < p.steps.labels.length; n++) out.steps.events.push({ at: offset, n, status: 'idle' })
    }
    out.events.push({ at: offset, node: '*', status: 'idle' })
    offset += p.duration + gap
  }
  out.duration = offset - gap
  return out
}
