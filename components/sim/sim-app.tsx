'use client'

import Link from 'next/link'
import { AnalysisButton, AUTHOR, BrandMark } from './brand'
import { AnimatePresence, motion } from 'motion/react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { frameAt } from '@/lib/sim/engine'
import { buildExtra, EXTRA_TITLES, type ExtraId } from '@/lib/sim/scenes/extras'
import { buildScene1 } from '@/lib/sim/scenes/scene1'
import { buildScene2, type Scene2Variant } from '@/lib/sim/scenes/scene2'
import { buildScene3 } from '@/lib/sim/scenes/scene3'
import { buildScene4 } from '@/lib/sim/scenes/scene4'
import { buildScene5 } from '@/lib/sim/scenes/scene5'
import type { Script } from '@/lib/sim/types'
import { TONE_COLOR } from './icons'
import { CompareOverlay, GrowthOverlay, HistoryOverlay, StepsOverlay } from './overlays'
import { SceneControls } from './scene-controls'
import { Stage } from './stage'

const SCENES = [
  { n: 1, short: 'Fragmentación', title: 'Un expediente, múltiples estructuras' },
  { n: 2, short: 'Incorporar documento', title: 'Incorporar un documento' },
  { n: 3, short: 'Crecimiento', title: 'Crecimiento de volumen y actividad' },
  { n: 4, short: 'Vista histórica', title: 'Estado del expediente a una fecha' },
  { n: 5, short: 'Comparación', title: 'SME frente a un modelo de referencia' },
]
const EXTRAS: ExtraId[] = ['integrity', 'bigfile', 'confid']
const SPEEDS = [0.5, 1, 1.5, 2]

