import { Builder } from '../builder'
import type { LinkDef, NodeDef, Script } from '../types'
import { chip, v3Finish, v3Links, v3Nodes, via } from './arch'

export type V3ExtraId = 'integrity' | 'bigfile' | 'confid'
export const V3_EXTRA_TITLES: Record<V3ExtraId, string> = {
  integrity: 'Integridad documental',
  bigfile: 'Archivo de gran tamaño',
  confid: 'Confidencialidad',
}
export const V3_PROFILES = ['Ciudadano', 'Funcionario competente', 'Administrador técnico']
export interface V3ExtraOpts {
  integrity: 'verify' | 'tamper'
  bigfile: 'interrupt' | 'smooth'
  profile: number
}

// ---------------------------------------------------------------------------
function integrity(variant: 'verify' | 'tamper'): Script {
  const b = new Builder()
  const nodes = v3Nodes()
  const links: LinkDef[] = [...v3Links()]
  for (let i = 0; i < 5; i++) {
    nodes.push(chip(`ch${i}`, `Evento ${i + 1}`, 'History', 12 + i * 215, 618, 200, 56, { small: true, compact: false, sub: i === 0 ? 'h(datos)' : `h(h${i} + datos)` }))
    if (i > 0) links.push({ from: `ch${i - 1}`, to: `ch${i}` })
  }
  nodes.push({ id: 'mf', kind: 'card', label: 'Manifiesto verificable', sub: 'raíz de hashes · copia independiente', icon: 'BadgeCheck', emphasis: 'navy', x: 1110, y: 618, w: 478, h: 56 })

  b.cap(0, 'Cada evento incluye el hash del anterior: alterar uno rompe la cadena.', 'info')
  for (let i = 0; i < 5; i++) {
    const s = 800 + i * 900
    b.ev(s, `ch${i}`, 'running')
    if (i > 0) b.op(`ch${i - 1}`, `ch${i}`, s, 700, { label: 'hash' })
    b.ev(s + 800, `ch${i}`, 'ok')
  }
  b.ev(800, 'mg_events', 'ok', 'cadena de hashes')

  // sellado
  const sealAt = 5800
  b.cap(sealAt, 'Se calcula el hash de cada componente y su raíz se publica en un manifiesto verificable fuera de MongoDB.', 'running')
  const parts = ['mg_cur', 'mg_items', 'mg_events', 'mg_snaps', 'mg_obj', 'mg_rel']
  parts.forEach((id, i) => {
    b.op(id, 'mf', sealAt + i * 450, 1400, { label: i === 0 ? 'hash' : undefined })
    b.ev(sealAt + i * 450, id, 'running')
    b.ev(sealAt + i * 450 + 1400, id, 'ok')
  })
  b.ev(sealAt + 4300, 'mf', 'ok', 'raíz 9C41…B07')
  b.ev(sealAt + 4300, 'os_man', 'ok', 'manifiesto')

  let t = sealAt + 5200
  if (variant === 'tamper') {
    b.cap(t, 'Alguien modifica una relación directamente en la base de datos, sin pasar por el Gestor.', 'error')
    b.ev(t + 400, 'mg_rel', 'error', 'alterada fuera del Gestor')
    t += 3000
  }
  b.cap(t, 'Verificación: un worker recalcula los hashes y los compara con el manifiesto.', 'running')
  b.ev(t, 'wk_verif', 'running', 'recalcular hashes')
  b.ev(t, 'sg_integ', 'running')
  parts.forEach((id, i) => {
    const s = t + i * 450
    b.op(id, 'wk_verif', s, 1100, { label: i === 0 ? 'leer' : undefined, outcome: variant === 'tamper' && id === 'mg_rel' ? 'error' : 'ok' })
    if (variant === 'tamper' && id === 'mg_rel') b.ev(s + 1100, id, 'error', 'hash distinto')
    else b.ev(s + 1100, id, 'ok')
  })
  const cmp = t + 4000
  b.op('wk_verif', 'mf', cmp, 1200, { label: 'comparar', outcome: variant === 'tamper' ? 'error' : 'ok' })
  if (variant === 'tamper') {
    b.ev(cmp + 1200, 'mf', 'error', 'raíz ≠ recalculada')
    b.ev(cmp + 1200, 'wk_verif', 'error', 'discrepancia')
    b.ev(cmp + 1200, 'sg_integ', 'error', 'alteración detectada')
    b.cap(cmp + 1200, 'La raíz recalculada no coincide con el manifiesto externo: la alteración se detecta y queda evidencia independiente.', 'error')
    b.ban(cmp + 2400, cmp + 9000, 'Detectado: la copia externa del manifiesto actúa como evidencia', 'error')
  } else {
    b.ev(cmp + 1200, 'mf', 'ok', 'raíz coincide')
    b.ev(cmp + 1200, 'wk_verif', 'ok', 'verificado')
    b.ev(cmp + 1200, 'sg_integ', 'ok', 'integridad verificada')
    b.cap(cmp + 1200, 'Todos los hashes coinciden con el manifiesto: el expediente está íntegro.', 'ok')
    b.ban(cmp + 2400, cmp + 9000, 'Integridad verificable sin depender solo de MongoDB', 'info')
  }
  return v3Finish(b, { id: `v3x-int-${variant}`, duration: cmp + 10000, nodes, links, overlay: 'none', bannerPos: { x: 12, y: 692, w: 1576 } })
}

