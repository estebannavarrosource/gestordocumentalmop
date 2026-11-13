import { Builder } from '../builder'
import type { LinkDef, NodeDef, Script } from '../types'

export const V3_COMPARE_OPS = [
  { label: 'Crear expediente', icon: 'FolderOpen' },
  { label: 'Registrar actuación', icon: 'ScrollText' },
  { label: 'Incorporar documento', icon: 'FileText' },
  { label: 'Consultar estado actual', icon: 'Eye' },
  { label: 'Recuperar estado histórico', icon: 'History' },
]
export const V3_COMPARE_BASE = 1400
export const V3_COMPARE_STEP = 6000
export const v3CompareBase = (i: number) => V3_COMPARE_BASE + i * V3_COMPARE_STEP

/** Sistema funcional al que pertenece cada componente, para contar sistemas involucrados. */
export const COMPARE_SYSTEM: Record<string, string | null> = {
  l_api: 'SME .NET',
  l_pg: 'SME .NET',
  l_log: 'SME .NET',
  l_hist: 'SME .NET',
  l_sp: 'SharePoint',
  l_ssd: 'SSD',
  l_ext: null,
  r_ang: null,
  r_gw: null,
  r_gest: 'Gestor',
  r_mg: 'Gestor',
  r_wk: 'Gestor',
  r_os: 'Object Storage',
  r_ext: null,
}
export const COMPARE_EXTERNAL = ['l_sp', 'l_ssd', 'l_ext', 'r_os', 'r_ext']

export const V3_COMPARE_FINAL =
  'Las dependencias no desaparecen: cambia dónde reside la responsabilidad de mantener consistente el expediente.'