export function SimApp() {
  const [scene, setScene] = useState(0)
  const [extra, setExtra] = useState<ExtraId | null>(null)
  const [s2, setS2] = useState<Scene2Variant>('idle')
  const [s3, setS3] = useState({ volume: 1, activity: 1, tour: false })
  const [s4, setS4] = useState(4)
  const [auto, setAuto] = useState(false)
  const [showFailures, setShowFailures] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [clock, setClock] = useState({ t: 0, amb: 0 })

  const script: Script = useMemo(() => {
    if (extra) return buildExtra(extra)
    switch (scene) {
      case 0:
        return buildScene1()
      case 1:
        return buildScene2(auto ? 'tour' : s2)
      case 2:
        return buildScene3(auto || s3.tour ? { kind: 'tour' } : { kind: 'manual', volume: s3.volume, activity: s3.activity })
      case 3:
        return buildScene4(s4)
      default:
        return buildScene5()
    }
  }, [scene, extra, s2, s3, s4, auto])

  const frame = useMemo(() => frameAt(script, clock.t), [script, clock.t])

  // Refs que lee el bucle de animación
  const tRef = useRef(0)
  const playingRef = useRef(playing)
  const speedRef = useRef(speed)
  const scriptRef = useRef(script)
  const failRef = useRef(showFailures)
  const endedRef = useRef<() => void>(() => {})
  playingRef.current = playing
  speedRef.current = speed
  scriptRef.current = script
  failRef.current = showFailures

  const restart = useCallback((play = true) => {
    tRef.current = 0
    setClock({ t: 0, amb: performance.now() })
    setPlaying(play)
  }, [])

  // Reinicia al cambiar de guion (escena, variante o nivel)
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    restart(script.duration !== 0)
  }, [script, restart])

  endedRef.current = () => {
    if (auto && !extra) {
      if (scene < SCENES.length - 1) setScene(scene + 1)
      else {
        setAuto(false)
        setPlaying(false)
      }
    } else {
      setPlaying(false)
    }
  }

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const sc = scriptRef.current
      let moved = false
      if (playingRef.current && sc.duration > 0) {
        tRef.current += dt * speedRef.current
        moved = true
        if (Number.isFinite(sc.duration) && tRef.current >= sc.duration) {
          tRef.current = sc.duration
          endedRef.current()
        }
      }
      if (moved || failRef.current) setClock({ t: tRef.current, amb: now })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const finite = Number.isFinite(script.duration) && script.duration > 0
  const atEnd = finite && clock.t >= script.duration - 1

  const togglePlay = () => {
    if (atEnd) return restart(true)
    setPlaying((p) => !p)
  }

  const selectScene = (i: number) => {
    setExtra(null)
    setScene(i)
  }
  const selectExtra = (e: ExtraId) => {
    setAuto(false)
    setExtra(e)
  }
  const next = () => {
    if (extra) return
    setScene((s) => Math.min(SCENES.length - 1, s + 1))
  }

  const toggleAuto = () => {
    const on = !auto
    setAuto(on)
    if (on) {
      setExtra(null)
      setScene(0)
    }
    restart(true)
  }

  const scrub = (v: number) => {
    tRef.current = v
    setClock({ t: v, amb: performance.now() })
  }

  const overlay =
    script.overlay === 'steps' ? (
      <StepsOverlay script={script} frame={frame} />
    ) : script.overlay === 'growth' ? (
      <GrowthOverlay frame={frame} />
    ) : script.overlay === 'history' ? (
      <HistoryOverlay script={script} frame={frame} />
    ) : script.overlay === 'compare' ? (
      <CompareOverlay script={script} frame={frame} />
    ) : null

  const title = extra ? EXTRA_TITLES[extra] : SCENES[scene].title
  const caption = frame.caption
  const showTicker = script.overlay !== 'compare' && script.overlay !== 'history'

  return (
    <div className="flex h-dvh min-h-[640px] flex-col bg-mist text-navy">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-line bg-white px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark height={42} />
          <div className="min-w-0">
            <h1 className="text-balance text-lg font-bold leading-tight md:text-xl">¿Qué ocurre dentro del expediente electrónico?</h1>
            <p className="text-[13px] text-slate-ink">
              Simulación de la arquitectura propuesta del SDIT · {title} · Análisis: {AUTHOR}
            </p>
          </div>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium text-slate-ink" aria-label="Leyenda de estados">
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
              <span className="size-3 rounded-full border-2 bg-white" style={{ borderColor: TONE_COLOR[k] }} />
              {l}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <AnalysisButton />
          <Link href="/gestor-v3" className="rounded-lg px-2.5 py-1 text-[12px] font-semibold text-azure ring-1 ring-slate-line hover:bg-mist focus-visible:outline-2 focus-visible:outline-azure">
            Ver arquitectura propuesta (Gestor v3)
          </Link>
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-1.5 border-b border-slate-line bg-white px-4 py-2" aria-label="Escenas">
        {SCENES.map((s, i) => {
          const active = !extra && scene === i
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => selectScene(i)}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-azure ${
                active ? 'bg-navy text-white' : 'text-navy hover:bg-mist'
              }`}
            >
              <span className={`grid size-5 place-items-center rounded-full text-[11px] ${active ? 'bg-white text-navy' : 'bg-slate-line text-navy'}`}>{s.n}</span>
              {s.short}
            </button>
          )
        })}
        <span className="mx-2 hidden h-5 w-px bg-slate-line md:block" aria-hidden="true" />
        <span className="hidden text-[12px] font-medium text-slate-ink md:inline">Casos adicionales:</span>
        {EXTRAS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => selectExtra(e)}
            aria-pressed={extra === e}
            className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-azure ${
              extra === e ? 'border-azure bg-azure text-white' : 'border-slate-line text-navy hover:bg-mist'
            }`}
          >
            {EXTRA_TITLES[e]}
          </button>
        ))}
      </nav>

      <SceneControls
        scene={extra ? -1 : scene}
        auto={auto}
        s2={s2}
        setS2={setS2}
        s3={s3}
        setS3={setS3}
        s4={s4}
        setS4={setS4}
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Stage script={script} frame={frame} amb={clock.amb} showFailures={showFailures} showTicker={showTicker} overlay={overlay} />
      </main>

      <div className="border-t border-slate-line bg-white px-5 py-2.5" aria-live="polite">
        <div className="flex min-h-[44px] items-center gap-3">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ background: caption ? TONE_COLOR[caption.tone ?? 'info'] : TONE_COLOR.idle }}
            aria-hidden="true"
          />
          <AnimatePresence mode="wait">
            <motion.p
              key={caption?.text ?? ''}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-pretty text-[15px] font-medium leading-snug md:text-[17px]"
            >
              {caption?.text ?? 'Seleccione una escena para comenzar.'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-line bg-mist px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <IconBtn label={playing && !atEnd ? 'Pausar' : atEnd ? 'Repetir' : 'Reproducir'} onClick={togglePlay} primary disabled={script.duration === 0}>
            {playing && !atEnd ? <Pause className="size-4" /> : <Play className="size-4" />}
          </IconBtn>
          <IconBtn label="Reiniciar escena" onClick={() => restart(script.duration !== 0)}>
            <RotateCcw className="size-4" />
          </IconBtn>
          <IconBtn label="Escena siguiente" onClick={next} disabled={!!extra || scene >= SCENES.length - 1}>
            <SkipForward className="size-4" />
          </IconBtn>
        </div>

        <div className="flex min-w-[160px] flex-1 items-center gap-3">
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
            <span className="text-[12px] text-slate-ink">
              {script.duration === 0 ? 'Seleccione un caso para iniciar la simulación.' : 'Simulación continua: ajuste el volumen y la actividad.'}
            </span>
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
              className={`rounded-md px-2 py-1 text-[12px] font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-azure ${
                speed === s ? 'bg-navy text-white' : 'bg-white text-navy ring-1 ring-slate-line hover:bg-white/60'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
          <input type="checkbox" checked={showFailures} onChange={(e) => setShowFailures(e.target.checked)} className="size-4 accent-alert" />
          Mostrar fallos posibles
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
          <input type="checkbox" checked={auto} onChange={toggleAuto} className="size-4 accent-azure" />
          Recorrido automático
        </label>
      </footer>
    </div>
  )
}

function IconBtn({
  label,
  onClick,
  children,
  primary,
  disabled,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-azure disabled:cursor-not-allowed disabled:opacity-40 ${
        primary ? 'bg-navy text-white hover:bg-navy/90' : 'bg-white text-navy ring-1 ring-slate-line hover:bg-white/60'
      }`}
    >
      {children}
    </button>
  )
}