// ---------------------------------------------------------------------------
function bigfile(variant: 'interrupt' | 'smooth'): Script {
  const b = new Builder()
  const nodes = v3Nodes({ doc: true }).map((n) => (n.id === 'doc' ? { ...n, label: 'Video de inspección', sub: '8 GB · 12 partes', icon: 'Files' } : n))
  const links: LinkDef[] = [...v3Links(), { from: 'doc', to: 'os_vid', bend: 0.38 }]
  const N = 12
  for (let i = 0; i < N; i++) {
    nodes.push(chip(`pt${i}`, `Parte ${i + 1}`, 'Package', 12 + i * 131, 622, 120, 44, { small: true, compact: false, sub: '~680 MB' }))
  }
  const fail = variant === 'interrupt'
  const FAIL_AT = 6
  const resume = 11400
  const startOf = (i: number) => (fail && i >= FAIL_AT ? resume + (i - FAIL_AT) * 700 : 1900 + 1700 + i * 700)

  b.cap(0, 'Un archivo de 8 GB se divide en partes que se cargan directo al Object Storage.', 'info')
  const a = via(b, 'an_vis', 'sg_auth', 600, 'solicitar carga grande')
  b.op('sg_auth', 'tx', a + 100, 500)
  b.op('tx', 'mg_outbox', a + 600, 650, { event: 'insert operaciones_outbox' })
  b.ev(a + 1250, 'mg_outbox', 'pending', 'carga multiparte pendiente')
  b.op('sg_auth', 'gw_route', a + 100, 500, { label: 'autorización por partes' })
  b.op('gw_route', 'doc', a + 600, 800)
  b.ev(a + 1400, 'doc', 'running', 'dividiendo')
  b.ev(a + 1500, 'sg_auth', 'ok')
  for (let i = 0; i < N; i++) b.ev(a + 1500 + i * 60, `pt${i}`, 'idle')

  for (let i = 0; i < N; i++) {
    const s = startOf(i)
    const lost = fail && i === FAIL_AT
    b.ev(s, `pt${i}`, 'running')
    if (lost) {
      b.op(`pt${i}`, 'os_vid', s, 1400, { big: true, outcome: 'lost', label: `parte ${i + 1}` })
      b.ev(s + 1000, `pt${i}`, 'error', 'interrumpida')
    } else {
      b.op(`pt${i}`, 'os_vid', s, 1100, { big: i % 4 === 0, label: i % 3 === 0 ? `parte ${i + 1}` : undefined })
      b.ev(s + 1100, `pt${i}`, 'ok', 'confirmada')
    }
    b.ev(s + 300, 'os_vid', 'running', `${Math.min(N, i + 1)}/${N} partes`)
  }
  // la parte interrumpida se reenvía
  if (fail) {
    b.cap(startOf(FAIL_AT) + 1000, 'Se interrumpe la conexión en la parte 7. Las partes 1 a 6 ya están confirmadas y no se repiten.', 'error')
    b.op('mg_outbox', 'gw_route', startOf(FAIL_AT) + 1300, 600, { outcome: 'pending', hold: 2600, holdLabel: 'pendiente · reanudar' })
    b.cap(resume - 600, 'Al reanudar, solo se envían las partes pendientes, de la 7 a la 12.', 'running')
    b.ev(resume, `pt${FAIL_AT}`, 'running', 'reintento')
  } else {
    b.cap(1900 + 1700, 'Las partes se envían en paralelo; cada una se confirma por separado.', 'running')
  }

  const lastEnd = startOf(N - 1) + 1100
  b.ev(lastEnd, 'os_vid', 'ok', '12/12 partes')
  b.cap(lastEnd, 'Todas las partes están en el Object Storage. Un worker las ensambla y verifica el hash completo.', 'running')
  b.op('os_vid', 'wk_verif', lastEnd + 200, 800, { label: 'archivo completo' })
  b.ev(lastEnd + 1000, 'wk_verif', 'running')
  b.ev(lastEnd + 2500, 'wk_verif', 'ok', 'hash verificado')
  b.op('wk_verif', 'tx', lastEnd + 2600, 800)
  b.ev(lastEnd + 3400, 'tx', 'running')
  b.op('tx', 'mg_obj', lastEnd + 3500, 700, { label: 'ref + hash', event: 'insert objetos_digitales' })
  b.op('tx', 'mg_outbox', lastEnd + 3500, 700)
  b.ev(lastEnd + 4200, 'mg_obj', 'ok', '+1 objeto · 8 GB')
  b.ev(lastEnd + 4200, 'mg_outbox', 'ok', 'completada')
  b.ev(lastEnd + 4200, 'tx', 'ok')
  b.ev(lastEnd + 4200, 'doc', 'ok', 'incorporado')
  b.cap(lastEnd + 4200, 'MongoDB solo guarda la referencia y el hash: ningún byte del video pasa por la base de datos.', 'ok')
  b.ban(lastEnd + 5200, lastEnd + 11000, 'Carga reanudable: no se repite lo que ya fue confirmado', 'info')
  return v3Finish(b, { id: `v3x-big-${variant}`, duration: lastEnd + 12000, nodes, links, overlay: 'none', bannerPos: { x: 12, y: 696, w: 1576 } })
}

