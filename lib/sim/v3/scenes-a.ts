import { Builder } from '../builder'
import type { Script } from '../types'
import { v3Finish, v3Nodes, via } from './arch'

export const S1_STEPS = [
  'Crear procedimiento',
  'Crear expediente',
  'Registrar estado inicial',
  'Generar evento de creación',
  'Documento rector en MongoDB',
  'Índice inicial',
  'Primera actuación',
  'Actualizar estado y agregar evento',
]

export const S1_FINAL = 'Un Gestor, una autoridad funcional, un expediente con historia propia'

export function buildV3Scene1(): Script {
  const b = new Builder()
  const nodes = v3Nodes()
  const done = (n: number, at: number) => b.step(at, n, 'ok')

  b.cap(0, 'El Gestor Ministerial completo: tramitación y expediente son dos dominios del mismo servicio.', 'info')

  // 1 · procedimiento
  b.step(900, 0, 'running')
  b.cap(900, '1 · Un administrador crea un procedimiento. La configuración queda versionada.', 'running')
  const a1 = via(b, 'an_adm', 'ad_proc', 900, 'crear procedimiento', 'POST /procedimientos')
  b.op('ad_proc', 'tx', a1 + 100, 600, { label: 'config. v1' })
  b.ev(a1 + 700, 'tx', 'running')
  b.op('tx', 'mg_proc', a1 + 800, 750, { event: 'insert procedimientos_versiones' })
  b.ev(a1 + 1550, 'mg_proc', 'ok', 'v1')
  b.ev(a1 + 1550, 'ad_proc', 'ok')
  b.ev(a1 + 1550, 'tx', 'ok')
  done(0, a1 + 1550)

  // 2 · expediente
  let t = 5600
  b.step(t, 1, 'running')
  b.cap(t, '2 · Un funcionario crea el expediente: nace con su IUIe dentro del Gestor.', 'running')
  const a2 = via(b, 'an_func', 'iuie', t, 'crear expediente', 'POST /expedientes')
  b.ev(a2 + 700, 'iuie', 'ok', 'IUIe 7F3A-2C91')
  b.ev(a2 + 700, 'tx', 'idle')
  done(1, a2 + 700)

  // 3 · estado inicial
  t = a2 + 1000
  b.step(t, 2, 'running')
  b.cap(t, '3 · Tramitación registra el estado inicial del expediente.', 'running')
  b.op('iuie', 'tr_est', t, 650, { label: 'estado inicial' })
  b.ev(t + 650, 'tr_est', 'running')
  b.ev(t + 1500, 'tr_est', 'ok', 'Iniciado')
  done(2, t + 1500)

  // 4 · evento de creación (transacción corta abierta)
  t = t + 1800
  b.step(t, 3, 'running')
  b.cap(t, '4 · Se genera el evento de creación. Estado y evento se confirman juntos en una transacción corta.', 'running')
  b.op('tr_est', 'hi_ev', t, 650, { label: 'creación' })
  b.ev(t + 650, 'hi_ev', 'running')
  b.op('hi_ev', 'tx', t + 700, 600)
  b.ev(t + 1300, 'tx', 'running', 'transacción corta')
  b.op('tx', 'mg_events', t + 1400, 750, { event: 'insert expediente_events #1' })
  b.ev(t + 2150, 'mg_events', 'ok', '#1 creación')
  b.ev(t + 2150, 'hi_ev', 'ok', 'evento #1')
  done(3, t + 2150)

  // 5 · documento rector
  t = t + 2400
  b.step(t, 4, 'running')
  b.cap(t, '5 · El documento rector, compacto, representa el estado vigente en MongoDB.', 'running')
  b.op('tx', 'mg_cur', t, 750, { event: 'insert expedientes_current' })
  b.ev(t + 750, 'mg_cur', 'running')
  b.ev(t + 1400, 'mg_cur', 'ok', 'rector v1 · Iniciado')
  b.ev(t + 1400, 'xp_rector', 'ok')
  b.ev(t + 1400, 'tx', 'ok')
  done(4, t + 1400)

  // 6 · índice inicial
  t = t + 1700
  b.step(t, 5, 'running')
  b.cap(t, '6 · El índice documental se inicializa como estructura propia, separada del documento rector.', 'running')
  b.op('xp_rector', 'xp_indice', t, 550, { label: 'índice' })
  b.ev(t + 550, 'xp_indice', 'running')
  b.op('xp_indice', 'mg_items', t + 600, 750, { event: 'expediente_items (página 1)' })
  b.ev(t + 1350, 'mg_items', 'ok', '0 ítems · pág. 1')
  b.ev(t + 1350, 'xp_indice', 'ok')
  done(5, t + 1350)

  // 7 · primera actuación
  t = t + 2400
  b.step(t, 6, 'running')
  b.cap(t, '7 · Una actuación ilumina tramitación y expediente a la vez: son el mismo Gestor.', 'running')
  const a7 = via(b, 'an_func', 'tr_act', t, 'nueva actuación', 'POST /actuaciones')
  for (const id of ['xp_indice', 'xp_rector', 'xp_rel']) b.ev(a7 + 100, id, 'running')
  b.op('tr_act', 'xp_indice', a7 + 100, 650, { label: 'actuación' })
  b.ev(a7 + 1500, 'tr_act', 'ok')
  done(6, a7 + 1500)

  // 8 · transacción corta
  t = a7 + 1800
  b.step(t, 7, 'running')
  b.cap(t, '8 · Transacción corta: se actualiza el documento rector y se agrega el nuevo evento.', 'running')
  b.ev(t, 'tx', 'running', 'transacción corta')
  b.op('tr_act', 'tx', t, 600)
  b.op('tx', 'mg_cur', t + 700, 750, { label: 'En revisión', event: 'update expedientes_current' })
  b.op('tx', 'mg_events', t + 700, 750, { label: 'evento #2', event: 'insert expediente_events #2' })
  b.op('tx', 'mg_items', t + 700, 750, { label: '+1 ítem' })
  b.ev(t + 1450, 'mg_cur', 'ok', 'rector v2 · En revisión')
  b.ev(t + 1450, 'mg_events', 'ok', '#2 actuación')
  b.ev(t + 1450, 'mg_items', 'ok', '1 ítem')
  b.ev(t + 1450, 'tr_est', 'ok', 'En revisión')
  b.ev(t + 1450, 'hi_ev', 'ok', 'evento #2')
  for (const id of ['xp_indice', 'xp_rector', 'xp_rel']) b.ev(t + 1450, id, 'ok')
  b.ev(t + 1450, 'tx', 'ok')
  b.ev(t + 1600, 'iuie', 'ok', 'IUIe 7F3A-2C91 · v2')
  done(7, t + 1450)

  b.cap(t + 2200, 'Tramitación y expediente comparten operaciones de negocio dentro de un único Gestor.', 'ok')
  b.ban(t + 2400, t + 9600, S1_FINAL, 'info')
  return v3Finish(b, { id: 'v3s1', duration: t + 10200, nodes, stepLabels: S1_STEPS, overlay: 'steps', bannerPos: { x: 12, y: 688, w: 1576 } })
}

