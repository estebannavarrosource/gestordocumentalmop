import { Builder } from '../builder'
import type { LinkDef, NodeDef, Script } from '../types'

export const TIMELINE = [
  { date: '14/01/2025', label: 'Creación', icon: 'FolderOpen' },
  { date: '03/02/2025', label: 'Incorporación de documento', icon: 'FileText' },
  { date: '10/03/2025', label: 'Cambio de estado', icon: 'RefreshCw' },
  { date: '22/04/2025', label: 'Nueva versión de documento', icon: 'Layers' },
  { date: '05/06/2025', label: 'Nueva actuación', icon: 'ScrollText' },
  { date: '18/07/2025', label: 'Vinculación con otro expediente', icon: 'Link2' },
  { date: '02/09/2025', label: 'Rectificación', icon: 'Replace' },
  { date: '20/11/2025', label: 'Cierre', icon: 'Lock' },
]

const SNAPSHOTS = [1, 4] // índices de eventos tras los cuales existe un snapshot

const TASKS: { id: string; label: string; icon: string; src: 'h_pg' | 'h_sp' }[] = [
  { id: 'h_t0', label: 'Recuperar registros', icon: 'Database', src: 'h_pg' },
  { id: 'h_t1', label: 'Consultar actuaciones y eventos', icon: 'ScrollText', src: 'h_pg' },
  { id: 'h_t2', label: 'Resolver relaciones', icon: 'Share2', src: 'h_pg' },
  { id: 'h_t3', label: 'Identificar versiones documentales', icon: 'Layers', src: 'h_sp' },
  { id: 'h_t4', label: 'Verificar referencias', icon: 'Link2', src: 'h_sp' },
  { id: 'h_t5', label: 'Componer el índice', icon: 'ListTree', src: 'h_pg' },
  { id: 'h_t6', label: 'Reconstruir el estado correspondiente', icon: 'History', src: 'h_pg' },
]

export const HISTORY_FINAL = 'Conservar documentos y registros no equivale a disponer de una reconstrucción integral del expediente.'

