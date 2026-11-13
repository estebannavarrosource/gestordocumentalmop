'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipForward, StepForward, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { frameAt } from '@/lib/sim/engine'
import type { Script } from '@/lib/sim/types'
import { buildV3Scene1, buildV3Scene2, type V3Scene2Variant } from '@/lib/sim/v3/scenes-a'
import { buildV3Growth, buildV3Scene4, DOCS_LABELS, EXP_LABELS, Q_LABELS, U_LABELS, V3_TIMELINE, type GrowthLevels } from '@/lib/sim/v3/scenes-b'
import { buildV3Scene5 } from '@/lib/sim/v3/scenes-c'
import { buildV3Extra, V3_EXTRA_TITLES, V3_PROFILES, type V3ExtraId, type V3ExtraOpts } from '@/lib/sim/v3/scenes-d'
import { nodeInfo } from '@/lib/sim/v3/info'
import { AnalysisButton, AUTHOR, BrandMark } from './brand'
import { STATUS_COLOR, STATUS_LABEL, TONE_COLOR } from './icons'
import { Stage } from './stage'
import { V3Compare, V3Growth, V3History, V3Steps } from './v3-overlays'

const SCENES = [
  { n: 1, short: 'Expediente integrado', title: 'Un expediente dentro de un único Gestor' },
  { n: 2, short: 'Incorporar documento', title: 'Incorporar un documento' },
  { n: 3, short: 'Crecimiento', title: 'Crecimiento de volumen y actividad' },
  { n: 4, short: 'Vista histórica', title: 'Estado del expediente a una fecha' },
  { n: 5, short: 'Comparación', title: 'SME actual frente al Gestor v3' },
]
const EXTRAS: V3ExtraId[] = ['integrity', 'bigfile', 'confid']
const V3_EXTRA_SHORT: Record<V3ExtraId, string> = { integrity: 'Integridad', bigfile: 'Archivo grande', confid: 'Confidencialidad' }
const SPEEDS = [0.5, 1, 2]

