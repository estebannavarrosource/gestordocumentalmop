'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Frame, LineFrame, Script, Tone } from '@/lib/sim/types'
import { AMBER, NAVY, OUTCOME_COLOR, RED, STATUS_COLOR, TONE_COLOR } from './icons'
import { NodeView } from './node-view'

const FAIL_LABELS: Record<string, string[]> = {
  sp: ['HTTP 429 / 503', 'PENDIENTE', 'timeout'],
  ssd: ['SSD sin respuesta', 'PENDIENTE', 'reintento'],
  ext: ['reintento', 'PENDIENTE', 'sin confirmar'],
}

function failLabel(line: LineFrame, amb: number) {
  const ids = `${line.from} ${line.to}`
  const k = /ssd/.test(ids) ? 'ssd' : /(^|[ _])sp|r_obj/.test(ids) ? 'sp' : 'ext'
  const list = FAIL_LABELS[k]
  const seed = (line.key.length * 7) % list.length
  return list[(Math.floor(amb / 2200) + seed) % list.length]
}

const LINE_STYLE = {
  idle: { stroke: '#C5D0DE', w: 2, dash: undefined as string | undefined },
  run: { stroke: '#1672B8', w: 3.5, dash: '9 7' },
  wait: { stroke: '#F59E0B', w: 3.5, dash: '4 7' },
  ok: { stroke: '#15966B', w: 3.5, dash: undefined },
  err: { stroke: '#D92D32', w: 4, dash: undefined },
}

interface Props {
  script: Script
  frame: Frame
  amb: number
  volumeVisible?: boolean
  showFailures: boolean
  showTicker?: boolean
  overlay?: React.ReactNode
}

