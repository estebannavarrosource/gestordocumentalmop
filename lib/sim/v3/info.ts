export const NODE_INFO: Record<string, string> = {
  an: 'Interfaz web para ciudadanos, funcionarios y administradores. Solicita operaciones; los archivos se cargan directo al Object Storage con autorización temporal.',
  gw: 'Entrada única. Autentica, enruta y controla el tráfico. No toma decisiones de negocio ni de acceso a documentos.',
  gest: 'Un único servicio funcional que reúne tramitación, expediente, historia, administración y seguridad. Una sola autoridad sobre el expediente.',
  tr: 'Dominio de tramitación: estados, etapas, actuaciones, responsables, derivaciones, plazos y reglas.',
  ad: 'Configuración versionada de formularios, reglas y procedimientos.',
  iuie: 'El expediente, identificado por su IUIe. Se materializa en el documento rector, el índice, la historia y las referencias a objetos.',
  sg: 'Autorización, confidencialidad, integridad y auditoría, evaluadas dentro del Gestor.',
  tx: 'Transacción corta: actualiza el documento rector y agrega el evento de forma atómica en MongoDB.',
  xp: 'Dominio del expediente: documento rector, índice, relaciones, objetos, versiones y metadatos.',
  hi: 'Historia: eventos encadenados, snapshots y reconstrucción por fecha.',
  mg: 'Base documental. Guarda documento rector, índice paginado, eventos, snapshots, referencias y operaciones pendientes. No guarda los bytes de los archivos.',
  mg_cur: 'Documento rector compacto con el estado vigente. Se lee directo, sin ensamblar otras estructuras.',
  mg_items: 'Índice documental paginado: crece sin engrosar el documento rector.',
  mg_events: 'Eventos encadenados por hash que forman la historia del expediente.',
  mg_snaps: 'Puntos de reconstrucción que acortan la reproducción de eventos.',
  mg_obj: 'Referencias y hashes de los objetos digitales; los bytes están en el Object Storage.',
  mg_outbox: 'Operaciones pendientes que se completan cuando el trabajo asíncrono se verifica.',
  os: 'Almacenamiento de objetos para PDF, imágenes, CAD, GIS, BIM y video. Recibe los bytes directamente desde Angular.',
  wk: 'Workers asíncronos: verifican archivos, procesan documentos, generan snapshots e índices de búsqueda y preparan paquetes de preservación.',
  sv: 'Servicios externos con los que el Gestor se integra. Siguen siendo dependencias externas.',
  doc: 'Documento que se incorpora al expediente.',
}

export function nodeInfo(id: string): string {
  return NODE_INFO[id] ?? NODE_INFO[id.split('_')[0]] ?? 'Componente de la arquitectura propuesta.'
}
