'use client'

import type { CSSProperties, ReactNode } from 'react'
import { sideStats } from '@/lib/sim/engine'
import type { Frame, Script, Status } from '@/lib/sim/types'
import { COMPARE_BASE, COMPARE_OPS, COMPARE_STEP, CORE_IDS, compareBase } from '@/lib/sim/scenes/scene5'
import { ACTIVITY_LABELS, VOLUME_LABELS } from '@/lib/sim/scenes/scene3'
import { TIMELINE } from '@/lib/sim/scenes/scene4'
import { AMBER, GREEN, NAVY, SimIcon, STATUS_COLOR } from './icons'

function Abs({ x, y, w, h, children, className, style }: { x: number; y: number; w?: number; h?: number; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`absolute ${className ?? ''}`} style={{ left: x, top: y, width: w, height: h, ...style }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
export function StepsOverlay({ script, frame }: { script: Script; frame: Frame }) {
  const labels = script.steps?.labels ?? []
  return (
    <Abs x={40} y={566} w={1050} className="z-[4] grid grid-cols-5 gap-x-3 gap-y-3">
      {labels.map((label, i) => {
        const st: Status = frame.stepStatus[i] ?? 'idle'
        const c = STATUS_COLOR[st]
        return (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border-2 bg-white px-3 py-2.5 transition-colors"
            style={{ borderColor: c, boxShadow: st === 'running' ? `0 0 0 4px ${c}2e` : undefined }}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white" style={{ background: c }}>
              {i + 1}
            </span>
            <span className="text-[13px] font-semibold leading-tight text-navy">{label}</span>
          </div>
        )
      })}
    </Abs>
  )
}

// ---------------------------------------------------------------------------
function Counter({ label, value, tone, hint }: { label: string; value: number; tone: string; hint?: string }) {
  return (
    <div className="rounded-xl border-2 bg-white px-5 py-3" style={{ borderColor: tone }}>
      <div className="font-mono text-[44px] font-bold leading-none tabular-nums" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-1.5 text-[13px] font-semibold leading-tight text-navy">{label}</div>
      {hint && <div className="text-[11px] text-slate-ink">{hint}</div>}
    </div>
  )
}

export function GrowthOverlay({ frame }: { frame: Frame }) {
  const s = frame.stats
  return (
    <>
      <Abs x={40} y={500} w={1050} className="z-[4] grid grid-cols-4 gap-3">
        <Counter label="Operaciones ejecutadas" value={s.executed} tone="#15966B" />
        <Counter label="Llamadas entre componentes" value={s.calls} tone="#1672B8" />
        <Counter label="Operaciones pendientes" value={s.pending} tone={s.pending > 0 ? '#F59E0B' : '#9AA9BD'} hint="en espera o por conciliar" />
        <Counter label="Dependencias activas" value={s.activeLinks} tone="#102A4C" hint="conexiones en uso ahora" />
      </Abs>
      <Abs x={40} y={650} w={1050} className="z-[4] flex flex-col gap-1.5">
        <div className="flex items-center gap-6 text-[13px] font-semibold text-navy">
          <span>
            Volumen documental: <span className="text-azure">{VOLUME_LABELS[frame.volume]}</span>
          </span>
          <span>
            Actividad transaccional: <span className="text-azure">{ACTIVITY_LABELS[frame.activity]}</span>
          </span>
        </div>
        <div className="text-[11.5px] text-slate-ink">
          Indicadores derivados únicamente de las operaciones de esta simulación; no son mediciones de rendimiento. El límite de solicitudes simultáneas hacia el repositorio documental es ilustrativo.
        </div>
      </Abs>
    </>
  )
}

// ---------------------------------------------------------------------------
function SideTitle({ x, w, title, sub }: { x: number; w: number; title: string; sub?: string }) {
  return (
    <Abs x={x} y={140} w={w} className="z-[1]">
      <div className="text-[20px] font-bold leading-tight text-navy">{title}</div>
      {sub && <div className="text-[12px] text-slate-ink">{sub}</div>}
    </Abs>
  )
}

export function HistoryOverlay({ script }: { script: Script; frame: Frame }) {
  const target = Number(script.meta?.target ?? 4)
  return (
    <>
      <Abs x={800} y={140} w={2} h={590} className="z-[1] bg-slate-line" />
      <Abs x={30} y={4} w={760} className="z-[1]">
        <div className="text-[13px] font-semibold uppercase tracking-wider text-slate-ink">Línea de tiempo del expediente</div>
      </Abs>
      <Abs x={1180} y={118} w={400} className="z-[1] flex justify-end">
        <div className="flex items-center gap-2 rounded-full bg-navy px-4 py-1.5 text-[13px] font-semibold text-white">
          <SimIcon name="History" className="size-4" /> Fecha consultada: {TIMELINE[target].date}
        </div>
      </Abs>
      <SideTitle x={30} w={760} title="SME propuesto" sub="Tareas necesarias para obtener una vista histórica integral" />
      <SideTitle x={830} w={740} title="Modelo documental de referencia" sub="Conceptual · no es un producto determinado" />
      <Abs x={846} y={207} className="z-[1] text-[11px] font-semibold uppercase tracking-wider text-slate-ink">
        Eventos sucesivos
      </Abs>
      <Abs x={846} y={316} className="z-[1] text-[11px] font-semibold uppercase tracking-wider text-slate-ink">
        Snapshots
      </Abs>
      <Abs x={30} y={565} w={270} className="z-[1] rounded-xl border-2 border-dashed border-warn bg-white/90 p-3 text-[11.5px] leading-snug text-navy">
        La especificación ministerial no define una operación completa de reconstrucción histórica como capacidad autónoma. Sí contempla versionado, auditoría y exportación.
      </Abs>
      <Abs x={830} y={712} w={740} className="z-[1] text-[11.5px] text-slate-ink">
        Comparación conceptual, no una prueba de superioridad medida.
      </Abs>
    </>
  )
}

// ---------------------------------------------------------------------------
function MiniCounter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex-1 rounded-xl border-2 bg-white px-3 py-2" style={{ borderColor: tone }}>
      <div className="font-mono text-[28px] font-bold leading-none tabular-nums" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold leading-tight text-navy">{label}</div>
    </div>
  )
}

