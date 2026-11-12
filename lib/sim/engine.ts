import type {
  Frame,
  LineFrame,
  LineState,
  NodeDef,
  NodeFrame,
  Op,
  Outcome,
  PacketFrame,
  Script,
  Status,
  Tone,
  WaitFrame,
} from './types'

/**
 * Motor determinista: todo el estado visual es una función pura de (script, t).
 * Pausar, reiniciar o saltar en el tiempo nunca produce estados inconsistentes.
 */

const TAIL_OK = 700
const TAIL_ERR = 1800
const PULSE_MS = 650

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
export const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

interface Prepared {
  nodeMap: Map<string, NodeDef>
  centers: Map<string, { x: number; y: number }>
  events: Script['events']
  steps: NonNullable<Script['steps']>['events']
  captions: Script['captions']
  cycleFinal: number
  cycleOps: number
}

const cache = new WeakMap<Script, Prepared>()

function prepare(s: Script): Prepared {
  const hit = cache.get(s)
  if (hit) return hit
  const nodeMap = new Map<string, NodeDef>()
  const centers = new Map<string, { x: number; y: number }>()
  for (const n of s.nodes) {
    nodeMap.set(n.id, n)
    centers.set(n.id, { x: n.x + n.w / 2, y: n.y + n.h / 2 })
  }
  const p: Prepared = {
    nodeMap,
    centers,
    events: [...s.events].sort((a, b) => a.at - b.at),
    steps: [...(s.steps?.events ?? [])].sort((a, b) => a.at - b.at),
    captions: [...s.captions].sort((a, b) => a.at - b.at),
    cycleFinal: s.ops.filter((o) => o.final).length,
    cycleOps: s.ops.length,
  }
  cache.set(s, p)
  return p
}

const keyOf = (a: string, b: string) => (a < b ? `${a}~${b}` : `${b}~${a}`)

const PRIORITY: Record<LineState, number> = { idle: 0, ok: 1, run: 2, wait: 3, err: 4 }

function tailFor(o: Op) {
  return o.outcome === 'ok' ? TAIL_OK : TAIL_ERR
}

