import { Builder, concat } from '../builder'
import type { NodeDef, Script } from '../types'
import { chip, v3Finish, v3Nodes, v3Links } from './arch'

// ===========================================================================
// Escena 3 · crecimiento
// ===========================================================================
export const EXP_LABELS = ['10 mil', '100 mil', '1 millón', '5 millones']
export const DOCS_LABELS = ['20', '200', '2.000', '20.000']
export const Q_LABELS = ['Baja', 'Media', 'Alta', 'Muy alta']
export const U_LABELS = ['Baja', 'Media', 'Alta', 'Muy alta']

export interface GrowthLevels {
  exp: number
  docs: number
  q: number
  u: number
}

const CYCLE = 9000
const QN = [2, 5, 9, 14]
const UN = [1, 2, 4, 6]
const WORKERS = ['wk_verif', 'wk_proc', 'wk_snap', 'wk_idx', 'wk_pres']

export const packLevels = (l: GrowthLevels) => ({ volume: l.exp * 10 + l.docs, activity: l.q * 10 + l.u })
export const unpackLevels = (volume: number, activity: number): GrowthLevels => ({
  exp: Math.floor(volume / 10),
  docs: volume % 10,
  q: Math.floor(activity / 10),
  u: activity % 10,
})

const pages = (docs: number) => Math.max(1, Math.ceil([20, 200, 2000, 20000][docs] / 500))

function cycle(b: Builder, l: GrowthLevels) {
  const pk = packLevels(l)
  b.volume = [{ at: 0, level: pk.volume }]
  b.activity = [{ at: 0, level: pk.activity }]

  const nq = QN[l.q]
  const nu = UN[l.u]

  b.ev(200, 'mg_cur', 'running', 'lecturas directas')
  b.ev(200, 'mg_items', 'running', `${pages(l.docs)} pág. de 500`)
  b.ev(200, 'mg_events', 'ok', 'historia aparte')
  b.ev(CYCLE - 400, 'mg_cur', 'ok', 'lecturas directas')

  for (let i = 0; i < nq; i++) {
    const s = 300 + i * (6500 / nq)
    b.op('an_cons', 'gw_route', s, 450)
    b.op('gw_route', 'xp_rector', s + 450, 350)
    b.op('xp_rector', 'mg_cur', s + 800, 400, { tag: 'rector' })
    b.op('mg_cur', 'an_cons', s + 1250, 800, { tag: 'consulta' })
    if (i % 2 === 0) b.op('xp_indice', 'mg_items', s + 700, 500, { label: i === 0 ? 'pág. 1' : undefined })
  }
  if (l.q >= 1) b.op('hi_rec', 'mg_events', 3200, 600, { label: 'historia' })

  for (let j = 0; j < nu; j++) {
    const s = 300 + j * (3200 / nu)
    const w = WORKERS[j % WORKERS.length]
    b.op('gw_route', 'mg_outbox', s, 500, { outcome: 'pending', hold: 2200 })
    b.ev(s + 500, 'mg_outbox', 'pending', `${nu} pendientes`)
    b.op('an_vis', 'os_pdf', s + 300, 2200, { big: true })
    b.ev(s + 2500, 'os_pdf', 'running', 'recibiendo')
    b.op('os_pdf', w, s + 2500, 600)
    b.ev(s + 3100, w, 'running')
    b.op(w, 'mg_obj', s + 3200, 600, { tag: 'objeto' })
    b.ev(s + 3800, 'mg_obj', 'ok', 'referencias + hashes')
    b.ev(s + 4000, w, 'ok')
  }
  b.ev(CYCLE - 500, 'mg_outbox', 'ok', 'completadas')
}

function growthNodes(): NodeDef[] {
  return v3Nodes()
}