export function CompareOverlay({ script, frame }: { script: Script; frame: Frame }) {
  const t = frame.t
  const cur = t < COMPARE_BASE ? -1 : Math.min(COMPARE_OPS.length - 1, Math.floor((t - COMPARE_BASE) / COMPARE_STEP))
  const finished = t >= COMPARE_BASE + COMPARE_OPS.length * COMPARE_STEP - 1200
  const L = sideStats(script, t, 'l_', ['l_api', 'l_hist'])
  const R = sideStats(script, t, 'r_', ['r_api'], (id) => (CORE_IDS.includes(id) ? 'r_core' : id))
  const leftCap = t >= compareBase(5) + 2300
  const rightCap = t >= compareBase(5) + 1500

  return (
    <>
      <Abs x={0} y={8} w={1600} className="z-[4] flex flex-wrap justify-center gap-2 px-6">
        {COMPARE_OPS.map((o, i) => {
          const active = i === cur && !finished
          const done = i < cur || finished
          return (
            <div
              key={o.label}
              className="flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-[13px] font-semibold transition-colors"
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
      <Abs x={0} y={46} w={1600} className="z-[1] text-center text-[11.5px] text-slate-ink">
        Pasos lógicos del modelo ilustrativo, derivados de las operaciones reproducidas; no son mediciones de rendimiento.
      </Abs>
      <Abs x={800} y={84} w={2} h={500} className="z-[1] bg-slate-line" />
      <Abs x={30} y={62} w={760} className="z-[1] text-[20px] font-bold text-navy">
        Arquitectura propuesta SME
      </Abs>
      <Abs x={830} y={62} w={740} className="z-[1] text-[20px] font-bold text-navy">
        Arquitectura documental de referencia
      </Abs>

      <Abs x={30} y={596} w={760} className="z-[4] flex gap-2.5">
        <MiniCounter label="Interacciones lógicas" value={L.steps} tone="#1672B8" />
        <MiniCounter label="Dependencias utilizadas" value={L.deps} tone="#102A4C" />
        <MiniCounter label="Operaciones de coordinación" value={L.coord} tone="#F59E0B" />
        <div className="flex-[1.5] rounded-xl border-2 bg-white px-3 py-2" style={{ borderColor: leftCap ? AMBER : '#CBD5E1' }}>
          <div className="text-[15px] font-bold leading-tight" style={{ color: leftCap ? '#B45309' : '#9AA9BD' }}>
            {leftCap ? 'No definida en la especificación' : '—'}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-navy">Reconstrucción histórica explícita</div>
        </div>
      </Abs>
      <Abs x={830} y={596} w={740} className="z-[4] flex gap-2.5">
        <MiniCounter label="Interacciones lógicas" value={R.steps} tone="#1672B8" />
        <MiniCounter label="Dependencias utilizadas" value={R.deps} tone="#102A4C" />
        <MiniCounter label="Operaciones de coordinación" value={R.coord} tone="#F59E0B" />
        <div className="flex-[1.5] rounded-xl border-2 bg-white px-3 py-2" style={{ borderColor: rightCap ? GREEN : '#CBD5E1' }}>
          <div className="text-[15px] font-bold leading-tight" style={{ color: rightCap ? GREEN : '#9AA9BD' }}>
            {rightCap ? 'Snapshot + eventos' : '—'}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-navy">Reconstrucción histórica explícita</div>
        </div>
      </Abs>
    </>
  )
}

export { NAVY }
