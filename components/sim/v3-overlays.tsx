'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { Frame, Script, Status } from '@/lib/sim/types'
import { COMPARE_EXTERNAL, COMPARE_SYSTEM, V3_COMPARE_BASE, V3_COMPARE_OPS, V3_COMPARE_STEP, v3CompareBase } from '@/lib/sim/v3/scenes-c'
import { DOCS_LABELS, EXP_LABELS, Q_LABELS, U_LABELS, unpackLevels, V3_TIMELINE } from '@/lib/sim/v3/scenes-b'
import { AMBER, GREEN, SimIcon, STATUS_COLOR } from './icons'

function Abs({ x, y, w, h, children, className, style }: { x: number; y: number; w?: number; h?: number; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`absolute ${className ?? ''}`} style={{ left: x, top: y, width: w, height: h, ...style }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
export function V3Steps({ script, frame }: { script: Script; frame: Frame }) {
  const labels = script.steps?.labels ?? []
  return (
    <Abs x={12} y={612} w={1576} className="z-[4] grid gap-1.5" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
      {labels.map((label, i) => {
        const st: Status = frame.stepStatus[i] ?? 'idle'
        const c = STATUS_COLOR[st]
        return (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl border-2 bg-white px-2 py-2 transition-colors"
            style={{ borderColor: c, boxShadow: st === 'running' ? `0 0 0 4px ${c}2e` : undefined }}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: c }}>
              {i + 1}
            </span>
            <span className="text-[12px] font-semibold leading-tight text-navy">{label}</span>
          </div>
        )
      })}
    </Abs>
  )
}

// ---------------------------------------------------------------------------
function tagCount(script: Script, t: number, tag: string) {
  const loop = script.loop
  const cycle = loop ? Math.floor(t / loop) : 0
  const tl = loop ? t - cycle * loop : t
  let per = 0
  let cur = 0
  for (const o of script.ops) {
    if (o.tag !== tag) continue
    per++
    if (o.start + o.dur <= tl) cur++
  }
  return cur + cycle * per
}

function Counter({ label, value, tone, hint }: { label: string; value: number; tone: string; hint?: string }) {
  return (
    <div className="rounded-xl border-2 bg-white px-4 py-2" style={{ borderColor: tone }}>
      <div className="font-mono text-[34px] font-bold leading-none tabular-nums" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-1 text-[12px] font-semibold leading-tight text-navy">{label}</div>
      {hint && <div className="text-[10.5px] leading-tight text-slate-ink">{hint}</div>}
    </div>
  )
}

export function V3Growth({ script, frame }: { script: Script; frame: Frame }) {
  const t = frame.t
  const lv = unpackLevels(frame.volume, frame.activity)
  const workers = Object.entries(frame.nodes).filter(([id, n]) => id.startsWith('wk_') && id !== 'wk' && n.status === 'running').length
  const pages = Math.max(1, Math.ceil([20, 200, 2000, 20000][lv.docs] / 500))
  return (
    <>
      <Abs x={12} y={596} w={1576} className="z-[4] grid grid-cols-5 gap-2">
        <Counter label="Consultas atendidas" value={tagCount(script, t, 'consulta')} tone="#15966B" />
        <Counter label="Lecturas del documento rector" value={tagCount(script, t, 'rector')} tone="#1672B8" hint="lectura directa, sin ensamblar" />
        <Counter label="Objetos procesados" value={tagCount(script, t, 'objeto')} tone="#102A4C" />
        <Counter label="Operaciones pendientes" value={frame.stats.pending} tone={frame.stats.pending > 0 ? AMBER : '#9AA9BD'} hint="cargas en curso" />
        <Counter label="Workers activos" value={workers} tone={workers > 0 ? '#1672B8' : '#9AA9BD'} />
      </Abs>
      <Abs x={12} y={676} w={1576} className="z-[4] flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] font-semibold text-navy">
        <span>
          Expedientes: <span className="text-azure">{EXP_LABELS[lv.exp]}</span>
        </span>
        <span>
          Documentos por expediente: <span className="text-azure">{DOCS_LABELS[lv.docs]}</span> · índice en <span className="text-azure">{pages} pág.</span>
        </span>
        <span>
          Consultas: <span className="text-azure">{Q_LABELS[lv.q]}</span>
        </span>
        <span>
          Cargas: <span className="text-azure">{U_LABELS[lv.u]}</span>
        </span>
        <span className="font-normal text-slate-ink">Cifras ilustrativas de esta simulación, no mediciones.</span>
      </Abs>
    </>
  )
}

