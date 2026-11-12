import { archLinks, archNodes, without } from '../arch'
import { Builder } from '../builder'
import type { LinkDef, Script } from '../types'

export const VOLUME_LABELS = ['Bajo', 'Medio', 'Alto', 'Muy alto']
export const ACTIVITY_LABELS = ['Baja', 'Media', 'Alta', 'Muy alta']

export type Scene3Mode = { kind: 'manual'; volume: number; activity: number } | { kind: 'tour' }

const TABLES = [
  'tbl_documento',
  'tbl_exp_doc',
  'tbl_indice',
  'tbl_evento',
  'tbl_actuacion',
  'tbl_relaciones',
  'tbl_firma',
]

/** PRNG determinista (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SP_LIMIT = 2 // límite ilustrativo de solicitudes simultáneas hacia el repositorio documental

function traffic(b: Builder, V: number, A: number, from: number, len: number, fit: boolean, seed: number) {
  const r = rng(seed * 7919 + V * 31 + A * 101)
  const sec = len / 1000
  const Q = [0.3, 0.6, 1.0, 1.5][A]
  const U = [0.12, 0.25, 0.55, 0.9][A]
  const K = [2, 3, 4, 5][V]
  const nQ = Math.max(1, Math.round(Q * sec))
  const nU = Math.max(1, Math.round(U * sec))

  const qWindow = Math.max(500, len - (fit ? 3000 : 0))
  for (let i = 0; i < nQ; i++) {
    const s = Math.max(from + 700, from + ((i + r() * 0.7) / nQ) * qWindow)
    b.op('users', 'api', s - 650, 600, { label: 'solicitud' })
    if (i % 3 === 2) {
      b.op('api', 'tbl_expediente', s, 650, { event: 'UPDATE estado' })
      b.op('api', 'tbl_indice', s + 250, 650, { event: 'UPDATE índice' })
      b.op('api', 'tbl_evento', s + 500, 650, { final: true })
      continue
    }
    const picks = ['tbl_expediente']
    const pool = [...TABLES]
    while (picks.length < K) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0])
    picks.forEach((t, j) => {
      const ts = s + j * 230
      b.op('api', t, ts, 650, j === 0 ? { event: 'consulta relacional' } : {})
      b.op(t, 'api', ts + 680, 650, j === picks.length - 1 ? { final: true } : {})
    })
  }

  const inflight: number[] = []
  const uWindow = Math.max(400, len - (fit ? 6400 : 0))
  for (let i = 0; i < nU; i++) {
    const s = Math.max(from + 700, from + ((i + 0.15 + r() * 0.6) / nU) * uWindow)
    b.op('users', 'api', s - 650, 600, { label: 'carga' })
    const busy = inflight.filter((e) => e > s).length
    if (busy >= SP_LIMIT) {
      b.op('api', 'sp_files', s, 900, { big: true, event: 'carga de documento' })
      b.op('sp_files', 'api', s + 900, 700, { outcome: 'error', label: '429', hold: 1300, holdLabel: 'reintento', event: 'HTTP 429' })
      b.op('sp_files', 'sp_queue', s + 900, 450, { outcome: 'pending' })
      const s2 = s + 2900
      b.op('api', 'sp_files', s2, 900, { big: true, event: 'reintento' })
      b.op('sp_files', 'api', s2 + 900, 700)
      b.op('api', 'tbl_concil', s2 + 1650, 600, { coord: true, outcome: 'pending', hold: 900, holdLabel: 'conciliar', final: true })
      inflight.push(s + 1600, s2 + 1600)
    } else {
      b.op('api', 'sp_files', s, 900, { big: true, event: 'carga de documento' })
      b.op('sp_files', 'api', s + 900, 700)
      b.op('api', 'tbl_exp_doc', s + 1700, 650)
      b.op('api', 'tbl_indice', s + 1700, 650, { final: true })
      inflight.push(s + 1600)
    }
  }
}

function nodes() {
  const base = without(archNodes(), ['exp', 'doc'])
  base.push({ id: 'users', kind: 'card', label: 'Usuarios', sub: 'solicitudes concurrentes', icon: 'Users', x: 25, y: 185, w: 200, h: 130 })
  return base
}

function links(): LinkDef[] {
  return [...archLinks().filter((l) => l.from !== 'exp' && l.from !== 'doc'), { from: 'users', to: 'api', faint: true }]
}

export const GROWTH_FINAL = 'A mayor actividad, mayor exigencia de coordinación, consultas, mantenimiento y recuperación de operaciones.'

export function buildScene3(mode: Scene3Mode): Script {
  const b = new Builder()
  if (mode.kind === 'manual') {
    const { volume, activity } = mode
    b.volume = [{ at: 0, level: volume }]
    b.activity = [{ at: 0, level: activity }]
    const loop = 14000
    traffic(b, volume, activity, 0, loop, true, 1)
    b.cap(0, GROWTH_FINAL, 'info')
    const s = b.build({ id: `scene3-m${volume}${activity}`, duration: Infinity, loop, nodes: nodes(), links: links(), overlay: 'growth' })
    return s
  }

  const segs: [number, number][] = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
  ]
  const segLen = [8000, 8000, 8000, 10000]
  const notes = [
    'Volumen y actividad bajos: pocas rutas, cada operación se resuelve en pocos saltos.',
    'Crece el volumen: cada consulta compone más entidades y cada carga exige confirmar más referencias.',
    'Con actividad alta aparecen solicitudes en espera, reintentos y operaciones por conciliar.',
    'Con actividad muy alta operan muchas rutas a la vez, y también crece el trabajo de recuperación.',
  ]
  b.volume = []
  b.activity = []
  let at = 0
  segs.forEach(([V, A], i) => {
    b.volume.push({ at, level: V })
    b.activity.push({ at, level: A })
    traffic(b, V, A, at, segLen[i], false, i + 3)
    b.cap(at, notes[i], 'info')
    at += segLen[i]
  })
  b.cap(at + 800, GROWTH_FINAL, 'info')
  return b.build({ id: 'scene3-tour', duration: at + 7500, nodes: nodes(), links: links(), overlay: 'growth' })
}