// ---------------------------------------------------------------------------
export type V3Scene2Variant = 'normal' | 'fail'

export const S2_STEPS = [
  'Angular solicita',
  'API Gateway enruta',
  'Gestor valida',
  'Operación pendiente',
  'Autorización de carga',
  'Carga directa',
  'Worker verifica',
  'MongoDB confirma',
  'Índice actualizado',
  'Evento registrado',
  'Documento incorporado',
]

export function buildV3Scene2(variant: V3Scene2Variant): Script {
  const b = new Builder()
  const nodes = v3Nodes({ doc: true })
  const fail = variant === 'fail'
  const d = fail ? 4600 : 0
  const ok = (n: number, at: number) => b.step(at, n, 'ok')

  b.cap(0, 'Un oficio en PDF debe incorporarse al expediente. Los bytes irán directo al Object Storage.', 'info')
  b.ev(300, 'doc', 'idle', 'oficio_0457.pdf')

  // 1 · Angular solicita
  b.step(800, 0, 'running')
  b.cap(800, '1 · Angular solicita la incorporación del documento.', 'running')
  b.ev(800, 'an_vis', 'running')
  b.op('an_vis', 'gw_in', 800, 700, { label: 'solicitar incorporación', event: 'POST /expedientes/{IUIe}/documentos' })
  b.ev(1500, 'an_vis', 'ok')
  b.ev(1500, 'gw_in', 'running')
  ok(0, 1500)

  // 2 · Gateway
  b.step(1700, 1, 'running')
  b.cap(1700, '2 · El API Gateway autentica y enruta. No decide sobre el documento ni su acceso.', 'running')
  b.op('gw_in', 'gw_auth', 1700, 400)
  b.ev(2100, 'gw_in', 'ok')
  b.ev(2100, 'gw_auth', 'running')
  b.op('gw_auth', 'gw_route', 2100, 400)
  b.ev(2500, 'gw_auth', 'ok')
  b.ev(2500, 'gw_route', 'running')
  b.op('gw_route', 'sg_auth', 2500, 700)
  b.ev(3200, 'gw_route', 'ok')
  ok(1, 3200)

  // 3 · validación
  b.step(3200, 2, 'running')
  b.cap(3200, '3 · El Gestor valida permisos y el estado del expediente.', 'running')
  b.ev(3200, 'sg_auth', 'running')
  b.op('sg_auth', 'xp_rector', 3300, 700, { label: 'validar expediente' })
  b.ev(4000, 'xp_rector', 'running')
  b.ev(4600, 'xp_rector', 'ok')
  b.ev(4600, 'sg_auth', 'ok')
  ok(2, 4600)

  // 4 · operación pendiente
  b.step(4800, 3, 'running')
  b.cap(4800, '4 · Se crea una operación pendiente en MongoDB. El documento aún no está incorporado.', 'pending')
  b.op('sg_auth', 'tx', 4800, 500)
  b.ev(5300, 'tx', 'running')
  b.op('tx', 'mg_outbox', 5300, 700, { event: 'insert operaciones_outbox' })
  b.ev(6000, 'mg_outbox', 'pending', 'carga pendiente')
  b.ev(6000, 'tx', 'ok')
  b.step(6000, 3, 'pending')

  // 5 · autorización
  b.step(6300, 4, 'running')
  b.cap(6300, '5 · El Gestor entrega una autorización temporal de carga a Angular.', 'running')
  b.op('sg_auth', 'gw_route', 6300, 500, { label: 'URL temporal' })
  b.op('gw_route', 'doc', 6800, 900, { label: 'autorización de carga' })
  b.ev(7700, 'doc', 'running', 'autorizado')
  b.ev(7700, 'tx', 'idle')
  ok(4, 7700)

  // 6 · carga directa
  b.step(8000, 5, 'running')
  b.cap(8000, '6 · Los bytes viajan directamente de Angular al Object Storage. No atraviesan el Gestor ni MongoDB.', 'running')
  b.ev(8000, 'doc', 'running', 'subiendo')
  if (!fail) {
    b.op('doc', 'os_pdf', 8000, 2800, { big: true, label: 'bytes del PDF', event: 'PUT objeto (URL temporal)' })
    b.ev(10800, 'os_pdf', 'running')
    b.ev(11400, 'os_pdf', 'ok', 'objeto recibido')
    b.ev(11400, 'doc', 'ok', 'cargado')
    ok(5, 11400)
  } else {
    b.op('doc', 'os_pdf', 8000, 2800, { big: true, outcome: 'lost', label: 'bytes del PDF', event: 'PUT objeto (interrumpido)' })
    b.ev(9800, 'doc', 'error', 'carga interrumpida')
    b.cap(9800, 'La carga se interrumpe. La operación sigue pendiente; el archivo no se considera incorporado.', 'error')
    b.step(9800, 5, 'error')
    b.op('mg_outbox', 'gw_route', 10300, 600, { outcome: 'pending', hold: 2000, holdLabel: 'pendiente · reintento' })
    b.cap(11200, 'La operación pendiente permite reintentar con la misma autorización.', 'pending')
    b.ev(12400, 'doc', 'running', 'reintento 1')
    b.step(12500, 5, 'running')
    b.cap(12500, 'Reintento de carga directa al Object Storage.', 'running')
    b.op('doc', 'os_pdf', 8000 + d, 2800, { big: true, label: 'reintento', event: 'PUT objeto (reintento 1)' })
    b.ev(10800 + d, 'os_pdf', 'running')
    b.ev(11400 + d, 'os_pdf', 'ok', 'objeto recibido')
    b.ev(11400 + d, 'doc', 'ok', 'cargado')
    ok(5, 11400 + d)
  }

  // 7 · worker
  let t = 11600 + d
  b.step(t, 6, 'running')
  b.cap(t, '7 · Un worker verifica el archivo recibido: tamaño, formato y huella.', 'running')
  b.op('os_pdf', 'wk_verif', t, 800, { label: 'objeto nuevo' })
  b.ev(t + 800, 'wk_verif', 'running')
  b.op('wk_verif', 'os_pdf', t + 900, 600, { label: 'leer' })
  b.op('wk_verif', 'wk_proc', t + 900, 600)
  b.ev(t + 1500, 'wk_proc', 'running')
  b.ev(t + 2300, 'wk_verif', 'ok', 'hash verificado')
  b.ev(t + 2300, 'wk_proc', 'ok')
  ok(6, t + 2300)

  // 8 · confirmación
  t = t + 2500
  b.step(t, 7, 'running')
  b.cap(t, '8 · MongoDB confirma la referencia recién después de verificar. No existe transacción entre MongoDB y Object Storage.', 'running')
  b.op('wk_verif', 'tx', t, 900, { label: 'verificado' })
  b.ev(t + 900, 'tx', 'running')
  b.op('tx', 'mg_obj', t + 1000, 700, { label: 'ref + hash', event: 'insert objetos_digitales' })
  b.op('tx', 'mg_outbox', t + 1000, 700, { label: 'completar' })
  b.ev(t + 1700, 'mg_obj', 'ok', '+1 objeto')
  b.ev(t + 1700, 'mg_outbox', 'ok', 'completada')
  b.ev(t + 1700, 'tx', 'ok')
  b.ev(t + 1700, 'xp_obj', 'ok')
  ok(7, t + 1700)
  b.step(t + 1700, 3, 'ok')

  // 9 · índice
  t = t + 2000
  b.step(t, 8, 'running')
  b.cap(t, '9 · El índice incorpora la referencia en su página paginada.', 'running')
  b.op('xp_obj', 'xp_indice', t, 550)
  b.ev(t + 550, 'xp_indice', 'running')
  b.op('xp_indice', 'mg_items', t + 600, 750, { label: '+1 ítem', event: 'expediente_items +1' })
  b.ev(t + 1350, 'mg_items', 'ok', '13 ítems')
  b.ev(t + 1350, 'xp_indice', 'ok')
  ok(8, t + 1350)

  // 10 · evento
  t = t + 1600
  b.step(t, 9, 'running')
  b.cap(t, '10 · Se registra el evento de incorporación en la historia del expediente.', 'running')
  b.op('hi_ev', 'mg_events', t, 750, { label: 'incorporación', event: 'insert expediente_events' })
  b.ev(t, 'hi_ev', 'running')
  b.ev(t + 750, 'mg_events', 'ok', '#3 incorporación')
  b.ev(t + 750, 'hi_ev', 'ok')
  ok(9, t + 750)

  // 11 · final
  t = t + 1100
  b.step(t, 10, 'running')
  b.ev(t + 500, 'iuie', 'ok', 'Documento incorporado')
  b.ev(t + 500, 'mg_cur', 'ok', 'rector v3')
  b.ev(t + 500, 'doc', 'ok', 'incorporado')
  b.ev(t + 500, 'os_ver', 'ok', 'v1')
  ok(10, t + 500)
  b.cap(t + 500, '11 · Documento incorporado: bytes en Object Storage, referencia y evento en MongoDB.', 'ok')
  b.cap(t + 3500, 'Las autorizaciones y confirmaciones viajan por el Gestor; los bytes, directo al Object Storage.', 'info')

  return v3Finish(b, { id: `v3s2-${variant}`, duration: t + 9000, nodes, stepLabels: S2_STEPS, overlay: 'steps' })
}