export function buildV3Scene5(): Script {
  const b = new Builder()
  const nodes: NodeDef[] = [
    { id: 'l_api', kind: 'card', label: 'Backend .NET', sub: 'ASP.NET Core 10', icon: 'Server', emphasis: 'navy', x: 30, y: 290, w: 160, h: 110 },
    { id: 'l_pg', kind: 'card', label: 'PostgreSQL', sub: 'entidades relacionadas', icon: 'Database', x: 280, y: 130, w: 230, h: 90 },
    { id: 'l_sp', kind: 'card', label: 'SharePoint Online', sub: 'archivos y versiones', icon: 'Cloud', independent: true, x: 280, y: 250, w: 230, h: 90 },
    { id: 'l_ssd', kind: 'card', label: 'SSD', sub: 'tramitación oficial', icon: 'Route', independent: true, x: 280, y: 370, w: 230, h: 90 },
    { id: 'l_ext', kind: 'card', label: 'Firma · Notificación · Interop.', sub: 'servicios externos', icon: 'Network', independent: true, x: 280, y: 490, w: 230, h: 80 },
    { id: 'l_log', kind: 'card', label: 'Bitácora protegida', icon: 'ShieldCheck', x: 580, y: 160, w: 200, h: 76 },
    { id: 'l_hist', kind: 'card', label: 'Reconstrucción histórica', sub: 'No definida en la especificación', icon: 'FileWarning', dashed: true, x: 580, y: 330, w: 200, h: 110 },

    { id: 'r_ang', kind: 'card', label: 'Angular', icon: 'Monitor', x: 815, y: 310, w: 150, h: 80 },
    { id: 'r_gw', kind: 'card', label: 'API Gateway', icon: 'Network', x: 975, y: 310, w: 140, h: 80 },
    { id: 'r_gest', kind: 'group', label: 'Gestor Ministerial', sub: 'un único servicio', icon: 'Server', x: 1130, y: 90, w: 240, h: 400 },
    { id: 'r_tram', kind: 'chip', compact: true, label: 'Tramitación', icon: 'Workflow', x: 1146, y: 140, w: 208, h: 40 },
    { id: 'r_exp', kind: 'chip', compact: true, label: 'Expediente', icon: 'FolderOpen', x: 1146, y: 190, w: 208, h: 40 },
    { id: 'r_hist', kind: 'chip', compact: true, label: 'Historia', sub: 'snapshot + eventos', icon: 'History', x: 1146, y: 240, w: 208, h: 44 },
    { id: 'r_seg', kind: 'chip', compact: true, label: 'Seguridad', icon: 'ShieldCheck', x: 1146, y: 294, w: 208, h: 40 },
    { id: 'r_tx', kind: 'chip', compact: true, label: 'Transacción corta', sub: 'estado + evento', icon: 'ShieldCheck', x: 1146, y: 344, w: 208, h: 44 },
    { id: 'r_mg', kind: 'card', label: 'MongoDB', sub: 'rector · índice · eventos', icon: 'Database', x: 1400, y: 100, w: 190, h: 120 },
    { id: 'r_os', kind: 'card', label: 'Object Storage', sub: 'archivos y versiones', icon: 'Archive', independent: true, x: 1400, y: 250, w: 190, h: 100 },
    { id: 'r_wk', kind: 'card', label: 'Workers', sub: 'verificación asíncrona', icon: 'Cpu', x: 1400, y: 380, w: 190, h: 90 },
    { id: 'r_ext', kind: 'card', label: 'Servicios externos', sub: 'firma · notificación · interop.', icon: 'Network', independent: true, x: 1130, y: 510, w: 240, h: 70 },
  ]
  const links: LinkDef[] = [
    { from: 'l_api', to: 'l_pg' },
    { from: 'l_api', to: 'l_sp', independent: true },
    { from: 'l_api', to: 'l_ssd', independent: true },
    { from: 'l_api', to: 'l_ext', independent: true },
    { from: 'l_api', to: 'l_log' },
    { from: 'l_api', to: 'l_hist', faint: true },
    { from: 'r_ang', to: 'r_gw' },
    { from: 'r_gw', to: 'r_gest' },
    { from: 'r_gest', to: 'r_mg' },
    { from: 'r_gest', to: 'r_os', independent: true },
    { from: 'r_gest', to: 'r_wk', faint: true },
    { from: 'r_gest', to: 'r_ext', independent: true },
  ]

  b.cap(0, 'Las mismas cinco operaciones se reproducen en ambas arquitecturas, en paralelo.', 'info')

  // 1 · Crear
  let o = v3CompareBase(0)
  b.cap(o, 'Crear expediente: el SME coordina PostgreSQL, SSD y bitácora; el Gestor lo hace en una transacción corta.', 'info')
  b.op('l_api', 'l_pg', o, 650, { label: 'INSERT expediente', tag: 'upd' })
  b.op('l_api', 'l_pg', o + 500, 650, { label: 'índice + evento' })
  b.op('l_api', 'l_ssd', o + 1000, 800, { coord: true, label: 'registrar en SSD' })
  b.op('l_api', 'l_log', o + 1500, 700)
  b.op('r_ang', 'r_gw', o, 600)
  b.op('r_gw', 'r_gest', o + 600, 700)
  b.op('r_gest', 'r_tx', o + 1400, 500)
  b.op('r_tx', 'r_mg', o + 1900, 750, { label: 'estado + evento', tag: 'upd' })
  b.ev(o + 2650, 'r_mg', 'ok')

  // 2 · Actuación
  o = v3CompareBase(1)
  b.cap(o, 'Registrar actuación: el SME actualiza tablas y sincroniza con SSD; el Gestor confirma estado y evento juntos.', 'info')
  b.op('l_api', 'l_pg', o, 650, { label: 'INSERT actuación', tag: 'upd' })
  b.op('l_api', 'l_pg', o + 500, 650, { label: 'evento' })
  b.op('l_api', 'l_ssd', o + 1000, 800, { coord: true, label: 'sincronizar' })
  b.op('l_api', 'l_log', o + 1600, 650)
  b.op('r_ang', 'r_gw', o, 600)
  b.op('r_gw', 'r_gest', o + 600, 700)
  b.op('r_gest', 'r_tram', o + 1300, 450)
  b.op('r_tram', 'r_tx', o + 1750, 450)
  b.op('r_tx', 'r_mg', o + 2200, 750, { label: 'estado + evento', tag: 'upd' })

  // 3 · Documento
  o = v3CompareBase(2)
  b.cap(o, 'Incorporar documento: el SME debe confirmar entre sistemas independientes; el Gestor deja los bytes directo en el Object Storage.', 'pending')
  b.op('l_api', 'l_pg', o, 650, { label: 'PENDIENTE', tag: 'upd' })
  b.op('l_api', 'l_sp', o + 600, 900, { big: true, coord: true, label: 'PUT' })
  b.op('l_sp', 'l_api', o + 1600, 700, { label: 'resp.' })
  b.op('l_api', 'l_pg', o + 2400, 650, { label: 'confirmar', tag: 'conf' })
  b.op('l_api', 'l_log', o + 3000, 650)
  b.op('l_api', 'l_ext', o + 3500, 700, { coord: true, label: 'outbox' })
  b.op('r_gest', 'r_mg', o, 700, { label: 'pendiente', tag: 'upd' })
  b.op('r_ang', 'r_os', o + 700, 1500, { big: true, label: 'bytes' })
  b.op('r_os', 'r_wk', o + 2300, 650, { label: 'verificar' })
  b.op('r_wk', 'r_gest', o + 3000, 650)
  b.op('r_gest', 'r_mg', o + 3700, 700, { label: 'confirmar', tag: 'conf' })

  // 4 · Consultar
  o = v3CompareBase(3)
  b.cap(o, 'Consultar estado actual: el SME compone la respuesta desde varias fuentes; el Gestor lee un documento rector.', 'info')
  b.op('l_api', 'l_pg', o, 650, { label: 'JOIN' })
  b.op('l_pg', 'l_api', o + 700, 650)
  b.op('l_api', 'l_sp', o + 1300, 800, { coord: true, label: 'referencias' })
  b.op('l_sp', 'l_api', o + 2100, 650)
  b.op('r_ang', 'r_gw', o, 600)
  b.op('r_gw', 'r_gest', o + 600, 700)
  b.op('r_gest', 'r_mg', o + 1300, 650, { label: 'documento rector' })
  b.op('r_mg', 'r_gest', o + 1950, 650)

  // 5 · Histórico
  o = v3CompareBase(4)
  b.cap(o, 'Recuperar estado histórico: el SME no define la operación; el Gestor la resuelve con snapshot y eventos.', 'pending')
  b.op('l_api', 'l_pg', o, 650, { label: 'actuaciones' })
  b.op('l_api', 'l_pg', o + 450, 650, { label: 'eventos' })
  b.op('l_api', 'l_pg', o + 900, 650, { label: 'relaciones' })
  b.op('l_api', 'l_sp', o + 1350, 800, { coord: true, label: 'versiones' })
  b.op('l_api', 'l_hist', o + 2300, 800, { outcome: 'pending', hold: 900, holdLabel: 'sin operación definida' })
  b.ev(o + 3100, 'l_hist', 'pending', 'No definida en la especificación')
  b.op('r_gest', 'r_hist', o, 500)
  b.op('r_hist', 'r_mg', o + 550, 650, { label: 'snapshot' })
  b.op('r_mg', 'r_hist', o + 1250, 650, { label: 'eventos' })
  b.op('r_hist', 'r_os', o + 2000, 800, { label: 'versiones', coord: true })
  b.ev(o + 2800, 'r_hist', 'ok', 'capacidad explícita')

  const end = v3CompareBase(4) + 4400
  b.ban(end + 400, end + 9400, V3_COMPARE_FINAL, 'info')
  b.cap(end + 400, 'Ambos modelos tienen dependencias externas. Los conteos se derivan de esta simulación; no son mediciones de rendimiento.', 'info')

  return {
    ...b.build({ id: 'v3s5', duration: end + 10000, nodes, links, overlay: 'compare', bannerPos: { x: 50, y: 696, w: 1500 } }),
    curved: true,
  }
}
