import { archLinks, archNodes } from '../arch'
import { Builder, concat } from '../builder'
import type { Script } from '../types'

export type Scene2Variant = 'idle' | 'normal' | 'throttle' | 'lost' | 'tour'

export const STEP_LABELS = [
  'Validar comando',
  'Registro PENDIENTE',
  'Preparar archivo',
  'Enviar a SharePoint',
  'Respuesta de SharePoint',
  'Verificar integridad',
  'Confirmar relación',
  'Actualizar índice',
  'Evidencia y evento',
  'Publicar mensajes',
]

const DONE_CAPTION = 'La incorporación puede requerir reintentos y conciliación entre sistemas independientes.'

function baseNodes() {
  return archNodes().map((n) => ({ ...n, dense: false }))
}

function finish(b: Builder, t: number): number {
  // 6 · verificación de integridad
  b.step(t, 5, 'running')
  b.ev(t, 'api', 'running', 'Verificando integridad')
  b.op('api', 'sp_files', t, 600, { label: 'hash?', event: 'Verificar integridad (hash)' })
  b.op('sp_files', 'api', t + 650, 600, { label: 'hash ✓' })
  b.ev(t + 1250, 'api', 'ok', 'Hash verificado')
  b.step(t + 1250, 5, 'ok')
  let u = t + 1250

  // 7 · confirmación de la relación
  b.step(u, 6, 'running')
  b.op('api', 'tbl_exp_doc', u, 800, { event: 'UPDATE relación → CONFIRMADA' })
  b.ev(u + 800, 'tbl_exp_doc', 'ok', 'CONFIRMADA')
  b.step(u + 800, 6, 'ok')
  b.step(u + 800, 1, 'ok')
  u += 800

  // 8 · índice
  b.step(u, 7, 'running')
  b.op('api', 'tbl_indice', u, 800, { event: 'UPDATE índice' })
  b.ev(u + 800, 'tbl_indice', 'ok', 'actualizado')
  b.step(u + 800, 7, 'ok')
  u += 800

  // 9 · evidencia y evento
  b.step(u, 8, 'running')
  b.op('api', 'tbl_evento', u, 800, { event: 'INSERT evento + evidencia' })
  b.op('api', 'bitacora', u, 900)
  b.ev(u + 800, 'tbl_evento', 'ok')
  b.ev(u + 900, 'bitacora', 'ok', 'registrado')
  b.step(u + 900, 8, 'ok')
  u += 900

  // 10 · outbox
  b.step(u, 9, 'running')
  b.op('api', 'tbl_outbox', u, 700, { label: 'mensaje' })
  b.ev(u + 700, 'tbl_outbox', 'pending', 'mensaje pendiente')
  b.op('tbl_outbox', 'ext_notif', u + 800, 1100, { coord: true, event: 'Publicar outbox → notificación', final: true })
  b.ev(u + 1900, 'ext_notif', 'ok')
  b.ev(u + 1900, 'tbl_outbox', 'ok', 'publicado')
  b.step(u + 1900, 9, 'ok')
  u += 1900

  b.ev(u + 300, 'exp', 'ok', 'Consistente · +1 documento')
  b.ev(u + 300, 'doc', 'ok', 'incorporado')
  b.ev(u + 300, 'api', 'ok', null)
  b.cap(u + 300, DONE_CAPTION, 'ok')
  return u + 300
}

function head(b: Builder) {
  b.cap(0, 'Un documento debe entrar a un expediente abierto. Cada confirmación es un paso distinto.', 'info')

  // 1 · validación
  b.step(300, 0, 'running')
  b.op('doc', 'api', 300, 900, { label: 'comando', event: 'POST /incorporar-documento' })
  b.ev(1200, 'api', 'running', 'Validando comando')
  b.step(1500, 0, 'ok')

  // 2 · registro PENDIENTE
  b.step(1500, 1, 'running')
  b.op('api', 'tbl_exp_doc', 1600, 800, { label: 'INSERT', event: 'INSERT relación · PENDIENTE' })
  b.op('api', 'tbl_idem', 1600, 800, { label: 'clave' })
  b.ev(2400, 'tbl_exp_doc', 'pending', 'PENDIENTE')
  b.ev(2400, 'tbl_idem', 'ok', 'clave registrada')
  b.ev(2400, 'exp', 'pending', 'Incorporación pendiente')
  b.step(2400, 1, 'pending')

  // 3 · preparación
  b.step(2500, 2, 'running')
  b.ev(2500, 'api', 'running', 'Preparando archivo (hash)')
  b.step(3500, 2, 'ok')

  // 4 · envío
  b.step(3600, 3, 'running')
  b.op('api', 'sp_files', 3600, 1100, { big: true, label: 'PUT archivo', event: 'PUT archivo (REST)' })
  b.ev(4700, 'sp_files', 'running', 'Recibiendo')
}

function normal(): Script {
  const b = new Builder()
  head(b)
  b.ban(3600, 9400, 'PostgreSQL y SharePoint no comparten una transacción única', 'pending')
  b.cap(3600, 'Mientras el archivo viaja, la relación documental permanece PENDIENTE.', 'pending')
  b.step(4700, 3, 'ok')
  b.step(4700, 4, 'running')
  b.op('sp_files', 'api', 5000, 900, { label: '201 + id' })
  b.ev(5000, 'sp_files', 'ok', 'Archivo recibido')
  b.ev(5900, 'sp_ids', 'ok', 'id de recurso')
  b.step(5900, 4, 'ok')
  const end = finish(b, 5900)
  return b.build({ id: 'scene2-normal', duration: end + 3500, nodes: baseNodes(), links: archLinks(), overlay: 'steps', stepLabels: STEP_LABELS })
}

