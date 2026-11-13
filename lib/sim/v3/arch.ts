import type { Builder } from '../builder'
import type { LinkDef, NodeDef, Script, Status } from '../types'

type Item = [id: string, label: string, icon: string, sub?: string]

export const group = (id: string, label: string, icon: string, x: number, y: number, w: number, h: number, extra: Partial<NodeDef> = {}): NodeDef => ({
  id,
  kind: 'group',
  label,
  icon,
  x,
  y,
  w,
  h,
  ...extra,
})

export const chip = (id: string, label: string, icon: string, x: number, y: number, w: number, h = 32, extra: Partial<NodeDef> = {}): NodeDef => ({
  id,
  kind: 'chip',
  label,
  icon,
  x,
  y,
  w,
  h,
  compact: true,
  ...extra,
})

function stack(items: Item[], x: number, y: number, w: number, pitch = 35, h = 32): NodeDef[] {
  return items.map(([id, label, icon, sub], i) => chip(id, label, icon, x, y + i * pitch, w, h, sub ? { sub } : {}))
}

const AN: Item[] = [
  ['an_ciud', 'Ciudadanos', 'Users'],
  ['an_func', 'Funcionarios', 'UserCheck'],
  ['an_adm', 'Administradores', 'KeyRound'],
  ['an_form', 'Formularios dinámicos', 'FileText'],
  ['an_cons', 'Consulta de expedientes', 'Eye'],
  ['an_vis', 'Visores documentales', 'Files'],
]
const GW: Item[] = [
  ['gw_in', 'Entrada de APIs', 'Network'],
  ['gw_auth', 'Autenticación', 'KeyRound'],
  ['gw_route', 'Enrutamiento', 'Route'],
  ['gw_traf', 'Control de tráfico', 'Gauge'],
  ['gw_ver', 'Versionado', 'Layers'],
]
const TR: Item[] = [
  ['tr_est', 'Estados', 'RefreshCw'],
  ['tr_etapas', 'Etapas', 'Route'],
  ['tr_act', 'Actuaciones', 'ScrollText'],
  ['tr_resp', 'Responsables', 'UserCheck'],
  ['tr_deriv', 'Derivaciones', 'Send'],
  ['tr_plazos', 'Plazos', 'Clock'],
  ['tr_reglas', 'Reglas de negocio', 'Workflow'],
]
const XP: Item[] = [
  ['xp_rector', 'Documento rector', 'FolderOpen'],
  ['xp_indice', 'Índice documental', 'ListTree'],
  ['xp_rel', 'Relaciones', 'Share2'],
  ['xp_obj', 'Objetos digitales', 'Package'],
  ['xp_ver', 'Versiones', 'Layers'],
  ['xp_meta', 'Metadatos', 'Hash'],
]
const HI: Item[] = [
  ['hi_ev', 'Eventos', 'History'],
  ['hi_snap', 'Snapshots', 'Camera'],
  ['hi_rec', 'Reconstrucción histórica', 'Replace'],
]
const AD: Item[] = [
  ['ad_form', 'Formularios', 'FileText'],
  ['ad_reglas', 'Reglas', 'Workflow'],
  ['ad_proc', 'Procedimientos', 'Route'],
  ['ad_conf', 'Configuraciones versionadas', 'Layers'],
]
const SG: Item[] = [
  ['sg_auth', 'Autorización', 'KeyRound'],
  ['sg_conf', 'Confidencialidad', 'Lock'],
  ['sg_integ', 'Integridad', 'ShieldCheck'],
  ['sg_audit', 'Auditoría', 'ScrollText'],
]
const MG: Item[] = [
  ['mg_cur', 'expedientes_current', 'FolderOpen', 'documento rector · estado vigente'],
  ['mg_items', 'expediente_items', 'ListTree', 'índice documental paginado'],
  ['mg_events', 'expediente_events', 'History', 'eventos encadenados'],
  ['mg_snaps', 'expediente_snapshots', 'Camera', 'puntos de reconstrucción'],
  ['mg_obj', 'objetos_digitales', 'Package', 'referencias y hashes'],
  ['mg_rel', 'expediente_relaciones', 'Share2', 'vínculos entre expedientes'],
  ['mg_proc', 'procedimientos_versiones', 'Layers', 'configuración versionada'],
  ['mg_outbox', 'operaciones_outbox', 'Inbox', 'operaciones pendientes'],
]
const WK: Item[] = [
  ['wk_verif', 'Verificar archivos', 'ShieldCheck'],
  ['wk_proc', 'Procesar documentos', 'Cpu'],
  ['wk_snap', 'Generar snapshots', 'Camera'],
  ['wk_idx', 'Crear índices de búsqueda', 'Search'],
  ['wk_pres', 'Preparar paquetes de preservación', 'Archive'],
]
const SV: Item[] = [
  ['sv_firma', 'Firma electrónica', 'FileSignature'],
  ['sv_notif', 'Notificaciones', 'Bell'],
  ['sv_docd', 'DocDigital', 'FileText'],
  ['sv_super', 'SUPER', 'BadgeCheck'],
  ['sv_interop', 'Interoperabilidad', 'ArrowRightLeft'],
  ['sv_corr', 'Correlativos oficiales', 'Hash'],
]

