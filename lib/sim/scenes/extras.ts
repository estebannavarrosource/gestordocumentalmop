import { archLinks, archNodes, byId, pick } from '../arch'
import { Builder } from '../builder'
import type { LinkDef, NodeDef, Script } from '../types'

export type ExtraId = 'integrity' | 'bigfile' | 'confid'

export const EXTRA_TITLES: Record<ExtraId, string> = {
  integrity: 'Integridad documental',
  bigfile: 'Archivo de gran tamaño',
  confid: 'Confidencialidad',
}

const card = (id: string, label: string, icon: string, x: number, y: number, w: number, h: number, extra: Partial<NodeDef> = {}): NodeDef => ({
  id,
  kind: 'card',
  label,
  icon,
  x,
  y,
  w,
  h,
  ...extra,
})
const chip = (id: string, label: string, icon: string, x: number, y: number, w: number, h: number, extra: Partial<NodeDef> = {}): NodeDef => ({
  id,
  kind: 'chip',
  label,
  icon,
  x,
  y,
  w,
  h,
  ...extra,
})

// ---------------------------------------------------------------------------
function integrity(): Script {
  const b = new Builder()
  const all = archNodes().map((n) => ({ ...n, dense: false }))
  const nodes: NodeDef[] = [
    byId(all, 'exp'),
    byId(all, 'api'),
    ...pick(all, ['pg', 'tbl_documento', 'tbl_exp_doc', 'tbl_indice', 'tbl_evento', 'tbl_relaciones', 'bitacora']),
    { ...byId(all, 'sp'), h: 130 },
    byId(all, 'sp_files'),
    byId(all, 'sp_versions'),
    card('attacker', 'Modificación no autorizada', 'UserX', 25, 270, 200, 100, { sub: 'actor sin permiso' }),
    card('c_hash', 'Hash del archivo', 'Hash', 40, 540, 225, 76, { dashed: true, enter: { at: 6500, dur: 500 } }),
    card('c_rel', 'Sello de relaciones', 'Link2', 285, 540, 225, 76, { dashed: true, enter: { at: 6800, dur: 500 } }),
    card('c_idx', 'Verificación del índice', 'ListTree', 530, 540, 225, 76, { dashed: true, enter: { at: 7100, dur: 500 } }),
    card('c_log', 'Cadena de la bitácora', 'Fingerprint', 775, 540, 225, 76, { dashed: true, enter: { at: 7400, dur: 500 } }),
    card('alert', 'Alteración detectada', 'ShieldAlert', 1130, 360, 440, 110, { sub: 'trazable en la bitácora', emphasis: 'navy', enter: { at: 12000, dur: 500 } }),
  ]
  const links: LinkDef[] = [
    ...archLinks().filter((l) => nodes.some((n) => n.id === l.from) && nodes.some((n) => n.id === l.to)),
    { from: 'tbl_exp_doc', to: 'sp_files', independent: true, faint: true },
  ]

  b.cap(0, 'Proteger el archivo no basta: el expediente también son índice, relaciones y eventos.', 'info')
  ;(['sp_files', 'tbl_exp_doc', 'tbl_indice', 'tbl_evento'] as const).forEach((id, i) => {
    b.ev(700 + i * 350, id, 'ok', id === 'sp_files' ? 'hash ✓' : 'coherente')
  })

  b.op('attacker', 'tbl_exp_doc', 3000, 1200, { outcome: 'error', label: 'UPDATE relación', event: 'Modificación no autorizada' })
  b.ev(3000, 'attacker', 'error', 'sin autorización')
  b.ev(4200, 'tbl_exp_doc', 'error', 'relación alterada')
  b.ev(4600, 'tbl_indice', 'pending', 'ya no coincide')
  b.ev(4900, 'tbl_evento', 'pending', 'sin evento')
  b.ev(4900, 'sp_files', 'ok', 'hash ✓ (sin cambios)')
  b.ban(4300, 6800, 'El archivo sigue íntegro. La que cambió es la relación.', 'error')
  b.cap(4300, 'El hash del archivo sigue siendo válido, pero la relación documental ya no es la original.', 'error')

  b.cap(6500, 'Detectarla exige controles propios sobre relaciones, índice y eventos.', 'running')
  b.op('c_rel', 'tbl_exp_doc', 8000, 800, { label: 'verificar sello', event: 'Verificar sello de relaciones' })
  b.ev(8800, 'c_rel', 'error', 'sello no coincide')
  b.op('c_idx', 'tbl_indice', 9200, 800, { label: 'recomponer' })
  b.ev(10000, 'c_idx', 'error', 'índice ≠ relaciones')
  b.op('c_log', 'tbl_evento', 10400, 800, { label: 'cadena' })
  b.ev(11200, 'c_log', 'pending', 'falta evento firmado')
  b.op('c_hash', 'sp_files', 11600, 800, { label: 'hash' })
  b.ev(12400, 'c_hash', 'ok', 'archivo íntegro')
  b.op('c_rel', 'alert', 12600, 900, { outcome: 'error' })
  b.op('c_idx', 'alert', 12600, 900, { outcome: 'error' })
  b.op('c_log', 'alert', 12600, 900, { outcome: 'pending' })
  b.ev(13500, 'alert', 'ok', 'detectada')
  b.cap(13500, 'Cada capa del expediente requiere su propia verificación; un control sobre archivos no protege lo demás.', 'ok')

  return b.build({ id: 'extra-integrity', duration: 21500, nodes, links })
}