// ---------------------------------------------------------------------------
export function V3History({ script }: { script: Script; frame: Frame }) {
  const target = Number(script.meta?.target ?? 4)
  return (
    <>
      <Abs x={12} y={588} w={900} className="z-[4] text-[12px] font-semibold uppercase tracking-wider text-slate-ink">
        Línea de tiempo del expediente
      </Abs>
      <Abs x={1000} y={584} w={588} className="z-[4] flex justify-end">
        <div className="flex items-center gap-2 rounded-full bg-navy px-4 py-1 text-[13px] font-semibold text-white">
          <SimIcon name="History" className="size-4" /> Fecha consultada: {V3_TIMELINE[target].date}
        </div>
      </Abs>
      <Abs x={12} y={680} w={1576} className="z-[4] text-[11.5px] text-slate-ink">
        Los snapshots (después de los eventos 1, 3 y 6) acortan la reproducción. Simulación conceptual del diseño propuesto.
      </Abs>
    </>
  )
}

// ---------------------------------------------------------------------------
function MiniCounter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex-1 rounded-xl border-2 bg-white px-2.5 py-1.5" style={{ borderColor: tone }}>
      <div className="font-mono text-[26px] font-bold leading-none tabular-nums" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-1 text-[10.5px] font-semibold leading-tight text-navy">{label}</div>
    </div>
  )
}

function sideStats(script: Script, t: number, prefix: string) {
  const systems = new Set<string>()
  const external = new Set<string>()
  let steps = 0
  let coord = 0
  let upd = 0
  let conf = 0
  for (const o of script.ops) {
    if (o.start > t || !o.from.startsWith(prefix)) continue
    steps++
    if (o.coord) coord++
    if (o.tag === 'upd') upd++
    if (o.tag === 'conf') conf++
    for (const id of [o.from, o.to]) {
      const sys = COMPARE_SYSTEM[id]
      if (sys) systems.add(sys)
      if (COMPARE_EXTERNAL.includes(id)) external.add(id)
    }
  }
  return { steps, coord, upd, conf, systems: systems.size, external: external.size }
}

export function V3Compare({ script, frame }: { script: Script; frame: Frame }) {
  const t = frame.t
  const cur = t < V3_COMPARE_BASE ? -1 : Math.min(V3_COMPARE_OPS.length - 1, Math.floor((t - V3_COMPARE_BASE) / V3_COMPARE_STEP))
  const finished = t >= v3CompareBase(4) + 4400
  const L = sideStats(script, t, 'l_')
  const R = sideStats(script, t, 'r_')
  const leftCap = t >= v3CompareBase(4) + 2300
  const rightCap = t >= v3CompareBase(4) + 2800
  const row = (S: typeof L) => (
    <>
      <MiniCounter label="Sistemas funcionales involucrados" value={S.systems} tone="#102A4C" />
      <MiniCounter label="Coordinaciones entre sistemas" value={S.coord} tone="#F59E0B" />
      <MiniCounter label="Actualizaciones de estado" value={S.upd} tone="#1672B8" />
      <MiniCounter label="Operaciones de confirmación" value={S.conf} tone="#15966B" />
      <MiniCounter label="Dependencias externas" value={S.external} tone="#5B6B82" />
    </>
  )
  return (
    <>
      <Abs x={0} y={6} w={1600} className="z-[4] flex flex-wrap justify-center gap-2 px-6">
        {V3_COMPARE_OPS.map((o, i) => {
          const active = i === cur && !finished
          const done = i < cur || finished
          return (
            <div
              key={o.label}
              className="flex items-center gap-2 rounded-full border-2 px-4 py-1 text-[13px] font-semibold transition-colors"
              style={{
                borderColor: active ? '#1672B8' : done ? GREEN : '#CBD5E1',
                background: active ? '#1672B8' : '#FFFFFF',
                color: active ? '#FFFFFF' : done ? GREEN : '#5B6B82',
              }}
            >
              <SimIcon name={o.icon} className="size-4" />
              {o.label}
            </div>
          )
        })}
      </Abs>
      <Abs x={800} y={60} w={2} h={520} className="z-[1] bg-slate-line" />
      <Abs x={30} y={52} w={760} className="z-[1] text-[20px] font-bold text-navy">
        Arquitectura SME actual
      </Abs>
      <Abs x={830} y={52} w={740} className="z-[1] text-[20px] font-bold text-navy">
        Gestor Ministerial v3 (propuesta)
      </Abs>
      <Abs x={30} y={584} w={760} className="z-[4] flex gap-2">
        {row(L)}
      </Abs>
      <Abs x={830} y={584} w={740} className="z-[4] flex gap-2">
        {row(R)}
      </Abs>
      <Abs x={30} y={660} w={760} className="z-[4] text-[12px] font-semibold" style={{ color: leftCap ? '#B45309' : '#9AA9BD' }}>
        Reconstrucción histórica explícita: {leftCap ? 'no definida en la especificación' : '—'}
      </Abs>
      <Abs x={830} y={660} w={740} className="z-[4] text-[12px] font-semibold" style={{ color: rightCap ? GREEN : '#9AA9BD' }}>
        Reconstrucción histórica explícita: {rightCap ? 'snapshot + eventos' : '—'}
      </Abs>
    </>
  )
}
