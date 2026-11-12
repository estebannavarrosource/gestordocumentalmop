import type { LinkDef, NodeDef } from './types'

/**
 * Diagrama base de la arquitectura propuesta (SME). Coordenadas en un
 * escenario de 1600 x 760.
 */

const chip = (
  id: string,
  label: string,
  icon: string,
  x: number,
  y: number,
  w = 130,
  h = 56,
  extra: Partial<NodeDef> = {},
): NodeDef => ({ id, kind: 'chip', label, icon, x, y, w, h, ...extra })

const PG_COLS = [640, 784, 928]
const PG_ROWS = [80, 146, 212, 278]

export const PG_TABLES = [
  ['tbl_expediente', 'expediente', 'FolderOpen'],
  ['tbl_documento', 'documento', 'FileText'],
  ['tbl_exp_doc', 'expediente_documento', 'Link2'],
  ['tbl_actuacion', 'actuación', 'ScrollText'],
  ['tbl_indice', 'índice', 'ListTree'],
  ['tbl_evento', 'evento', 'History'],
  ['tbl_notificacion', 'notificación', 'Bell'],
  ['tbl_firma', 'firma', 'FileSignature'],
  ['tbl_relaciones', 'relaciones', 'Share2'],
  ['tbl_outbox', 'outbox', 'Inbox'],
  ['tbl_idem', 'idempotencia', 'Fingerprint'],
  ['tbl_concil', 'conciliación', 'RefreshCw'],
] as const

export function archNodes(): NodeDef[] {
  const nodes: NodeDef[] = []

  nodes.push({ id: 'exp', kind: 'card', label: 'Expediente abierto', sub: 'EXP-2025-014532', icon: 'FolderOpen', x: 25, y: 70, w: 200, h: 110, emphasis: 'navy' })
  nodes.push({ id: 'doc', kind: 'card', label: 'Documento digital', sub: 'oficio_0457.pdf', icon: 'FileText', x: 25, y: 270, w: 200, h: 100 })
  nodes.push({ id: 'api', kind: 'card', label: 'Backend .NET', sub: 'ASP.NET Core 10', icon: 'Server', x: 290, y: 185, w: 220, h: 130, emphasis: 'navy' })

  nodes.push({ id: 'pg', kind: 'group', label: 'PostgreSQL', sub: 'modelo relacional', icon: 'Database', x: 620, y: 36, w: 460, h: 312 })
  PG_TABLES.forEach(([id, label, icon], i) => {
    nodes.push(chip(id, label, icon, PG_COLS[i % 3], PG_ROWS[Math.floor(i / 3)], 130, 56, { dense: i < 9 }))
  })

  nodes.push({ id: 'bitacora', kind: 'card', label: 'Bitácora protegida', icon: 'ShieldCheck', x: 620, y: 376, w: 222, h: 80 })
  nodes.push({ id: 'preserv', kind: 'card', label: 'Preservación', sub: 'paquetes', icon: 'Archive', x: 858, y: 376, w: 222, h: 80 })

  nodes.push({ id: 'sp', kind: 'group', label: 'SharePoint Online', sub: 'repositorio operativo', icon: 'Cloud', x: 1130, y: 36, w: 440, h: 246, independent: true })
  nodes.push(chip('sp_files', 'Archivos', 'Files', 1150, 80, 190, 56, { dense: true }))
  nodes.push(chip('sp_versions', 'Versiones', 'Layers', 1360, 80, 190, 56, { dense: true }))
  nodes.push(chip('sp_libs', 'Bibliotecas', 'Library', 1150, 146, 190, 56))
  nodes.push(chip('sp_ids', 'Identificadores de recurso', 'Hash', 1360, 146, 190, 56))
  nodes.push(chip('sp_queue', 'Cola de solicitudes', 'Hourglass', 1150, 212, 190, 56))

  nodes.push({ id: 'ssd', kind: 'group', label: 'SSD', sub: 'tramitación oficial', icon: 'Route', x: 1130, y: 306, w: 440, h: 180, independent: true })
  nodes.push(chip('ssd_tram', 'Tramitación', 'Workflow', 1150, 350, 190, 56))
  nodes.push(chip('ssd_deriv', 'Derivaciones', 'Send', 1360, 350, 190, 56))
  nodes.push(chip('ssd_plazos', 'Plazos', 'Clock', 1150, 416, 190, 56))
  nodes.push(chip('ssd_reg', 'Registro oficial', 'BadgeCheck', 1360, 416, 190, 56))

  nodes.push({ id: 'ext', kind: 'group', label: 'Otros servicios', sub: 'integraciones', icon: 'Network', x: 1130, y: 510, w: 440, h: 114, independent: true })
  nodes.push(chip('ext_firma', 'Firma electrónica', 'FileSignature', 1150, 554, 124, 56))
  nodes.push(chip('ext_notif', 'Notificaciones', 'Bell', 1288, 554, 124, 56))
  nodes.push(chip('ext_interop', 'Interoperabilidad', 'ArrowRightLeft', 1426, 554, 124, 56))

  return nodes
}

export function archLinks(): LinkDef[] {
  return [
    { from: 'api', to: 'pg' },
    { from: 'api', to: 'sp', independent: true },
    { from: 'api', to: 'ssd', independent: true },
    { from: 'api', to: 'ext', independent: true },
    { from: 'api', to: 'bitacora' },
    { from: 'bitacora', to: 'preserv', faint: true },
    { from: 'tbl_exp_doc', to: 'tbl_expediente', faint: true },
    { from: 'tbl_exp_doc', to: 'tbl_documento', faint: true },
    { from: 'tbl_actuacion', to: 'tbl_expediente', faint: true },
    { from: 'tbl_indice', to: 'tbl_expediente', faint: true },
    { from: 'tbl_evento', to: 'tbl_expediente', faint: true },
    { from: 'tbl_relaciones', to: 'tbl_expediente', faint: true },
    { from: 'tbl_firma', to: 'tbl_documento', faint: true },
    { from: 'tbl_notificacion', to: 'tbl_evento', faint: true },
    { from: 'tbl_outbox', to: 'ext_notif', independent: true },
    { from: 'tbl_documento', to: 'sp_files', independent: true, faint: true },
    { from: 'exp', to: 'api', faint: true },
    { from: 'doc', to: 'api', faint: true },
  ]
}

export const pick = (nodes: NodeDef[], ids: string[]) => nodes.filter((n) => ids.includes(n.id))
export const without = (nodes: NodeDef[], ids: string[]) => nodes.filter((n) => !ids.includes(n.id))
export const byId = (nodes: NodeDef[], id: string) => {
  const n = nodes.find((x) => x.id === id)
  if (!n) throw new Error(`nodo ${id}`)
  return n
}