export function V3App() {
  const [scene, setScene] = useState(0)
  const [extra, setExtra] = useState<V3ExtraId | null>(null)
  const [s2, setS2] = useState<V3Scene2Variant>('normal')
  const [tour, setTour] = useState(true)
  const [lv, setLv] = useState<GrowthLevels>({ exp: 0, docs: 0, q: 0, u: 0 })
  const [s4, setS4] = useState(4)
  const [xo, setXo] = useState<V3ExtraOpts>({ integrity: 'verify', bigfile: 'interrupt', profile: 0 })
  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [fs, setFs] = useState(false)
  const [clock, setClock] = useState({ t: 0, amb: 0 })
  const rootRef = useRef<HTMLDivElement>(null)

  const script: Script = useMemo(() => {
    if (extra) return buildV3Extra(extra, xo)
    switch (scene) {
      case 0:
        return buildV3Scene1()
      case 1:
        return buildV3Scene2(s2)
      case 2:
        return buildV3Growth(tour ? { kind: 'tour' } : { kind: 'manual', levels: lv })
      case 3:
        return buildV3Scene4(s4)
      default:
        return buildV3Scene5()
    }
  }, [scene, extra, s2, tour, lv, s4, xo])

  const frame = useMemo(() => frameAt(script, clock.t), [script, clock.t])

  const tRef = useRef(0)
  const playingRef = useRef(playing)
  const speedRef = useRef(speed)
  const scriptRef = useRef(script)
  playingRef.current = playing
  speedRef.current = speed
  scriptRef.current = script

  const restart = useCallback((play = true) => {
    tRef.current = 0
    setClock({ t: 0, amb: performance.now() })
    setPlaying(play)
  }, [])

  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    restart(true)
  }, [script, restart])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const sc = scriptRef.current
      if (playingRef.current && sc.duration > 0) {
        tRef.current += dt * speedRef.current
        if (Number.isFinite(sc.duration) && tRef.current >= sc.duration) {
          tRef.current = sc.duration
          setPlaying(false)
        }
        setClock({ t: tRef.current, amb: now })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  const finite = Number.isFinite(script.duration)
  const atEnd = finite && clock.t >= script.duration - 1

  const togglePlay = () => {
    if (atEnd) return restart(true)
    setPlaying((p) => !p)
  }

  const nextStep = () => {
    const t = tRef.current
    const starts = (script.steps?.events ?? []).filter((e) => e.status === 'running' && e.at > t + 50).map((e) => e.at)
    const caps = script.captions.filter((c) => c.at > t + 50).map((c) => c.at)
    const list = (starts.length ? starts : caps).sort((a, b) => a - b)
    const to = list[0]
    if (to === undefined) return
    tRef.current = to
    setClock({ t: to, amb: performance.now() })
    setPlaying(true)
  }

  const nextScene = () => {
    if (extra) return
    setScene((s) => Math.min(SCENES.length - 1, s + 1))
  }

  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void rootRef.current?.requestFullscreen()
  }

  const scrub = (v: number) => {
    tRef.current = v
    setClock({ t: v, amb: performance.now() })
  }

  const overlay =
    script.overlay === 'steps' ? (
      <V3Steps script={script} frame={frame} />
    ) : script.overlay === 'growth' ? (
      <V3Growth script={script} frame={frame} />
    ) : script.overlay === 'history' ? (
      <V3History script={script} frame={frame} />
    ) : script.overlay === 'compare' ? (
      <V3Compare script={script} frame={frame} />
    ) : null

  const title = extra ? V3_EXTRA_TITLES[extra] : SCENES[scene].title
  const caption = frame.caption
  const selDef = selected ? script.nodes.find((n) => n.id === selected) : null
  const selFrame = selected ? frame.nodes[selected] : null

  return (
    <div ref={rootRef} className="flex h-dvh min-h-[600px] flex-col bg-mist text-navy">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 border-b border-slate-line bg-white px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark height={34} />
          <div className="min-w-0">
            <h1 className="text-balance text-[15px] font-bold leading-tight md:text-base">Gestor Ministerial v3 · arquitectura propuesta</h1>
            <p className="hidden truncate text-[12px] text-slate-ink md:block">
              {title} · Análisis: {AUTHOR}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-medium text-slate-ink" aria-label="Leyenda de estados">
            {(
              [
                ['running', 'En ejecución'],
                ['ok', 'Confirmado'],
                ['pending', 'Pendiente'],
                ['error', 'Error'],
                ['idle', 'En espera'],
              ] as const
            ).map(([k, l]) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border-2 bg-white" style={{ borderColor: TONE_COLOR[k] }} />
                {l}
              </li>
            ))}
          </ul>
          <AnalysisButton />
          <Link href="/" className="rounded-lg px-2.5 py-1 text-[12px] font-semibold text-azure ring-1 ring-slate-line hover:bg-mist focus-visible:outline-2 focus-visible:outline-azure">
            Ver arquitectura actual
          </Link>
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-1 border-b border-slate-line bg-white px-3 py-1" aria-label="Escenas">
        {SCENES.map((s, i) => {
          const active = !extra && scene === i
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => {
                setExtra(null)
                setScene(i)
              }}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-azure ${active ? 'bg-navy text-white' : 'text-navy hover:bg-mist'}`}
            >
              <span className={`grid size-5 place-items-center rounded-full text-[11px] ${active ? 'bg-white text-navy' : 'bg-slate-line text-navy'}`}>{s.n}</span>
              {s.short}
            </button>
          )
        })}
        <span className="mx-1 hidden h-5 w-px bg-slate-line md:block" aria-hidden="true" />
        {EXTRAS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setExtra(e)}
            aria-pressed={extra === e}
            title="Caso adicional"
            className={`rounded-lg border px-2 py-0.5 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-azure ${extra === e ? 'border-azure bg-azure text-white' : 'border-slate-line text-navy hover:bg-mist'}`}
          >
            {V3_EXTRA_SHORT[e]}
          </button>
        ))}
      </nav>

      <Controls
        scene={extra ? -1 : scene}
        extra={extra}
        s2={s2}
        setS2={setS2}
        tour={tour}
        setTour={setTour}
        lv={lv}
        setLv={setLv}
        s4={s4}
        setS4={setS4}
        xo={xo}
        setXo={setXo}
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Stage script={script} frame={frame} amb={clock.amb} showFailures={false} showTicker={false} overlay={overlay} zoom={zoom} selected={selected} onSelect={setSelected} />
        <AnimatePresence>
          {selDef && selFrame && (
            <motion.aside
              key={selDef.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute right-3 top-3 z-20 w-[280px] rounded-xl border border-slate-line bg-white p-3 shadow-lg"
              aria-label="Detalle del componente"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold leading-tight">{selDef.label}</div>
                  {selDef.sub && <div className="text-[11.5px] text-slate-ink">{selDef.sub}</div>}
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar detalle" className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-mist focus-visible:outline-2 focus-visible:outline-azure">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px] font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: STATUS_COLOR[selFrame.status] }} />
                {STATUS_LABEL[selFrame.status]}
                {selFrame.badge && <span className="truncate font-normal text-slate-ink">· {selFrame.badge}</span>}
              </div>
              <p className="mt-2 text-pretty text-[12.5px] leading-snug text-navy">{nodeInfo(selDef.id)}</p>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <div className="border-t border-slate-line bg-white px-4 py-1" aria-live="polite">
        <div className="flex min-h-[32px] items-center gap-3">
          <span className="size-3 shrink-0 rounded-full" style={{ background: caption ? TONE_COLOR[caption.tone ?? 'info'] : TONE_COLOR.idle }} aria-hidden="true" />
          <AnimatePresence mode="wait">
            <motion.p
              key={caption?.text ?? ''}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-pretty text-[14px] font-medium leading-snug"
            >
              {caption?.text ?? 'Seleccione una escena para comenzar.'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-line bg-mist px-3 py-2">
        <div className="flex items-center gap-1.5">
          <IconBtn label={playing && !atEnd ? 'Pausar' : atEnd ? 'Repetir' : 'Reproducir'} onClick={togglePlay} primary>
            {playing && !atEnd ? <Pause className="size-4" /> : <Play className="size-4" />}
          </IconBtn>
          <IconBtn label="Reiniciar escena" onClick={() => restart(true)}>
            <RotateCcw className="size-4" />
          </IconBtn>
          <IconBtn label="Paso siguiente" onClick={nextStep}>
            <StepForward className="size-4" />
          </IconBtn>
          <IconBtn label="Escena siguiente" onClick={nextScene} disabled={!!extra || scene >= SCENES.length - 1}>
            <SkipForward className="size-4" />
          </IconBtn>
        </div>

        <div className="flex min-w-[140px] flex-1 items-center">
          {finite ? (
            <input
              type="range"
              min={0}
              max={script.duration}
              step={50}
              value={Math.min(clock.t, script.duration)}
              onChange={(e) => scrub(Number(e.target.value))}
              aria-label="Progreso de la escena"
              className="h-1.5 w-full cursor-pointer accent-azure"
            />
          ) : (
            <span className="text-[12px] text-slate-ink">Simulación continua: ajuste los niveles de volumen y actividad.</span>
          )}
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Velocidad">
          <span className="mr-1 text-[12px] font-medium text-slate-ink">Velocidad</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`rounded-md px-2 py-1 text-[12px] font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-azure ${speed === s ? 'bg-navy text-white' : 'bg-white text-navy ring-1 ring-slate-line hover:bg-white/60'}`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <IconBtn label="Alejar" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} disabled={zoom <= 0.6}>
            <ZoomOut className="size-4" />
          </IconBtn>
          <button type="button" onClick={() => setZoom(1)} className="w-12 rounded-md bg-white py-1 text-[12px] font-semibold tabular-nums ring-1 ring-slate-line hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-azure" aria-label="Restablecer zoom">
            {Math.round(zoom * 100)}%
          </button>
          <IconBtn label="Acercar" onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))} disabled={zoom >= 2}>
            <ZoomIn className="size-4" />
          </IconBtn>
          <IconBtn label={fs ? 'Salir de pantalla completa' : 'Pantalla completa'} onClick={toggleFs}>
            {fs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </IconBtn>
        </div>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
function Seg({ options, value, onChange, label }: { options: string[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] font-semibold text-slate-ink">{label}</span>
      <div className="flex overflow-hidden rounded-lg ring-1 ring-slate-line" role="group" aria-label={label}>
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === i}
            onClick={() => onChange(i)}
            className={`px-2 py-1 text-[12px] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-azure ${value === i ? 'bg-azure text-white' : 'bg-white text-navy hover:bg-mist'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

function Action({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-1 text-[12.5px] font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-azure ${active ? 'bg-azure text-white ring-azure' : 'bg-white text-navy ring-slate-line hover:bg-mist'}`}
    >
      {children}
    </button>
  )
}

interface CtrlProps {
  scene: number
  extra: V3ExtraId | null
  s2: V3Scene2Variant
  setS2: (v: V3Scene2Variant) => void
  tour: boolean
  setTour: (v: boolean) => void
  lv: GrowthLevels
  setLv: (v: GrowthLevels) => void
  s4: number
  setS4: (n: number) => void
  xo: V3ExtraOpts
  setXo: (o: V3ExtraOpts) => void
}

function Controls({ scene, extra, s2, setS2, tour, setTour, lv, setLv, s4, setS4, xo, setXo }: CtrlProps) {
  if (scene === 0 || scene === 4) return null
  const bar = 'flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-line bg-mist px-3 py-1.5'
  if (extra === 'integrity')
    return (
      <div className={bar}>
        <span className="text-[12px] font-semibold text-slate-ink">Caso</span>
        <Action active={xo.integrity === 'verify'} onClick={() => setXo({ ...xo, integrity: 'verify' })}>
          Verificar integridad
        </Action>
        <Action active={xo.integrity === 'tamper'} onClick={() => setXo({ ...xo, integrity: 'tamper' })}>
          Simular adulteración
        </Action>
      </div>
    )
  if (extra === 'bigfile')
    return (
      <div className={bar}>
        <span className="text-[12px] font-semibold text-slate-ink">Caso</span>
        <Action active={xo.bigfile === 'smooth'} onClick={() => setXo({ ...xo, bigfile: 'smooth' })}>
          Carga sin interrupción
        </Action>
        <Action active={xo.bigfile === 'interrupt'} onClick={() => setXo({ ...xo, bigfile: 'interrupt' })}>
          Provocar interrupción y reanudar
        </Action>
      </div>
    )
  if (extra === 'confid')
    return (
      <div className={bar}>
        <Seg label="Perfil de acceso" options={V3_PROFILES} value={xo.profile} onChange={(i) => setXo({ ...xo, profile: i })} />
      </div>
    )
  if (scene === 1)
    return (
      <div className={bar}>
        <span className="text-[12px] font-semibold text-slate-ink">Caso a simular</span>
        <Action active={s2 === 'normal'} onClick={() => setS2('normal')}>
          Incorporar documento
        </Action>
        <Action active={s2 === 'fail'} onClick={() => setS2('fail')}>
          Provocar error en la carga
        </Action>
      </div>
    )
  if (scene === 2)
    return (
      <div className={bar}>
        <Seg label="Exp." options={EXP_LABELS} value={lv.exp} onChange={(i) => { setTour(false); setLv({ ...lv, exp: i }) }} />
        <Seg label="Docs" options={DOCS_LABELS} value={lv.docs} onChange={(i) => { setTour(false); setLv({ ...lv, docs: i }) }} />
        <Seg label="Consultas" options={Q_LABELS} value={lv.q} onChange={(i) => { setTour(false); setLv({ ...lv, q: i }) }} />
        <Seg label="Cargas" options={U_LABELS} value={lv.u} onChange={(i) => { setTour(false); setLv({ ...lv, u: i }) }} />
        <Action active={tour} onClick={() => setTour(true)}>
          Recorrido guiado
        </Action>
      </div>
    )
  if (scene === 3)
    return (
      <div className={bar}>
        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-ink">
          Fecha a consultar
          <select
            value={s4}
            onChange={(e) => setS4(Number(e.target.value))}
            className="rounded-lg bg-white px-3 py-1 text-[12.5px] font-semibold text-navy ring-1 ring-slate-line focus-visible:outline-2 focus-visible:outline-azure"
          >
            {V3_TIMELINE.map((e, i) => (
              <option key={e.date} value={i}>
                {e.date} · {e.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    )
  return null
}

function IconBtn({ label, onClick, children, primary, disabled }: { label: string; onClick: () => void; children: React.ReactNode; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-azure disabled:cursor-not-allowed disabled:opacity-40 ${primary ? 'bg-navy text-white hover:bg-navy/90' : 'bg-white text-navy ring-1 ring-slate-line hover:bg-white/60'}`}
    >
      {children}
    </button>
  )
}