export interface ArchOpts {
  /** incluye el servicio de correlativos oficiales */
  corr?: boolean
  /** incluye la tarjeta del documento a incorporar */
  doc?: boolean
}

export function v3Nodes(opts: ArchOpts = {}): NodeDef[] {
  const n: NodeDef[] = []

  n.push(group('an', 'Angular — Gestor Ministerial', 'Monitor', 12, 24, 194, 267, { compact: true }))
  n.push(...stack(AN, 24, 76, 170))

  n.push(group('gw', 'API Gateway', 'Network', 222, 24, 160, 222, { compact: true, sub: 'entrada única' }))
  n.push(...stack(GW, 234, 66, 136))

  n.push(group('gest', 'Gestor Ministerial', 'Server', 400, 24, 676, 556, { sub: 'un único servicio funcional' }))
  n.push(group('tr', 'Tramitación', 'Workflow', 412, 68, 230, 292, { compact: true }))
  n.push(...stack(TR, 422, 108, 210))
  n.push(group('ad', 'Administración', 'KeyRound', 412, 372, 230, 185, { compact: true }))
  n.push(...stack(AD, 422, 412, 210))

  n.push({
    id: 'iuie',
    kind: 'card',
    label: 'Expediente',
    sub: 'IUIe 7F3A-2C91',
    icon: 'FolderOpen',
    emphasis: 'navy',
    compact: true,
    parts: ['Estado', 'Índice', 'Actuaciones', 'Relaciones', 'Eventos', 'Versiones'],
    x: 654,
    y: 68,
    w: 172,
    h: 250,
  })
  n.push(group('sg', 'Seguridad', 'ShieldCheck', 654, 330, 172, 185, { compact: true }))
  n.push(...stack(SG, 664, 370, 152))

  n.push({
    id: 'tx',
    kind: 'card',
    label: 'Transacción corta',
    sub: 'estado + evento, atómicos',
    icon: 'ShieldCheck',
    x: 850,
    y: 68,
    w: 202,
    h: 60,
  })
  n.push(group('xp', 'Expediente', 'FolderOpen', 838, 140, 226, 255, { compact: true }))
  n.push(...stack(XP, 850, 180, 202))
  n.push(group('hi', 'Historia', 'History', 838, 407, 226, 150, { compact: true }))
  n.push(...stack(HI, 850, 447, 202))

  n.push(group('mg', 'MongoDB', 'Database', 1096, 24, 244, 368))
  n.push(...stack(MG, 1108, 68, 220, 40, 36))

  n.push(group('os', 'Object Storage', 'Archive', 1096, 406, 244, 156))
  const small = (id: string, label: string, x: number, y: number) => chip(id, label, 'FileText', x, y, 70, 28, { small: true })
  n.push(small('os_pdf', 'PDF', 1108, 450), small('os_img', 'Imágenes', 1184, 450), small('os_cad', 'CAD', 1260, 450))
  n.push(small('os_gis', 'GIS', 1108, 482), small('os_bim', 'BIM', 1184, 482), small('os_vid', 'Videos', 1260, 482))
  n.push(chip('os_ver', 'Versiones', 'Layers', 1108, 514, 108, 36), chip('os_man', 'Manifiestos', 'ShieldCheck', 1222, 514, 106, 36))

  n.push(group('wk', 'Procesamiento asíncrono', 'Cpu', 1358, 24, 232, 246, { compact: true }))
  n.push(...stack(WK, 1370, 66, 208, 40, 36))

  n.push(group('sv', 'Servicios externos', 'Network', 1358, 284, 232, 288, { independent: false }))
  n.push(...stack(SV.filter(([id]) => opts.corr || id !== 'sv_corr'), 1370, 328, 208, 40, 36))

  if (opts.doc) {
    n.push({ id: 'doc', kind: 'card', label: 'Documento a incorporar', sub: 'oficio_0457.pdf · 2,4 MB', icon: 'FileText', x: 12, y: 310, w: 194, h: 96 })
  }
  return n
}

