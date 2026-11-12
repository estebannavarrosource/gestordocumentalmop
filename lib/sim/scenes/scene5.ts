import { Builder } from '../builder'
import type { LinkDef, NodeDef, Script } from '../types'

export const COMPARE_OPS = [
  { label: 'Crear expediente', icon: 'FolderOpen' },
  { label: 'Incorporar documento', icon: 'FileText' },
  { label: 'Modificar estado', icon: 'RefreshCw' },
  { label: 'Relacionar otro expediente', icon: 'Link2' },
  { label: 'Consultar estado actual', icon: 'Eye' },
  { label: 'Reconstruir una fecha anterior', icon: 'History' },
]

export const COMPARE_BASE = 1400
export const COMPARE_STEP = 5600
export const compareBase = (i: number) => COMPARE_BASE + i * COMPARE_STEP

export const CORE_IDS = ['r_state', 'r_events', 'r_snap', 'r_index', 'r_rel', 'r_integ', 'r_hist']
export const COMPARE_FINAL =
  'El problema no es almacenar documentos. Es mantener un expediente íntegro, actualizado y reconstruible mientras crecen sus datos, relaciones y transacciones.'

export function buildScene5(): Script {
  const b = new Builder()
  const nodes: NodeDef[] = [
    // ---- SME propuesto
    { id: 'l_api', kind: 'card', label: 'Backend .NET', sub: 'ASP.NET Core 10', icon: 'Server', emphasis: 'navy', x: 30, y: 290, w: 160, h: 110 },
    { id: 'l_pg', kind: 'card', label: 'PostgreSQL', sub: 'entidades relacionadas', icon: 'Database', x: 280, y: 130, w: 230, h: 90 },
    { id: 'l_sp', kind: 'card', label: 'SharePoint Online', sub: 'archivos y versiones', icon: 'Cloud', independent: true, x: 280, y: 250, w: 230, h: 90 },
    { id: 'l_ssd', kind: 'card', label: 'SSD', sub: 'tramitación oficial', icon: 'Route', independent: true, x: 280, y: 370, w: 230, h: 90 },
    { id: 'l_ext', kind: 'card', label: 'Firma · Notificación · Interop.', sub: 'servicios externos', icon: 'Network', independent: true, x: 280, y: 490, w: 230, h: 90 },
    { id: 'l_log', kind: 'card', label: 'Bitácora protegida', icon: 'ShieldCheck', x: 580, y: 160, w: 200, h: 76 },
    { id: 'l_pres', kind: 'card', label: 'Preservación', sub: 'paquetes', icon: 'Archive', x: 580, y: 270, w: 200, h: 76 },
    { id: 'l_hist', kind: 'card', label: 'Reconstrucción histórica', sub: 'No definida en la especificación', icon: 'FileWarning', dashed: true, x: 580, y: 400, w: 200, h: 110 },
    // ---- Modelo documental de referencia
    { id: 'r_api', kind: 'card', label: 'Servicio de aplicación', sub: 'lógica de expediente', icon: 'Server', emphasis: 'navy', x: 830, y: 290, w: 160, h: 110 },
    { id: 'r_core', kind: 'group', label: 'Expediente rector — IUIe', sub: 'núcleo lógico', icon: 'Fingerprint', x: 1030, y: 100, w: 340, h: 270 },
    { id: 'r_state', kind: 'chip', label: 'Estado vigente', icon: 'CircleCheck', x: 1050, y: 150, w: 145, h: 56 },
    { id: 'r_events', kind: 'chip', label: 'Eventos históricos', icon: 'History', x: 1205, y: 150, w: 145, h: 56 },
    { id: 'r_snap', kind: 'chip', label: 'Snapshots', icon: 'Camera', x: 1050, y: 216, w: 145, h: 56 },
    { id: 'r_index', kind: 'chip', label: 'Índice', icon: 'ListTree', x: 1205, y: 216, w: 145, h: 56 },
    { id: 'r_rel', kind: 'chip', label: 'Relaciones', icon: 'Share2', x: 1050, y: 282, w: 145, h: 56 },
    { id: 'r_integ', kind: 'chip', label: 'Control de integridad', icon: 'ShieldCheck', x: 1205, y: 282, w: 145, h: 56 },
    { id: 'r_obj', kind: 'card', label: 'Repositorio de objetos digitales', icon: 'Archive', independent: true, x: 1410, y: 130, w: 170, h: 110 },
    { id: 'r_ext', kind: 'card', label: 'Integraciones externas', icon: 'Network', independent: true, x: 1410, y: 290, w: 170, h: 100 },
    { id: 'r_hist', kind: 'card', label: 'Reconstrucción por fecha', sub: 'snapshot + eventos', icon: 'History', x: 1080, y: 410, w: 240, h: 90 },
  ]

  const links: LinkDef[] = [
    { from: 'l_api', to: 'l_pg' },
    { from: 'l_api', to: 'l_sp', independent: true },
    { from: 'l_api', to: 'l_ssd', independent: true },
    { from: 'l_api', to: 'l_ext', independent: true },
    { from: 'l_api', to: 'l_log' },
    { from: 'l_log', to: 'l_pres', faint: true },
    { from: 'l_api', to: 'l_hist', faint: true },
    { from: 'r_api', to: 'r_core' },
    { from: 'r_api', to: 'r_obj', independent: true },
    { from: 'r_api', to: 'r_ext', independent: true },
    { from: 'r_state', to: 'r_events', faint: true },
    { from: 'r_events', to: 'r_snap', faint: true },
    { from: 'r_events', to: 'r_index', faint: true },
    { from: 'r_rel', to: 'r_events', faint: true },
    { from: 'r_events', to: 'r_integ', faint: true },
    { from: 'r_state', to: 'r_hist', faint: true },
    { from: 'r_snap', to: 'r_hist', faint: true },
  ]

  b.cap(0, 'Ambos modelos reciben las mismas seis operaciones, reproducidas en paralelo.', 'info')

  // 1 · Crear expediente
  let o = compareBase(0)
  b.cap(o, 'Crear expediente: el SME debe coordinar PostgreSQL, SSD y bitácora.', 'info')
  b.op('l_api', 'l_pg', o, 650, { label: 'INSERT expediente' })
  b.op('l_api', 'l_pg', o + 500, 650, { label: 'índice + evento' })
  b.op('l_api', 'l_ssd', o + 1000, 800, { coord: true, label: 'registrar en SSD' })
  b.op('l_api', 'l_log', o + 1500, 700)
  b.op('r_api', 'r_state', o, 700, { label: 'crear' })
  b.op('r_state', 'r_integ', o + 800, 500, { label: 'sellar' })

  // 2 · Incorporar documento
  o = compareBase(1)
  b.cap(o, 'Incorporar documento: el SME requiere confirmar entre sistemas independientes.', 'pending')
  b.op('l_api', 'l_pg', o, 650, { label: 'PENDIENTE' })
  b.op('l_api', 'l_sp', o + 600, 900, { big: true, coord: true, label: 'PUT' })
  b.op('l_sp', 'l_api', o + 1600, 700, { label: 'resp.' })
  b.op('l_api', 'l_pg', o + 2400, 650, { label: 'confirmar' })
  b.op('l_api', 'l_log', o + 3000, 650)
  b.op('l_api', 'l_ext', o + 3500, 700, { coord: true, label: 'outbox' })
  b.op('r_api', 'r_obj', o, 900, { big: true, coord: true, label: 'objeto' })
  b.op('r_obj', 'r_api', o + 1000, 700, { label: 'ref + hash' })
  b.op('r_api', 'r_events', o + 1800, 650, { label: 'evento' })
  b.op('r_events', 'r_index', o + 2400, 450)

  // 3 · Modificar estado
  o = compareBase(2)
  b.cap(o, 'Modificar estado: el SME actualiza tablas y sincroniza con SSD.', 'info')
  b.op('l_api', 'l_pg', o, 650, { label: 'UPDATE estado' })
  b.op('l_api', 'l_pg', o + 500, 650, { label: 'evento' })
  b.op('l_api', 'l_ssd', o + 1000, 800, { coord: true, label: 'sincronizar' })
  b.op('l_api', 'l_log', o + 1600, 650)
  b.op('r_api', 'r_events', o, 650, { label: 'evento' })
  b.op('r_events', 'r_state', o + 600, 500)
  b.op('r_state', 'r_integ', o + 1000, 450)

  // 4 · Relacionar otro expediente
  o = compareBase(3)
  b.cap(o, 'Relacionar expedientes: varios registros deben quedar coherentes entre sí.', 'info')
  b.op('l_api', 'l_pg', o, 650, { label: 'relación' })
  b.op('l_api', 'l_pg', o + 500, 650, { label: 'índice A' })
  b.op('l_api', 'l_pg', o + 1000, 650, { label: 'índice B' })
  b.op('l_api', 'l_log', o + 1600, 650)
  b.op('r_api', 'r_rel', o, 650, { label: 'relación' })
  b.op('r_rel', 'r_events', o + 600, 450)

  // 5 · Consultar estado actual
  o = compareBase(4)
  b.cap(o, 'Consultar estado actual: el SME compone la respuesta desde varias fuentes.', 'info')
  b.op('l_api', 'l_pg', o, 650, { label: 'JOIN' })
  b.op('l_pg', 'l_api', o + 700, 650)
  b.op('l_api', 'l_sp', o + 1300, 800, { coord: true, label: 'referencias' })
  b.op('l_sp', 'l_api', o + 2100, 650)
  b.op('r_api', 'r_state', o, 650)
  b.op('r_state', 'r_api', o + 700, 650)

  // 6 · Reconstruir fecha anterior
  o = compareBase(5)
  b.cap(o, 'Reconstruir una fecha anterior: en el SME no hay una operación definida; el modelo de referencia la contempla.', 'pending')
  b.op('l_api', 'l_pg', o, 650, { label: 'actuaciones' })
  b.op('l_api', 'l_pg', o + 450, 650, { label: 'eventos' })
  b.op('l_api', 'l_pg', o + 900, 650, { label: 'relaciones' })
  b.op('l_api', 'l_sp', o + 1350, 800, { coord: true, label: 'versiones' })
  b.op('l_api', 'l_hist', o + 2300, 800, { outcome: 'pending', hold: 900, holdLabel: 'sin operación definida' })
  b.ev(o + 3100, 'l_hist', 'pending', 'No definida en la especificación')
  b.op('r_api', 'r_snap', o, 700, { label: 'snapshot' })
  b.op('r_snap', 'r_events', o + 750, 600, { label: 'eventos posteriores' })
  b.op('r_api', 'r_obj', o + 1400, 800, { label: 'versiones' })
  b.op('r_events', 'r_hist', o + 1500, 700)
  b.ev(o + 2200, 'r_hist', 'ok', 'capacidad explícita')

  const end = compareBase(5) + 4200
  b.ban(end + 400, end + 9400, COMPARE_FINAL, 'info')
  b.cap(end + 400, 'Ambos modelos dependen de servicios externos; difieren en cuánta coordinación exige mantener la misma unidad documental.', 'info')

  return b.build({
    id: 'scene5',
    duration: end + 10000,
    nodes,
    links,
    overlay: 'compare',
    bannerPos: { x: 110, y: 662, w: 1380 },
  })
}
