import { archLinks, archNodes, byId, pick } from '../arch'
import { Builder } from '../builder'
import type { LinkDef, NodeDef, Script } from '../types'

const CENTER = { x: 800, y: 385 }

const TABLE_IDS = [
  'tbl_expediente',
  'tbl_documento',
  'tbl_exp_doc',
  'tbl_actuacion',
  'tbl_indice',
  'tbl_evento',
  'tbl_notificacion',
  'tbl_firma',
  'tbl_relaciones',
]
const SP_IDS = ['sp_files', 'sp_versions', 'sp_libs', 'sp_ids']
const SSD_IDS = ['ssd_tram', 'ssd_deriv', 'ssd_plazos', 'ssd_reg']
const EXT_IDS = ['ext_firma', 'ext_notif', 'ext_interop']

const SLOTS: [string, string][] = [
  ['slot_id', 'ID'],
  ['slot_estado', 'Estado'],
  ['slot_indice', 'Índice'],
  ['slot_docs', 'Docs'],
  ['slot_meta', 'Metadatos'],
  ['slot_act', 'Actuac.'],
  ['slot_rel', 'Relac.'],
  ['slot_ev', 'Eventos'],
  ['slot_ver', 'Versiones'],
]

export function buildScene1(): Script {
  const b = new Builder()
  const all = archNodes()

  const nodes: NodeDef[] = []

  nodes.push({
    id: 'exp_single',
    kind: 'card',
    label: 'Expediente',
    sub: 'EXP-2025-014532',
    icon: 'FolderOpen',
    emphasis: 'navy',
    x: CENTER.x - 130,
    y: CENTER.y - 95,
    w: 260,
    h: 190,
    parts: ['ID único', 'Estado', 'Índice', 'Documentos', 'Metadatos', 'Actuaciones', 'Relaciones', 'Eventos', 'Versiones'],
    exit: { at: 2200, dur: 600 },
  })

  const groups = pick(all, ['pg', 'sp', 'ssd', 'ext']).map((g) => ({
    ...g,
    h: g.id === 'sp' ? 180 : g.h,
    enter: { at: 2500, dur: 700 },
  }))
  nodes.push(...groups)

  const flying = pick(all, [...TABLE_IDS, ...SP_IDS, ...SSD_IDS, ...EXT_IDS])
  flying.forEach((n, i) => {
    nodes.push({
      ...n,
      dense: false,
      enter: { at: 2200 + i * 90, dur: 1000, fromX: CENTER.x, fromY: CENTER.y, fromScale: 0.25 },
    })
  })

  const api = byId(all, 'api')
  nodes.push({ ...api, enter: { at: 5000, dur: 600 } })
  nodes.push({
    id: 'asm',
    kind: 'group',
    label: 'Expediente ensamblado',
    icon: 'FolderOpen',
    x: 20,
    y: 120,
    w: 250,
    h: 196,
    enter: { at: 5000, dur: 600 },
  })
  SLOTS.forEach(([id, label], i) => {
    nodes.push({
      id,
      kind: 'chip',
      small: true,
      label,
      x: 34 + (i % 3) * 76,
      y: 164 + Math.floor(i / 3) * 46,
      w: 70,
      h: 40,
      enter: { at: 5000, dur: 600 },
    })
  })

  const links: LinkDef[] = archLinks()
    .filter((l) => !['exp', 'doc', 'bitacora', 'preserv', 'tbl_outbox'].some((x) => l.from === x || l.to === x))
    .map((l) => ({ ...l, at: l.from === 'api' ? 5000 : 3400 }))
  links.push({ from: 'tbl_documento', to: 'sp_ids', at: 3600, independent: true, faint: true })
  links.push({ from: 'tbl_documento', to: 'sp_versions', at: 3600, independent: true, faint: true })
  links.push({ from: 'ssd_tram', to: 'tbl_expediente', at: 3600, independent: true, faint: true })
  links.push({ from: 'ext_firma', to: 'tbl_firma', at: 3600, independent: true, faint: true })
  links.push({ from: 'ext_notif', to: 'tbl_notificacion', at: 3600, independent: true, faint: true })

  // ---- Fase 1: el objeto único se fragmenta ---------------------------------
  b.cap(0, 'Para quien lo usa, un expediente electrónico es una sola unidad.')
  b.cap(2000, 'La arquitectura propuesta lo reparte en tablas, archivos y servicios independientes.', 'running')

  // ---- Fase 2: consulta integral -------------------------------------------
  b.cap(5600, 'Consulta integral: un recorrido ilustrativo. No toda operación toca todas las tablas.', 'info')
  b.ban(6000, 13400, 'Recuperar expediente completo', 'running')

  const queries: [string, string[], string][] = [
    ['tbl_expediente', ['slot_id', 'slot_estado'], 'SELECT expediente'],
    ['tbl_exp_doc', [], 'SELECT expediente_documento'],
    ['tbl_documento', ['slot_docs', 'slot_meta'], 'SELECT documento'],
    ['tbl_indice', ['slot_indice'], 'SELECT índice'],
    ['tbl_actuacion', ['slot_act'], 'SELECT actuación'],
    ['tbl_evento', ['slot_ev'], 'SELECT evento'],
    ['tbl_relaciones', ['slot_rel'], 'SELECT relaciones'],
    ['tbl_firma', [], 'SELECT firma'],
  ]

  b.ev(5800, 'api', 'running', 'Recuperar expediente completo')
  queries.forEach(([table, slots, text], i) => {
    const s = 6000 + i * 900
    b.op('api', table, s, 650, { event: text })
    b.ev(s + 650, table, 'running')
    b.op(table, 'api', s + 700, 600)
    b.ev(s + 1000, table, 'ok')
    slots.forEach((sl) => b.ev(s + 1300, sl, 'ok'))
    if (table === 'tbl_exp_doc') {
      b.op('tbl_exp_doc', 'tbl_expediente', s + 1000, 600, { label: 'JOIN' })
      b.op('tbl_exp_doc', 'tbl_documento', s + 1000, 600, { label: 'JOIN' })
    }
  })

  b.op('api', 'sp_ids', 13300, 800, { event: 'Resolver referencias' })
  b.ev(14100, 'sp_ids', 'running')
  b.op('sp_ids', 'api', 14150, 700)
  b.ev(14500, 'sp_ids', 'ok')

  b.op('api', 'sp_versions', 14800, 800, { event: 'Consultar SharePoint' })
  b.op('api', 'sp_files', 14800, 800)
  b.ev(15600, 'sp_versions', 'running')
  b.ev(15600, 'sp_files', 'running')
  b.op('sp_versions', 'api', 15650, 700)
  b.op('sp_files', 'api', 15650, 700)
  b.ev(16000, 'sp_versions', 'ok')
  b.ev(16000, 'sp_files', 'ok')
  b.ev(16350, 'slot_ver', 'ok')

  b.ev(16800, 'api', 'running', 'Componiendo respuesta')
  b.ev(17600, 'asm', 'ok')
  b.ev(17600, 'api', 'ok', null)
  b.cap(17700, 'El expediente se administra mediante componentes distribuidos que deben mantenerse coordinados.', 'info')

  return b.build({ id: 'scene1', duration: 25000, nodes, links })
}