export function buildScene4(target: number): Script {
  const b = new Builder()
  const nodes: NodeDef[] = []
  const links: LinkDef[] = []

  // línea temporal compartida
  TIMELINE.forEach((e, i) => {
    nodes.push({
      id: `tl${i}`,
      kind: 'chip',
      label: e.label,
      sub: e.date,
      icon: e.icon,
      small: true,
      dashed: i > target,
      x: 110 + i * (1380 / 7) - 82,
      y: 40,
      w: 164,
      h: 64,
    })
    if (i > 0) links.push({ from: `tl${i - 1}`, to: `tl${i}`, faint: true })
  })

  // ---- lado izquierdo: SME propuesto -----------------------------------------
  nodes.push({ id: 'h_pg', kind: 'card', label: 'PostgreSQL', sub: 'registros relacionados', icon: 'Database', x: 30, y: 280, w: 190, h: 96 })
  nodes.push({ id: 'h_sp', kind: 'card', label: 'SharePoint', sub: 'archivos y versiones', icon: 'Cloud', x: 30, y: 440, w: 190, h: 96, independent: true })
  TASKS.forEach((t, i) => {
    nodes.push({ id: t.id, kind: 'chip', label: t.label, icon: t.icon, dashed: true, x: 330, y: 210 + i * 60, w: 360, h: 48 })
    links.push({ from: t.src, to: t.id, faint: true })
    if (i > 0) links.push({ from: TASKS[i - 1].id, to: t.id, faint: true })
  })
  nodes.push({
    id: 'h_out',
    kind: 'card',
    label: 'Vista histórica integral',
    sub: 'No definida en la especificación',
    icon: 'FileWarning',
    dashed: true,
    x: 330,
    y: 640,
    w: 360,
    h: 72,
  })
  links.push({ from: 'h_t6', to: 'h_out', faint: true })

  // ---- lado derecho: modelo documental de referencia --------------------------
  const evX = (i: number) => 846 + i * 88
  TIMELINE.forEach((_, i) => {
    nodes.push({ id: `r_e${i}`, kind: 'chip', small: true, label: `E${i + 1}`, icon: 'History', x: evX(i), y: 232, w: 78, h: 46 })
  })
  SNAPSHOTS.forEach((idx, k) => {
    nodes.push({
      id: `r_s${k}`,
      kind: 'chip',
      label: 'Snapshot',
      sub: `tras E${idx + 1}`,
      icon: 'Camera',
      x: evX(idx) + 39 - 62,
      y: 340,
      w: 124,
      h: 56,
    })
    links.push({ from: `r_e${idx}`, to: `r_s${k}`, faint: true })
  })
  nodes.push({ id: 'r_objs', kind: 'card', label: 'Repositorio de objetos digitales', sub: 'versiones de documentos', icon: 'Archive', x: 850, y: 450, w: 330, h: 80 })
  nodes.push({ id: 'r_state', kind: 'card', label: 'Estado materializado', sub: 'documento rector', icon: 'FolderOpen', emphasis: 'navy', x: 1230, y: 450, w: 310, h: 80 })
  nodes.push({ id: 'r_result', kind: 'card', label: 'Composición histórica', sub: 'estado + versiones a la fecha', icon: 'History', x: 1000, y: 610, w: 380, h: 80 })
  links.push({ from: 'r_objs', to: 'r_state', faint: true }, { from: 'r_state', to: 'r_result', faint: true }, { from: 'r_objs', to: 'r_result', faint: true })
  for (let i = 0; i < 8; i++) links.push({ from: `r_e${i}`, to: 'r_state', faint: true })

  // ---- guion -------------------------------------------------------------------
  b.cap(0, `Se consulta el expediente tal como estaba el ${TIMELINE[target].date}.`, 'info')
  TIMELINE.forEach((_, i) => {
    if (i < target) b.ev(300 + i * 90, `tl${i}`, 'ok')
    if (i === target) b.ev(300 + i * 90, `tl${i}`, 'running', 'fecha consultada')
  })

  // SME propuesto: tareas necesarias
  b.cap(1500, 'En el SME propuesto, la vista histórica exige resolver por separado registros, relaciones y versiones.', 'pending')
  b.ev(1500, 'h_pg', 'running')
  b.ev(1500, 'h_sp', 'running')
  let tt = 1700
  TASKS.forEach((t, i) => {
    const s = tt + i * 1050
    b.op(t.src, t.id, s, 650, { event: t.label })
    b.ev(s + 650, t.id, 'running')
    b.ev(s + 1300, t.id, 'pending')
    if (i > 0) b.op(TASKS[i - 1].id, t.id, s + 300, 500)
  })
  const leftEnd = tt + TASKS.length * 1050 + 300
  b.op('h_t6', 'h_out', leftEnd - 300, 650, { outcome: 'pending', hold: 800, holdLabel: 'sin operación definida' })
  b.ev(leftEnd + 800, 'h_out', 'pending', 'no definida')

  // Modelo de referencia: snapshot + eventos + versiones
  const snapK = SNAPSHOTS.reduce((acc, idx, k) => (idx <= target ? k : acc), -1)
  const startEv = snapK >= 0 ? SNAPSHOTS[snapK] + 1 : 0
  let r = 1500
  b.ev(r, `r_e${target}`, 'running', 'fecha')
  if (snapK >= 0) {
    b.op(`r_e${target}`, `r_s${snapK}`, r, 800, { label: 'localizar', event: 'Localizar snapshot ≤ fecha' })
    b.ev(r + 800, `r_s${snapK}`, 'ok', 'seleccionado')
    r += 900
    b.op(`r_s${snapK}`, 'r_state', r, 700, { label: 'cargar' })
    b.ev(r + 700, 'r_state', 'running', 'snapshot cargado')
    r += 800
  } else {
    b.op(`r_e${target}`, 'r_state', r, 800, { label: 'sin snapshot' })
    b.ev(r + 800, 'r_state', 'running', 'estado inicial')
    r += 900
  }
  for (let i = startEv; i <= target; i++) {
    b.op(`r_e${i}`, 'r_state', r, 600, { event: `Aplicar evento E${i + 1}` })
    b.ev(r + 600, `r_e${i}`, 'ok', 'aplicado')
    r += 550
  }
  r += 300
  b.op('r_state', 'r_objs', r, 650, { label: 'versiones' })
  b.ev(r + 650, 'r_objs', 'running')
  b.op('r_objs', 'r_state', r + 700, 650, { label: 'refs' })
  b.ev(r + 1350, 'r_objs', 'ok')
  r += 1400
  b.op('r_state', 'r_result', r, 700)
  b.op('r_objs', 'r_result', r, 700)
  b.ev(r + 700, 'r_state', 'ok', null)
  b.ev(r + 700, 'r_result', 'ok', `estado al ${TIMELINE[target].date}`)
  b.cap(r + 800, 'Modelo de referencia (conceptual): snapshot, eventos posteriores y versiones. No es una prueba de superioridad medida.', 'ok')

  const end = Math.max(leftEnd + 1000, r + 800)
  b.cap(end + 1800, HISTORY_FINAL, 'info')
  return b.build({ id: `scene4-${target}`, duration: end + 1800 + 6500, nodes, links, overlay: 'history', meta: { target } })
}
