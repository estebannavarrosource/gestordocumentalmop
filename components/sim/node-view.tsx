'use client'

import { memo } from 'react'
import type { NodeDef, Outcome, Status } from '@/lib/sim/types'
import { NAVY, OUTCOME_COLOR, RED, SimIcon, STATUS_COLOR } from './icons'

const DOTS = [3, 8, 16, 30]

interface Props {
  def: NodeDef
  status: Status
  badge: string | null
  x: number
  y: number
  opacity: number
  scale: number
  pulse: Outcome | null
  pulseAlpha: number
  volume: number
  showFailures: boolean
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function NodeViewImpl({ def, status, badge, x, y, opacity, scale, pulse, pulseAlpha, volume, showFailures }: Props) {
  if (opacity <= 0.01) return null
  const color = STATUS_COLOR[status]
  const navy = def.emphasis === 'navy'
  const failureRing = showFailures && def.independent
  const borderColor = failureRing ? RED : status === 'idle' && navy ? NAVY : color

  const glow: string[] = []
  if (status === 'running') glow.push(`0 0 0 4px ${hexA(color, 0.18)}`)
  if (pulse && pulseAlpha > 0) {
    const pc = OUTCOME_COLOR[pulse]
    glow.push(`0 0 0 ${3 + 5 * pulseAlpha}px ${hexA(pc, 0.32 * pulseAlpha)}`)
  }
  if (def.dense && volume > 0) {
    for (let i = 1; i <= volume; i++) glow.push(`${i * 3}px ${i * 3}px 0 -1px #ffffff, ${i * 3}px ${i * 3}px 0 0 #CBD5E1`)
  }
  if (!navy && def.kind !== 'group') glow.push('0 2px 6px rgba(16,42,76,0.08)')

  const style: React.CSSProperties = {
    left: x,
    top: y,
    width: def.w,
    height: def.h,
    opacity,
    transform: scale === 1 ? undefined : `scale(${scale})`,
    borderColor,
    boxShadow: glow.join(', ') || undefined,
    zIndex: def.kind === 'group' ? 0 : 2,
  }

  if (def.kind === 'group') {
    return (
      <div
        className="absolute rounded-2xl border-2 bg-white/70 backdrop-blur-[1px]"
        style={{ ...style, borderStyle: failureRing || def.dashed ? 'dashed' : 'solid', borderColor: failureRing ? RED : status === 'idle' ? '#B8C6D8' : color }}
      >
        <div className="flex items-center gap-2.5 px-4 pt-3">
          <span className="grid size-7 place-items-center rounded-md bg-navy text-white">
            <SimIcon name={def.icon} className="size-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-bold text-navy">{def.label}</div>
            {def.sub && <div className="truncate text-[11px] text-slate-ink">{def.sub}</div>}
          </div>
        </div>
        {failureRing && (
          <span className="absolute -top-3 right-4 rounded-full bg-alert px-2.5 py-0.5 text-[11px] font-semibold text-white">
            servicio independiente
          </span>
        )}
        {badge && <Badge text={badge} color={color} />}
      </div>
    )
  }

  const textColor = navy ? '#FFFFFF' : NAVY
  const subColor = navy ? 'rgba(255,255,255,0.72)' : '#5B6B82'
  const chip = def.kind === 'chip'

  return (
    <div
      className="absolute flex flex-col justify-center rounded-xl border-2"
      style={{
        ...style,
        borderStyle: def.dashed || failureRing ? 'dashed' : 'solid',
        background: navy ? NAVY : '#FFFFFF',
        color: textColor,
        padding: chip ? (def.small ? '4px 6px' : '6px 10px') : '10px 14px',
      }}
    >
      {def.parts ? (
        <>
          <div className="flex items-center gap-2">
            <SimIcon name={def.icon} className="size-5" />
            <div className="leading-tight">
              <div className="text-[17px] font-bold">{def.label}</div>
              <div className="font-mono text-[11px]" style={{ color: subColor }}>
                {def.sub}
              </div>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {def.parts.map((p) => (
              <span key={p} className="truncate rounded-md bg-white/12 px-1.5 py-1 text-center text-[10.5px] font-medium ring-1 ring-white/25">
                {p}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          {!def.small && (
            <span
              className="grid shrink-0 place-items-center rounded-md"
              style={{
                width: chip ? 28 : 36,
                height: chip ? 28 : 36,
                background: navy ? 'rgba(255,255,255,0.14)' : hexA(color, 0.14),
                color: navy ? '#FFFFFF' : color,
              }}
            >
              <SimIcon name={def.icon} className={chip ? 'size-4' : 'size-5'} />
            </span>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <div
              className="font-semibold [overflow-wrap:anywhere]"
              style={{ fontSize: chip ? (def.small ? 11 : 12) : 15, lineHeight: 1.15 }}
            >
              {def.label}
            </div>
            {def.sub && (
              <div className="mt-0.5 truncate" style={{ fontSize: chip ? 10 : 11.5, color: subColor }}>
                {def.sub}
              </div>
            )}
          </div>
        </div>
      )}
      {def.dense && (
        <div className="mt-1.5 flex flex-wrap gap-[2px]" style={{ maxHeight: 12, overflow: 'hidden' }}>
          {Array.from({ length: DOTS[volume] }).map((_, i) => (
            <span key={i} className="size-[4px] rounded-[1px]" style={{ background: hexA(color, 0.55) }} />
          ))}
        </div>
      )}
      {badge && <Badge text={badge} color={color} />}
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="absolute -bottom-3 right-2 z-10 max-w-[96%] truncate whitespace-nowrap rounded-full border bg-white px-2 py-[1px] text-[10.5px] font-bold leading-4"
      style={{ borderColor: color, color }}
    >
      {text}
    </span>
  )
}

export const NodeView = memo(NodeViewImpl)
