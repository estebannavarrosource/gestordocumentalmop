'use client'

import type { Scene2Variant } from '@/lib/sim/scenes/scene2'
import { ACTIVITY_LABELS, VOLUME_LABELS } from '@/lib/sim/scenes/scene3'
import { TIMELINE } from '@/lib/sim/scenes/scene4'

interface S3 {
  volume: number
  activity: number
  tour: boolean
}

interface Props {
  scene: number
  auto: boolean
  s2: Scene2Variant
  setS2: (v: Scene2Variant) => void
  s3: S3
  setS3: (v: S3) => void
  s4: number
  setS4: (n: number) => void
}

function Seg({ options, value, onChange, label }: { options: string[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-semibold text-slate-ink">{label}</span>
      <div className="flex overflow-hidden rounded-lg ring-1 ring-slate-line" role="group" aria-label={label}>
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === i}
            onClick={() => onChange(i)}
            className={`px-3 py-1.5 text-[12.5px] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-azure ${
              value === i ? 'bg-azure text-white' : 'bg-white text-navy hover:bg-mist'
            }`}
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
      className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-azure ${
        active ? 'bg-azure text-white ring-azure' : 'bg-white text-navy ring-slate-line hover:bg-mist'
      }`}
    >
      {children}
    </button>
  )
}

export function SceneControls({ scene, auto, s2, setS2, s3, setS3, s4, setS4 }: Props) {
  if (scene < 0 || scene === 0 || scene === 4) return null
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-line bg-mist px-4 py-2">
      {scene === 1 && (
        <>
          <span className="text-[12px] font-semibold text-slate-ink">Caso a simular</span>
          <Action active={!auto && s2 === 'normal'} onClick={() => setS2('normal')}>
            Incorporar documento
          </Action>
          <Action active={!auto && s2 === 'throttle'} onClick={() => setS2('throttle')}>
            Límite de solicitudes (HTTP 429)
          </Action>
          <Action active={!auto && s2 === 'lost'} onClick={() => setS2('lost')}>
            Respuesta perdida
          </Action>
          <Action active={!auto && s2 === 'tour'} onClick={() => setS2('tour')}>
            Los tres casos
          </Action>
        </>
      )}
      {scene === 2 && (
        <>
          <Seg label="Volumen documental" options={VOLUME_LABELS} value={s3.volume} onChange={(i) => setS3({ ...s3, volume: i, tour: false })} />
          <Seg label="Actividad transaccional" options={ACTIVITY_LABELS} value={s3.activity} onChange={(i) => setS3({ ...s3, activity: i, tour: false })} />
          <Action active={s3.tour || auto} onClick={() => setS3({ ...s3, tour: true })}>
            Recorrido guiado
          </Action>
        </>
      )}
      {scene === 3 && (
        <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-ink">
          Fecha a consultar
          <select
            value={s4}
            onChange={(e) => setS4(Number(e.target.value))}
            className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-navy ring-1 ring-slate-line focus-visible:outline-2 focus-visible:outline-azure"
          >
            {TIMELINE.map((e, i) => (
              <option key={e.date} value={i}>
                {e.date} · {e.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