export function v3Links(): LinkDef[] {
  return [
    { from: 'an', to: 'gw' },
    { from: 'gw', to: 'gest' },
    { from: 'tx', to: 'mg_cur', faint: true },
    { from: 'tx', to: 'mg_events', faint: true },
    { from: 'tx', to: 'mg_proc', faint: true },
    { from: 'tx', to: 'mg_outbox', faint: true },
    { from: 'xp_indice', to: 'mg_items', faint: true },
    { from: 'hi_snap', to: 'mg_snaps', faint: true },
    { from: 'xp_obj', to: 'mg_obj', faint: true },
    { from: 'xp_rel', to: 'mg_rel', faint: true },
    { from: 'mg_outbox', to: 'wk_verif', faint: true },
    { from: 'mg_obj', to: 'os_ver', faint: true },
    { from: 'doc', to: 'os_pdf', bend: 0.38 },
    { from: 'an_vis', to: 'os_pdf', bend: 0.3, faint: true },
  ]
}

/**
 * Solicitud desde Angular hasta un módulo del Gestor, atravesando el API Gateway
 * (entrada, autenticación y enrutamiento). Devuelve el instante de llegada.
 * Requiere ~3 s libres después de la llegada para restablecer el Gateway.
 */
export function via(b: Builder, src: string, dst: string, t: number, label?: string, event?: string): number {
  b.ev(t, src, 'running')
  b.op(src, 'gw_in', t, 500, { label, event })
  b.ev(t + 500, src, 'ok')
  b.ev(t + 500, 'gw_in', 'running')
  b.op('gw_in', 'gw_auth', t + 550, 300)
  b.ev(t + 850, 'gw_in', 'ok')
  b.ev(t + 850, 'gw_auth', 'running')
  b.op('gw_auth', 'gw_route', t + 900, 300)
  b.ev(t + 1200, 'gw_auth', 'ok')
  b.ev(t + 1200, 'gw_route', 'running')
  b.op('gw_route', dst, t + 1250, 650)
  b.ev(t + 1900, 'gw_route', 'ok')
  b.ev(t + 1900, dst, 'running')
  for (const id of ['gw_in', 'gw_auth', 'gw_route']) b.ev(t + 3000, id, 'idle')
  b.ev(t + 3000, src, 'idle')
  return t + 1900
}

/** Completa un script con los parámetros comunes de la versión 3. */
export function v3Finish(
  b: Builder,
  args: Omit<Parameters<Builder['build']>[0], 'links' | 'curved'> & { links?: LinkDef[] },
): Script {
  const ids = new Set(args.nodes.map((nd) => nd.id))
  const links = (args.links ?? v3Links()).filter((l) => ids.has(l.from) && ids.has(l.to))
  const script = b.build({ ...args, links })
  return { ...script, curved: true }
}

export const STEP_COLS = (n: number) => Math.ceil(n / 2)