export function frameAt(script: Script, t: number): Frame {
  const prep = prepare(script)
  const loop = script.loop
  const cycle = loop ? Math.floor(t / loop) : 0
  const tl = loop ? t - cycle * loop : t

  // ---- nodos -------------------------------------------------------------
  const nodes: Record<string, NodeFrame> = {}
  for (const n of script.nodes) {
    let opacity = 1
    let scale = 1
    let x = n.x
    let y = n.y
    if (n.enter) {
      const p = ease(clamp((tl - n.enter.at) / n.enter.dur))
      opacity = p
      scale = lerp(n.enter.fromScale ?? 1, 1, p)
      if (n.enter.fromX !== undefined && n.enter.fromY !== undefined) {
        x = lerp(n.enter.fromX - n.w / 2, n.x, p)
        y = lerp(n.enter.fromY - n.h / 2, n.y, p)
      }
    }
    if (n.exit) opacity *= 1 - ease(clamp((tl - n.exit.at) / n.exit.dur))
    nodes[n.id] = {
      status: 'idle',
      badge: null,
      x,
      y,
      opacity,
      scale,
      pulse: null,
      pulseAlpha: 0,
    }
  }

  for (const e of prep.events) {
    if (e.at > tl) break
    if (e.node === '*') {
      for (const id in nodes) {
        nodes[id].status = e.status
        nodes[id].badge = null
      }
      continue
    }
    const nf = nodes[e.node]
    if (!nf) continue
    nf.status = e.status
    if (e.badge !== undefined) nf.badge = e.badge
  }

  // ---- operaciones -------------------------------------------------------
  const lineMap = new Map<string, LineFrame>()
  for (const l of script.links) {
    if (l.at !== undefined && tl < l.at) continue
    const a = prep.centers.get(l.from)
    const b = prep.centers.get(l.to)
    if (!a || !b) continue
    const k = keyOf(l.from, l.to)
    lineMap.set(k, {
      key: k,
      from: l.from,
      to: l.to,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      state: 'idle',
      independent: !!l.independent,
      faint: !!l.faint,
      opacity: l.at !== undefined ? clamp((tl - l.at) / 500) : 1,
      ephemeral: false,
    })
  }

  const packets: PacketFrame[] = []
  const waits: WaitFrame[] = []
  const tickerOps: { start: number; text: string; tone: Tone }[] = []
  let executed = 0
  let calls = 0
  let pendingNow = 0

  const ops = script.ops
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i]
    if (o.start > tl) continue
    calls++
    const a = prep.centers.get(o.from)
    const b = prep.centers.get(o.to)
    if (!a || !b) continue
    const hold = o.hold ?? 0
    const arrive = o.start + o.dur
    const end = arrive + hold
    if (o.final && end <= tl) executed++
    if (o.event) {
      tickerOps.push({
        start: o.start,
        text: o.event,
        tone: o.outcome === 'ok' ? 'running' : o.outcome === 'lost' ? 'error' : o.outcome,
      })
    }
    const tail = tailFor(o)
    if (tl > end + tail) continue

    const k = keyOf(o.from, o.to)
    let line = lineMap.get(k)
    const ephemeral = !line
    if (!line) {
      line = {
        key: k,
        from: o.from,
        to: o.to,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        state: 'idle',
        independent: false,
        faint: false,
        opacity: 0,
        ephemeral: true,
      }
      lineMap.set(k, line)
    }

    let state: LineState = 'idle'
    let lineOpacity = 1
    if (tl < arrive) {
      const p = (tl - o.start) / o.dur
      state = o.outcome === 'error' || (o.outcome === 'lost' && p > 0.55) ? 'err' : 'run'
      const pe = ease(clamp(p))
      let opacity = 1
      if (o.outcome === 'lost') opacity = p < 0.55 ? 1 : clamp(1 - (p - 0.55) / 0.2)
      packets.push({
        key: `p${i}`,
        x: lerp(a.x, b.x, pe),
        y: lerp(a.y, b.y, pe),
        outcome: o.outcome,
        label: o.label,
        opacity,
        big: o.big,
      })
    } else if (tl < end) {
      state = 'wait'
      pendingNow++
      waits.push({
        key: `w${i}`,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        label: o.holdLabel,
        tone: o.outcome === 'error' ? 'error' : 'pending',
      })
    } else {
      const f = (tl - end) / tail
      lineOpacity = 1 - f
      state = o.outcome === 'ok' ? 'ok' : o.outcome === 'pending' ? 'wait' : 'err'
    }
    if (o.outcome !== 'lost' && tl >= arrive && tl - arrive < PULSE_MS) {
      const nf = nodes[o.to]
      const alpha = 1 - (tl - arrive) / PULSE_MS
      if (nf && alpha > nf.pulseAlpha) {
        nf.pulse = o.outcome
        nf.pulseAlpha = alpha
      }
    }
    if (PRIORITY[state] >= PRIORITY[line.state]) {
      line.state = state
      if (ephemeral) line.opacity = Math.max(line.opacity, lineOpacity)
    }
  }

  // ---- derivados ---------------------------------------------------------
  const lines = Array.from(lineMap.values())
  let activeLinks = 0
  for (const l of lines) if (l.state === 'run' || l.state === 'wait') activeLinks++

  tickerOps.sort((x, y) => x.start - y.start)
  const ticker = tickerOps.slice(-3).map(({ text, tone }) => ({ text, tone }))

  let caption
  for (const c of prep.captions) {
    if (c.at > tl) break
    caption = c
  }
  let banner
  for (const b of script.banners) if (b.at <= tl && tl < b.until) banner = b

  const stepStatus: Status[] = (script.steps?.labels ?? []).map(() => 'idle')
  for (const s of prep.steps) {
    if (s.at > tl) break
    stepStatus[s.n] = s.status
  }

  let volume = 0
  for (const v of script.volume) if (v.at <= tl) volume = v.level
  let activity = 0
  for (const v of script.activity) if (v.at <= tl) activity = v.level

  return {
    t,
    nodes,
    lines,
    packets,
    waits,
    caption,
    banner,
    stepStatus,
    ticker,
    volume,
    activity,
    stats: {
      executed: executed + cycle * prep.cycleFinal,
      calls: calls + cycle * prep.cycleOps,
      pending: pendingNow,
      activeLinks,
    },
  }
}

/** Conteos derivados exclusivamente de las operaciones del guion (escena 5). */
export function sideStats(
  script: Script,
  t: number,
  prefix: string,
  hubs: string[],
  groupOf: (id: string) => string = (id) => id,
) {
  let steps = 0
  let coord = 0
  const deps = new Set<string>()
  for (const o of script.ops) {
    if (o.start > t) continue
    if (!o.from.startsWith(prefix)) continue
    steps++
    if (o.coord) coord++
    for (const id of [o.from, o.to]) if (!hubs.includes(id)) deps.add(groupOf(id))
  }
  return { steps, coord, deps: deps.size }
}

export function toneToOutcome(t: Tone): Outcome {
  return t === 'error' ? 'error' : t === 'pending' ? 'pending' : 'ok'
}