export function Stage({ script, frame, amb, showFailures, showTicker = true, overlay }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1280, h: 600 })
  const { w: W, h: H } = script.stage

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const scale = Math.max(0.55, Math.min(size.w / W, size.h / H))
  const groups = script.nodes.filter((n) => n.kind === 'group')
  const others = script.nodes.filter((n) => n.kind !== 'group')
  const bp = script.bannerPos ?? { x: 40, y: 498, w: 1050 }

  const renderNode = (def: (typeof script.nodes)[number]) => {
    const nf = frame.nodes[def.id]
    return (
      <NodeView
        key={def.id}
        def={def}
        status={nf.status}
        badge={nf.badge}
        x={Math.round(nf.x * 2) / 2}
        y={Math.round(nf.y * 2) / 2}
        opacity={Math.round(nf.opacity * 100) / 100}
        scale={Math.round(nf.scale * 100) / 100}
        pulse={nf.pulse}
        pulseAlpha={Math.round(nf.pulseAlpha * 10) / 10}
        volume={frame.volume}
        showFailures={showFailures}
      />
    )
  }

  return (
    <div ref={hostRef} className="relative flex h-full w-full overflow-auto sim-grid">
      <div className="relative m-auto shrink-0" style={{ width: W * scale, height: H * scale }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          {groups.map(renderNode)}

          <svg className="pointer-events-none absolute inset-0 z-[1]" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {frame.lines.map((l) => {
              const st = LINE_STYLE[l.state]
              const failing = showFailures && l.independent
              const idle = l.state === 'idle'
              const stroke = failing && idle ? RED : st.stroke
              const dash = failing && idle ? '10 8' : st.dash
              const width = failing && idle ? 2.6 : st.w
              const op = (idle && l.faint && !failing ? 0.55 : 1) * l.opacity
              return (
                <line
                  key={l.key}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeDasharray={dash}
                  strokeDashoffset={dash ? -(frame.t / 28) % 100 : 0}
                  strokeLinecap="round"
                  opacity={op}
                />
              )
            })}
          </svg>

          {others.map(renderNode)}

          <svg className="pointer-events-none absolute inset-0 z-[3]" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {showFailures &&
              frame.lines
                .filter((l) => l.independent && !l.ephemeral)
                .map((l) => {
                  const x = (l.x1 + l.x2) / 2
                  const y = (l.y1 + l.y2) / 2
                  const text = failLabel(l, amb)
                  const wd = text.length * 6.6 + 18
                  return (
                    <g key={`f${l.key}`} transform={`translate(${x} ${y})`}>
                      <rect x={-wd / 2} y={-11} width={wd} height={22} rx={11} fill="#FFFFFF" stroke={AMBER} strokeWidth={2} />
                      <text textAnchor="middle" y={4} fontSize={11} fontWeight={700} fill="#B45309">
                        {text}
                      </text>
                    </g>
                  )
                })}

            {frame.waits.map((w) => (
              <g key={w.key} transform={`translate(${w.x} ${w.y})`}>
                <circle r={19} fill="#FFFFFF" stroke={w.tone === 'error' ? RED : AMBER} strokeWidth={3} />
                <g transform={`rotate(${((frame.t / 6) % 360).toFixed(1)})`}>
                  <path d="M-6,-8 H6 L0,0 L6,8 H-6 L0,0 Z" fill={w.tone === 'error' ? 'rgba(217,45,50,.25)' : 'rgba(245,158,11,.3)'} stroke={w.tone === 'error' ? RED : AMBER} strokeWidth={2} strokeLinejoin="round" />
                </g>
                {w.label && (
                  <g transform="translate(0 38)">
                    <rect x={-(w.label.length * 3.4 + 12)} y={-11} width={w.label.length * 6.8 + 24} height={22} rx={11} fill="#FFFFFF" stroke={AMBER} strokeWidth={2} />
                    <text textAnchor="middle" y={4} fontSize={11} fontWeight={700} fill="#B45309">
                      {w.label}
                    </text>
                  </g>
                )}
              </g>
            ))}

            {frame.packets.map((p) => {
              const c = OUTCOME_COLOR[p.outcome]
              const r = p.big ? 10 : 7
              return (
                <g key={p.key} transform={`translate(${p.x} ${p.y})`} opacity={p.opacity}>
                  <circle r={r + 7} fill={c} opacity={0.18} />
                  <circle r={r} fill={c} stroke="#FFFFFF" strokeWidth={2.5} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />
                  {p.big && <rect x={-4} y={-5} width={8} height={10} rx={1.5} fill="#FFFFFF" />}
                  {p.outcome === 'lost' && p.opacity < 0.95 && (
                    <path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
                  )}
                  {p.label && (
                    <text
                      y={-r - 12}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={700}
                      fill={NAVY}
                      stroke="#F3F6FA"
                      strokeWidth={4}
                      paintOrder="stroke"
                      strokeLinejoin="round"
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {overlay}

          <AnimatePresence mode="wait">
            {frame.banner && (
              <motion.div
                key={frame.banner.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="absolute z-[5] flex justify-center"
                style={{ left: bp.x, top: bp.y, width: bp.w }}
              >
                <BannerPill text={frame.banner.text} tone={frame.banner.tone ?? 'info'} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showTicker && frame.ticker.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden w-[300px] flex-col gap-1 rounded-lg border border-slate-line bg-white/90 p-2.5 font-mono text-[11px] text-navy shadow-sm backdrop-blur md:flex">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-ink">Operaciones</div>
          {frame.ticker.map((e, i) => (
            <div key={`${e.text}${i}`} className="flex items-center gap-2" style={{ opacity: 0.45 + (i + 1) * 0.18 }}>
              <span className="size-2 shrink-0 rounded-full" style={{ background: TONE_COLOR[e.tone as Tone] ?? STATUS_COLOR.running }} />
              <span className="truncate">{e.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BannerPill({ text, tone }: { text: string; tone: Tone }) {
  const info = tone === 'info'
  const c = TONE_COLOR[tone]
  return (
    <div
      className={info ? 'rounded-2xl px-7 py-4 text-center text-[24px] font-bold leading-snug text-white shadow-lg text-balance' : 'rounded-xl border-2 bg-white px-5 py-2.5 text-center text-[20px] font-bold leading-snug shadow-md text-balance'}
      style={info ? { background: NAVY } : { borderColor: c, color: tone === 'idle' ? NAVY : c }}
    >
      {text}
    </div>
  )
}