export function buildV3Growth(mode: { kind: 'manual'; levels: GrowthLevels } | { kind: 'tour' }): Script {
  const nodes = growthNodes()
  const links = [...v3Links(), { from: 'an_vis', to: 'os_pdf', bend: 0.3, faint: true }]
  if (mode.kind === 'manual') {
    const b = new Builder()
    cycle(b, mode.levels)
    b.cap(0, 'Ajuste volumen y actividad: el documento rector se lee directo; el crecimiento ocurre en índice, historia y objetos.', 'info')
    return v3Finish(b, { id: 'v3s3-manual', duration: Infinity, loop: CYCLE, nodes, links, overlay: 'growth' })
  }
  const stages: [GrowthLevels, string][] = [
    [{ exp: 0, docs: 0, q: 0, u: 0 }, 'Comienza con una operación normal: una lectura directa y una carga.'],
    [{ exp: 1, docs: 1, q: 1, u: 1 }, 'Crece el volumen: el documento rector sigue siendo compacto; el índice se reparte en páginas.'],
    [{ exp: 2, docs: 2, q: 2, u: 2 }, 'Más consultas y cargas simultáneas: los bytes van directo al Object Storage y los workers absorben el trabajo.'],
    [{ exp: 3, docs: 3, q: 3, u: 3 }, 'Volumen y actividad altos: se escalan lecturas, workers y almacenamiento sin tocar el documento rector.'],
  ]
  const parts = stages.map(([lv, text], i) => {
    const b = new Builder()
    cycle(b, lv)
    b.cap(0, text, 'info')
    return v3Finish(b, { id: `v3s3-t${i}`, duration: CYCLE, nodes, links, overlay: 'growth' })
  })
  const tour = concat(parts, 0, 'v3s3-tour')
  const extra = new Builder()
  void extra
  return { ...tour, curved: true }
}

// ===========================================================================
// Escena 4 · vista histórica
// ===========================================================================
export const V3_TIMELINE = [
  { date: '14/01/2025', label: 'Creación', icon: 'FolderOpen', stage: 'Iniciado' },
  { date: '03/02/2025', label: 'Incorporación documental', icon: 'FileText', stage: 'Iniciado' },
  { date: '10/03/2025', label: 'Cambio de etapa', icon: 'RefreshCw', stage: 'En revisión' },
  { date: '22/04/2025', label: 'Derivación', icon: 'Send', stage: 'Derivado a Jurídica' },
  { date: '05/06/2025', label: 'Nueva actuación', icon: 'ScrollText', stage: 'Derivado a Jurídica' },
  { date: '18/07/2025', label: 'Nueva versión', icon: 'Layers', stage: 'En revisión (v2)' },
  { date: '02/09/2025', label: 'Vinculación con expediente', icon: 'Link2', stage: 'En revisión (v2)' },
  { date: '20/11/2025', label: 'Cierre', icon: 'Lock', stage: 'Cerrado' },
]
const SNAPS = [0, 2, 5]
const ITEMS = [0, 1, 1, 1, 2, 3, 3, 3]
export const V3_HISTORY_STEPS = [
  'Consultar snapshot previo',
  'Recuperar eventos posteriores',
  'Reproducir hasta la fecha',
  'Identificar versiones exactas',
  'Reconstruir índice, estado y relaciones',
  'Expediente histórico',
]