// ---------------------------------------------------------------------------
function bigfile(): Script {
  const b = new Builder()
  const all = archNodes().map((n) => ({ ...n, dense: false }))
  const cks = [1, 2, 3, 4, 5, 6].map((i) =>
    chip(`ck${i}`, `Fragmento ${i}`, 'Package', 1150 + ((i - 1) % 3) * 138, 156 + Math.floor((i - 1) / 3) * 66, 124, 56, { small: true }),
  )
  const nodes: NodeDef[] = [
    card('doc', 'Objeto digital grande', 'Files', 25, 270, 200, 100, { sub: 'carga fragmentada' }),
    byId(all, 'api'),
    ...pick(all, ['pg', 'tbl_exp_doc', 'tbl_idem', 'tbl_concil']),
    { ...byId(all, 'sp'), h: 256 },
    chip('sp_sess', 'Sesión de carga', 'Upload', 1150, 80, 190, 56),
    chip('sp_files', 'Archivo final', 'Files', 1360, 80, 190, 56),
    ...cks,
    card('exp', 'Expediente abierto', 'FolderOpen', 25, 70, 200, 110, { emphasis: 'navy', sub: 'EXP-2025-014532' }),
  ]
  const links: LinkDef[] = [
    { from: 'doc', to: 'api', faint: true },
    { from: 'api', to: 'pg' },
    { from: 'api', to: 'sp', independent: true },
    { from: 'exp', to: 'api', faint: true },
    { from: 'sp_sess', to: 'sp_files', faint: true },
    ...cks.map((c) => ({ from: 'sp_sess', to: c.id, faint: true })),
  ]

  b.cap(0, 'Un objeto digital grande se carga en fragmentos, verificando cada uno. No se asume un límite único de tamaño.', 'info')
  b.op('doc', 'api', 500, 800, { label: 'objeto grande' })
  b.op('api', 'tbl_exp_doc', 1500, 700, { label: 'PENDIENTE' })
  b.op('api', 'tbl_idem', 1500, 700)
  b.ev(2200, 'tbl_exp_doc', 'pending', 'PENDIENTE')
  b.ev(2200, 'exp', 'pending', 'Incorporación pendiente')
  b.op('api', 'sp_sess', 2500, 900, { label: 'crear sesión', event: 'Crear sesión de carga' })
  b.ev(3400, 'sp_sess', 'ok', 'sesión abierta')
  b.ev(3400, 'api', 'running', 'Enviando fragmentos')
  const chunk = (i: number, s: number) => {
    b.op('api', `ck${i}`, s, 800, { big: true, label: `${i}/6`, event: `Fragmento ${i}/6` })
    b.ev(s + 800, `ck${i}`, 'running')
    b.op(`ck${i}`, 'api', s + 850, 500, { label: 'checksum ✓' })
    b.ev(s + 1350, `ck${i}`, 'ok')
  }
  chunk(1, 3600)
  chunk(2, 5000)
  chunk(3, 6400)

  b.op('api', 'ck4', 7800, 900, { outcome: 'lost', big: true, label: '4/6', hold: 2400, holdLabel: 'conexión interrumpida', event: 'Conexión interrumpida' })
  b.ev(8500, 'ck4', 'error', 'incompleto')
  b.ev(8700, 'sp_sess', 'pending', 'sesión parcial')
  b.ev(8700, 'api', 'pending', 'Interrupción')
  b.ban(8700, 11200, 'Interrupción: la carga queda parcial y requiere recuperación', 'error')
  b.cap(8700, 'La carga queda a medias: hay que averiguar qué recibió SharePoint antes de continuar.', 'error')

  b.op('api', 'sp_sess', 11200, 700, { label: '¿qué recibió?', coord: true })
  b.op('sp_sess', 'api', 11950, 700, { label: 'f1–f3 ✓' })
  b.ev(11950, 'api', 'running', 'Reanudando desde el fragmento 4')
  b.ev(12650, 'ck4', 'idle', null)
  b.ev(12650, 'sp_sess', 'running', 'reanudada')
  b.cap(11200, 'Se consulta la sesión y se reanuda desde el último fragmento verificado.', 'running')
  chunk(4, 12900)
  chunk(5, 14300)
  chunk(6, 15700)

  b.op('api', 'sp_files', 17200, 900, { label: 'hash total', coord: true, event: 'Confirmar y verificar hash total' })
  b.op('sp_files', 'api', 18200, 800, { label: 'hash ✓' })
  b.ev(18200, 'sp_files', 'ok', 'íntegro')
  b.ev(18200, 'sp_sess', 'ok', 'cerrada')
  b.op('api', 'tbl_exp_doc', 19100, 700, { label: 'CONFIRMADA', final: true })
  b.ev(19800, 'tbl_exp_doc', 'ok', 'CONFIRMADA')
  b.ev(19800, 'exp', 'ok', 'Consistente')
  b.ev(19800, 'api', 'ok', null)
  b.cap(19800, 'Una interrupción no se resuelve reenviando todo: exige consultar, reanudar y verificar la integridad total.', 'ok')
  b.ban(19800, 23500, 'Los límites exactos deben validarse con la documentación vigente de SharePoint Online', 'info')

  return b.build({ id: 'extra-bigfile', duration: 25000, nodes, links })
}