// ---------------------------------------------------------------------------
const ITEMS: [string, string, string, string][] = [
  ['cf0', 'Documento público', 'FileText', 'sin restricción'],
  ['cf1', 'Documento interno', 'FileText', 'uso institucional'],
  ['cf2', 'Documento reservado', 'Lock', 'acceso por competencia'],
  ['cf3', 'Metadatos restringidos', 'Hash', 'datos sensibles'],
  ['cf4', 'Versión histórica', 'History', 'del doc. reservado'],
  ['cf5', 'Exportación', 'Download', 'del doc. reservado'],
  ['cf6', 'Descarga', 'Download', 'del doc. reservado'],
]
const ALLOW = [
  [1, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0],
]
const PROFILE_NODE = ['an_ciud', 'an_func', 'an_adm']
const PROFILE_CAP = [
  'Un ciudadano solo accede a lo público; lo demás se deniega.',
  'Un funcionario competente accede según su competencia sobre el expediente.',
  'El administrador técnico opera la plataforma, pero no obtiene acceso automático a información reservada.',
]

function confid(profile: number): Script {
  const b = new Builder()
  const nodes = v3Nodes()
  const links: LinkDef[] = [...v3Links()]
  ITEMS.forEach(([id, label, icon, sub], i) => {
    nodes.push(chip(id, label, icon, 12 + i * 226, 622, 214, 52, { small: true, compact: false, sub }))
  })
  b.cap(0, `Perfil seleccionado: ${V3_PROFILES[profile]}. La misma política se aplica a cada acceso.`, 'info')
  const a = via(b, PROFILE_NODE[profile], 'sg_auth', 900, 'solicitar acceso', 'GET /expedientes/{IUIe}/documentos')
  b.ev(a + 200, 'sg_conf', 'running', 'evaluar sensibilidad')
  b.cap(a, 'El módulo de Seguridad decide: el Gateway solo enruta.', 'running')
  ITEMS.forEach(([id], i) => {
    const s = a + 900 + i * 1200
    b.op('sg_conf', id, s, 900, { label: i === 0 ? 'evaluar' : undefined })
    const allowed = !!ALLOW[profile][i]
    b.ev(s + 900, id, allowed ? 'ok' : 'error', allowed ? 'Permitido' : 'Denegado')
  })
  const end = a + 900 + ITEMS.length * 1200
  b.op('sg_conf', 'sg_audit', end, 700, { label: 'registrar' })
  b.ev(end + 700, 'sg_audit', 'ok', 'decisiones registradas')
  b.ev(end + 700, 'sg_conf', 'ok')
  b.cap(end + 700, PROFILE_CAP[profile], profile === 1 ? 'ok' : 'pending')
  b.ban(end + 1800, end + 8000, 'La confidencialidad se evalúa en cada acceso, también en versiones, exportación y descarga', 'info')
  return v3Finish(b, { id: `v3x-conf-${profile}`, duration: end + 9000, nodes, links, overlay: 'none', bannerPos: { x: 12, y: 696, w: 1576 } })
}

export function buildV3Extra(id: V3ExtraId, o: V3ExtraOpts): Script {
  if (id === 'integrity') return integrity(o.integrity)
  if (id === 'bigfile') return bigfile(o.bigfile)
  return confid(o.profile)
}

export type { NodeDef }