export function buildV3Scene4(target: number): Script {
  const b = new Builder()
  const nodes = v3Nodes()
  const links = [...v3Links()]
  V3_TIMELINE.forEach((e, i) => {
    nodes.push(chip(`tl${i}`, e.label, e.icon, 12 + i * 197.5, 618, 182, 56, { small: true, sub: e.date, dashed: i > target, compact: false }))
    if (i > 0) links.push({ from: `tl${i - 1}`, to: `tl${i}`, faint: true })
  })

  const snap = [...SNAPS].filter((s) => s <= target).pop() ?? 0
  const replay: number[] = []
  for (let k = snap + 1; k <= target; k++) replay.push(k)
  const date = V3_TIMELINE[target].date

  b.ev(200, 'mg_cur', 'ok', 'estado actual · no se consulta')
  b.cap(0, `Se consulta el expediente tal como estaba el ${date}. El documento rector solo refleja el estado actual.`, 'info')

  // 1 · snapshot
  let t = 1500
  b.step(t, 0, 'running')
  b.cap(t, '1 · Se consulta el snapshot inmediatamente anterior a la fecha solicitada.', 'running')
  b.op('an_cons', 'gw_route', t, 600, { label: `consultar al ${date}` })
  b.op('gw_route', 'hi_rec', t + 600, 700)
  b.ev(t + 1300, 'hi_rec', 'running')
  b.op('hi_rec', 'hi_snap', t + 1350, 500, { label: 'snapshot previo' })
  b.ev(t + 1850, 'hi_snap', 'running')
  b.op('hi_snap', 'mg_snaps', t + 1900, 600)
  b.ev(t + 2500, 'mg_snaps', 'running', `snapshot tras evento ${snap + 1}`)
  b.op('mg_snaps', 'hi_snap', t + 2600, 600, { label: 'estado base' })
  b.ev(t + 3200, 'mg_snaps', 'ok')
  b.ev(t + 3200, 'hi_snap', 'ok', `base: evento ${snap + 1}`)
  b.ev(t + 3200, `tl${snap}`, 'ok')
  b.step(t + 3200, 0, 'ok')

  // 2 · eventos
  t += 3500
  b.step(t, 1, 'running')
  b.cap(t, replay.length ? `2 · Se recuperan los ${replay.length} evento(s) posteriores al snapshot, hasta la fecha consultada.` : '2 · No hay eventos posteriores al snapshot: el snapshot ya coincide con la fecha.', 'running')
  b.op('hi_rec', 'hi_ev', t, 500)
  b.ev(t + 500, 'hi_ev', 'running')
  b.op('hi_ev', 'mg_events', t + 550, 600, { label: replay.length ? `eventos ${snap + 2}–${target + 1}` : 'sin eventos' })
  b.ev(t + 1150, 'mg_events', 'running', 'eventos encadenados')
  b.op('mg_events', 'hi_ev', t + 1250, 700, { label: `${replay.length} eventos` })
  b.ev(t + 1950, 'mg_events', 'ok')
  b.ev(t + 1950, 'hi_ev', 'ok', `${replay.length} eventos`)
  b.step(t + 1950, 1, 'ok')

  // 3 · reproducción
  t += 2200
  b.step(t, 2, 'running')
  b.cap(t, '3 · Los eventos se reproducen en orden sobre el estado del snapshot.', 'running')
  replay.forEach((k, i) => {
    const s = t + i * 1400
    b.ev(s, `tl${k}`, 'running')
    b.op('hi_ev', 'hi_rec', s, 600, { label: V3_TIMELINE[k].label })
    b.ev(s + 600, 'hi_rec', 'running', `aplicando #${k + 1}`)
    b.ev(s + 1100, `tl${k}`, 'ok')
  })
  t += Math.max(600, replay.length * 1400)
  b.ev(t, 'hi_rec', 'ok', `estado: ${V3_TIMELINE[target].stage}`)
  b.step(t, 2, 'ok')

  // 4 · versiones
  t += 300
  b.step(t, 3, 'running')
  b.cap(t, '4 · Se identifican las versiones exactas de cada documento a esa fecha, en el Object Storage.', 'running')
  b.op('hi_rec', 'xp_ver', t, 650)
  b.ev(t + 650, 'xp_ver', 'running')
  b.op('xp_ver', 'mg_obj', t + 700, 650, { label: 'versiones exactas' })
  b.op('mg_obj', 'os_ver', t + 1400, 650)
  b.ev(t + 2050, 'os_ver', 'ok', target >= 5 ? 'v2 · v1 conservada' : 'v1')
  b.ev(t + 2050, 'xp_ver', 'ok')
  b.step(t + 2050, 3, 'ok')

  // 5 · reconstrucción
  t += 2300
  b.step(t, 4, 'running')
  b.cap(t, '5 · Se reconstruyen índice, estado y relaciones correspondientes a la fecha.', 'running')
  for (const id of ['xp_indice', 'xp_rector', 'xp_rel']) b.op('hi_rec', id, t, 700)
  for (const id of ['xp_indice', 'xp_rector', 'xp_rel']) b.ev(t + 700, id, 'running')
  b.ev(t + 1600, 'xp_indice', 'ok', `${ITEMS[target]} ítems`)
  b.ev(t + 1600, 'xp_rector', 'ok', V3_TIMELINE[target].stage)
  b.ev(t + 1600, 'xp_rel', 'ok', target >= 6 ? '1 relación' : 'sin relaciones')
  b.step(t + 1600, 4, 'ok')

  // 6 · resultado
  t += 1900
  b.step(t, 5, 'running')
  b.ev(t + 400, 'iuie', 'ok', `Estado al ${date}`)
  b.ev(t + 400, 'hi_rec', 'ok', 'reconstrucción completa')
  b.step(t + 400, 5, 'ok')
  b.cap(t + 400, `Resultado: el expediente tal como estaba el ${date}, con índice, estado, relaciones y versiones exactas.`, 'ok')
  b.ban(t + 1200, t + 8200, 'La reconstrucción histórica es una capacidad propia del expediente', 'info')

  return v3Finish(b, {
    id: `v3s4-${target}`,
    duration: t + 9000,
    nodes,
    links,
    stepLabels: V3_HISTORY_STEPS,
    overlay: 'history',
    meta: { target },
    bannerPos: { x: 12, y: 696, w: 1576 },
  })
}