// ---------------------------------------------------------------------------
function confid(): Script {
  const b = new Builder()
  const all = archNodes()
  const nodes: NodeDef[] = [
    card('u_a', 'Usuario con acceso general', 'UserCheck', 25, 60, 215, 90),
    card('u_b', 'Usuario sin acceso', 'UserX', 25, 200, 215, 90),
    card('u_c', 'Usuario con permiso específico', 'KeyRound', 25, 340, 215, 90),
    { ...byId(all, 'api'), x: 300, y: 185 },
    card('policy', 'Control de acceso', 'ShieldCheck', 580, 200, 180, 100, { sub: 'expediente y objeto', emphasis: 'navy' }),
    { id: 'objs', kind: 'group', label: 'Expediente EXP-2025-014532', sub: 'acceso general restringido', icon: 'Lock', x: 830, y: 36, w: 360, h: 430 },
    chip('o_a', 'Documento A · acceso general', 'Files', 850, 90, 320, 56),
    chip('o_b', 'Documento B · reservado', 'Lock', 850, 158, 320, 56),
    chip('o_c', 'Documento C · permiso específico', 'KeyRound', 850, 226, 320, 56),
    chip('c_hist', 'Consulta histórica', 'History', 850, 316, 320, 56),
    chip('c_export', 'Exportación', 'Download', 850, 384, 320, 56),
    card('acc_log', 'Registro de accesos', 'ScrollText', 1250, 200, 270, 90, { sub: 'bitácora protegida' }),
  ]
  const links: LinkDef[] = [
    { from: 'u_a', to: 'api', faint: true },
    { from: 'u_b', to: 'api', faint: true },
    { from: 'u_c', to: 'api', faint: true },
    { from: 'api', to: 'policy' },
    { from: 'policy', to: 'objs' },
    { from: 'policy', to: 'acc_log', faint: true },
  ]

  b.cap(0, 'Un expediente puede tener acceso general restringido y objetos con reglas específicas.', 'info')

  // 1 · sin acceso
  b.ev(300, 'u_b', 'running')
  b.op('u_b', 'api', 400, 700, { label: 'consulta' })
  b.op('api', 'policy', 1150, 600)
  b.op('policy', 'objs', 1800, 700, { outcome: 'error', label: 'denegado', event: 'Acceso al expediente denegado' })
  b.ev(2500, 'u_b', 'error', 'sin acceso')
  b.op('policy', 'acc_log', 1800, 800, { label: 'registro' })
  b.cap(400, 'Sin pertenencia al acceso general, ni siquiera se abre el expediente.', 'error')

  // 2 · acceso general
  b.reset(3700)
  b.ev(3800, 'u_a', 'running')
  b.op('u_a', 'api', 3900, 700, { label: 'consulta' })
  b.op('api', 'policy', 4650, 600)
  b.op('policy', 'o_a', 5300, 700)
  b.op('policy', 'o_b', 5300, 700, { outcome: 'error', label: 'reservado' })
  b.op('policy', 'o_c', 5300, 700, { outcome: 'error' })
  b.ev(6000, 'o_a', 'ok', 'permitido')
  b.ev(6000, 'o_b', 'error', 'denegado')
  b.ev(6000, 'o_c', 'error', 'denegado')
  b.ev(6000, 'u_a', 'ok', 'acceso general')
  b.cap(3900, 'Acceso general no implica acceso a todos los objetos: algunos tienen reglas específicas.', 'pending')

  // 3 · permiso específico
  b.reset(7300)
  b.ev(7400, 'u_c', 'running')
  b.op('u_c', 'api', 7500, 700, { label: 'consulta' })
  b.op('api', 'policy', 8250, 600)
  b.op('policy', 'o_a', 8900, 700)
  b.op('policy', 'o_c', 8900, 700)
  b.op('policy', 'o_b', 8900, 700, { outcome: 'error' })
  b.ev(9600, 'o_a', 'ok', 'permitido')
  b.ev(9600, 'o_c', 'ok', 'permiso específico')
  b.ev(9600, 'o_b', 'error', 'denegado')
  b.ev(9600, 'u_c', 'ok')

  // 4 · consulta histórica
  b.reset(11000)
  b.ban(11100, 15000, 'La consulta histórica aplica las mismas autorizaciones', 'pending')
  b.ev(11100, 'u_a', 'running')
  b.op('u_a', 'api', 11200, 700, { label: 'estado a una fecha' })
  b.op('api', 'policy', 11950, 600)
  b.op('policy', 'c_hist', 12600, 700, { label: 'a la fecha' })
  b.op('policy', 'o_b', 12600, 700, { outcome: 'error' })
  b.ev(13300, 'c_hist', 'ok', 'solo lo autorizado')
  b.ev(13300, 'o_b', 'error', 'excluido')
  b.cap(11200, 'La consulta a una fecha anterior debe respetar las autorizaciones, también las de ese momento.', 'pending')

  // 5 · exportación
  b.reset(15200)
  b.ban(15300, 19200, 'La exportación aplica las mismas autorizaciones', 'pending')
  b.ev(15300, 'u_a', 'running')
  b.op('u_a', 'api', 15400, 700, { label: 'exportar' })
  b.op('api', 'policy', 16150, 600)
  b.op('policy', 'c_export', 16800, 700)
  b.op('policy', 'o_b', 16800, 700, { outcome: 'error' })
  b.op('policy', 'o_c', 16800, 700, { outcome: 'error' })
  b.op('policy', 'acc_log', 17500, 700, { label: 'registro' })
  b.ev(17500, 'c_export', 'ok', 'paquete filtrado')
  b.ev(17500, 'o_a', 'ok', 'incluido')
  b.ev(17500, 'o_b', 'error', 'excluido')
  b.ev(17500, 'o_c', 'error', 'excluido')
  b.cap(17500, 'Las autorizaciones deben aplicarse también a la consulta histórica y a la exportación.', 'ok')

  return b.build({ id: 'extra-confid', duration: 22500, nodes, links })
}

export function buildExtra(id: ExtraId): Script {
  switch (id) {
    case 'integrity':
      return integrity()
    case 'bigfile':
      return bigfile()
    default:
      return confid()
  }
}