function throttle(): Script {
  const b = new Builder()
  head(b)
  b.ban(3600, 5000, 'PostgreSQL y SharePoint no comparten una transacción única', 'pending')
  b.cap(3600, 'SharePoint puede limitar el consumo de solicitudes mientras el SME espera.', 'pending')

  // SharePoint responde 429
  b.step(4700, 3, 'error')
  b.op('sp_files', 'api', 5000, 800, { outcome: 'error', label: 'HTTP 429', hold: 2600, holdLabel: 'espera · Retry-After', event: 'HTTP 429 Too Many Requests' })
  b.op('sp_files', 'sp_queue', 5000, 500, { outcome: 'pending', label: 'cola' })
  b.ev(5000, 'sp_files', 'error', '429')
  b.ev(5500, 'sp_queue', 'pending', 'en cola')
  b.ev(5800, 'api', 'pending', 'Reintento programado')
  b.step(5800, 4, 'error')
  b.ban(5000, 8400, 'La incorporación permanece PENDIENTE: se programa un reintento', 'error')
  b.cap(5000, 'La conexión falla, el expediente sigue PENDIENTE y se programa un reintento.', 'error')

  // reintento
  b.step(8400, 3, 'running')
  b.step(8400, 4, 'pending')
  b.ev(8400, 'api', 'running', 'Reintento 1')
  b.ev(8400, 'sp_files', 'running', 'Reintentando')
  b.ev(8400, 'sp_queue', 'idle', null)
  b.op('api', 'sp_files', 8400, 1100, { big: true, label: 'PUT (reintento)', event: 'Reintento PUT' })
  b.ban(8400, 10600, 'Se ejecuta nuevamente la operación', 'running')
  b.cap(8400, 'La operación se ejecuta de nuevo; el resultado debe conciliarse antes de confirmar.', 'running')
  b.step(9500, 3, 'ok')
  b.op('sp_files', 'api', 9700, 800, { label: '201 + id' })
  b.ev(9700, 'sp_files', 'ok', 'Archivo recibido')
  b.ev(10500, 'sp_ids', 'ok', 'id de recurso')
  b.step(10500, 4, 'ok')

  // conciliación
  b.ev(10500, 'api', 'running', 'Conciliando')
  b.op('api', 'tbl_concil', 10500, 700, { coord: true, label: 'conciliar', event: 'Conciliar intento y resultado' })
  b.ev(11200, 'tbl_concil', 'ok', 'conciliado')
  const end = finish(b, 11300)
  return b.build({ id: 'scene2-throttle', duration: end + 3500, nodes: baseNodes(), links: archLinks(), overlay: 'steps', stepLabels: STEP_LABELS })
}

function lost(): Script {
  const b = new Builder()
  head(b)
  b.ban(3600, 5000, 'PostgreSQL y SharePoint no comparten una transacción única', 'pending')
  b.cap(3600, 'El archivo viaja a SharePoint mientras la relación sigue PENDIENTE.', 'pending')

  b.step(4700, 3, 'ok')
  b.step(4700, 4, 'running')
  b.ev(4700, 'sp_files', 'ok', 'Archivo recibido')
  b.op('sp_files', 'api', 5000, 900, { outcome: 'lost', label: '201', hold: 2200, holdLabel: 'sin respuesta · timeout', event: 'Respuesta perdida' })
  b.ev(5900, 'api', 'pending', 'Sin confirmación')
  b.step(5900, 4, 'pending')
  b.ban(5000, 8000, 'SharePoint recibió el archivo, pero el SME no recibió la confirmación', 'error')
  b.cap(5000, 'SharePoint ya tiene el archivo, pero el SME no lo sabe. Reenviar a ciegas crearía un duplicado.', 'error')

  // consulta y conciliación
  b.ev(8100, 'api', 'running', 'Consultando antes de reenviar')
  b.op('api', 'tbl_idem', 8100, 600, { label: 'clave' })
  b.op('api', 'sp_files', 8100, 1000, { label: 'GET por clave', event: 'GET por clave de idempotencia' })
  b.ev(8700, 'tbl_idem', 'running')
  b.op('sp_files', 'api', 9200, 800, { label: 'existe · hash ✓' })
  b.ev(9200, 'sp_files', 'ok', 'Ya existe')
  b.ev(10000, 'tbl_idem', 'ok', 'idempotente')
  b.ev(10000, 'api', 'ok', 'Sin duplicado')
  b.ban(8100, 11000, 'Se consulta y concilia antes de completar: no se reenvía', 'ok')
  b.cap(8100, 'El SME consulta y concilia antes de completar, evitando documentos duplicados.', 'ok')
  b.op('api', 'tbl_concil', 10000, 700, { coord: true, label: 'conciliar', event: 'Conciliar con SharePoint' })
  b.ev(10700, 'tbl_concil', 'ok', 'conciliado')
  b.ev(10700, 'sp_ids', 'ok', 'id de recurso')
  b.step(10700, 4, 'ok')
  const end = finish(b, 10800)
  return b.build({ id: 'scene2-lost', duration: end + 3500, nodes: baseNodes(), links: archLinks(), overlay: 'steps', stepLabels: STEP_LABELS })
}

function idle(): Script {
  const b = new Builder()
  b.cap(0, 'Presione «Incorporar documento» para ver la secuencia de confirmaciones.', 'info')
  return b.build({ id: 'scene2-idle', duration: 0, nodes: baseNodes(), links: archLinks(), overlay: 'steps', stepLabels: STEP_LABELS })
}

export function buildScene2(variant: Scene2Variant): Script {
  switch (variant) {
    case 'normal':
      return normal()
    case 'throttle':
      return throttle()
    case 'lost':
      return lost()
    case 'tour':
      return concat([normal(), throttle(), lost()], 400, 'scene2-tour')
    default:
      return idle()
  }
}
