'use client'

import Image from 'next/image'
import { FileText, X } from 'lucide-react'
import { useRef } from 'react'

export const AUTHOR = 'Esteban Navarro'

export function BrandMark({ height = 36 }: { height?: number }) {
  return (
    <Image
      src="/logo-agua-gestion.png"
      alt="Agua con gestión, agua con solución"
      width={356}
      height={154}
      priority
      style={{ height, width: 'auto' }}
      className="shrink-0"
    />
  )
}

const DECISIONS: { title: string; body: string }[] = [
  {
    title: 'Un Gestor, dos dominios',
    body: 'Tramitación y expediente son dominios funcionales del mismo Gestor y comparten las operaciones de negocio. Una actuación y su representación documental se confirman en una transacción corta dentro de MongoDB. Desaparece el SSD como motor externo de tramitación.',
  },
  {
    title: 'Documento rector compacto',
    body: 'El expediente vigente se resume en un documento rector pequeño. Eventos, snapshots, índice documental y relaciones viven en colecciones separadas y paginadas, de modo que ningún documento crece sin límite.',
  },
  {
    title: 'Binarios fuera de la base de datos',
    body: 'Los archivos viajan directo de Angular a Object Storage con una autorización temporal emitida por el Gestor. MongoDB guarda solo referencias, versiones y manifiestos de integridad.',
  },
  {
    title: 'Historia como capacidad propia',
    body: 'El estado a una fecha se reconstruye desde el snapshot anterior más los eventos posteriores, con las versiones exactas de los archivos, el índice y las relaciones de ese momento.',
  },
  {
    title: 'Consistencia explícita entre MongoDB y Object Storage',
    body: 'No existe una transacción ACID entre ambos. Cada incorporación nace como operación pendiente, un worker verifica el archivo y solo entonces el Gestor la confirma. Un fallo deja la operación pendiente y reintentable.',
  },
  {
    title: 'Seguridad en el Gestor, no en el Gateway',
    body: 'El API Gateway gestiona entrada, autenticación, enrutamiento, tráfico y versionado. La autorización documental, la confidencialidad y la auditoría se resuelven en el Gestor, también para versiones históricas, exportaciones y descargas.',
  },
]

const LIMITS: string[] = [
  'La propuesta mantiene dependencias externas necesarias: correlativos oficiales, firma electrónica, notificaciones, DocDigital, SUPER e interoperabilidad. Lo que elimina es la separación funcional entre SSD y SME.',
  'Los indicadores de la simulación se derivan de la animación. No representan latencias ni mediciones reales.',
  'El recorrido del SME actual refleja el diseño especificado, sin consultas añadidas para hacerlo parecer más complejo.',
]

export function AnalysisButton() {
  const ref = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex items-center gap-1.5 rounded-lg bg-navy px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure"
      >
        <FileText className="size-3.5" aria-hidden="true" />
        Análisis de arquitectura
      </button>

      <dialog
        ref={ref}
        aria-labelledby="analysis-title"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close()
        }}
        className="m-auto max-h-[88dvh] w-[min(760px,94vw)] rounded-xl border border-slate-line bg-white p-0 text-navy shadow-2xl backdrop:bg-navy/40"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-line px-6 py-4">
            <div className="flex items-center gap-4">
              <BrandMark height={44} />
              <div className="min-w-0">
                <h2 id="analysis-title" className="text-balance text-lg font-bold leading-tight">
                  Análisis de arquitectura · Gestor Ministerial v3
                </h2>
                <p className="mt-0.5 text-[13px] text-slate-ink">
                  Realizado por <span className="font-semibold text-navy">{AUTHOR}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Cerrar análisis"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-ink hover:bg-mist focus-visible:outline-2 focus-visible:outline-azure"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5 text-[14px] leading-relaxed">
            <section>
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-azure">Punto de partida</h3>
              <p className="mt-1.5 text-pretty">
                El Sistema Ministerial de Expedientes actual combina un backend ASP.NET Core 10, PostgreSQL, SharePoint Online y el SSD. El expediente se ensambla a partir de
                estructuras distribuidas y cada operación exige coordinar sistemas que cumplen funciones distintas.
              </p>
            </section>

            <section className="mt-5">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-azure">Propuesta</h3>
              <p className="mt-1.5 text-pretty">
                Angular, un API Gateway, un único Gestor Ministerial con los módulos de tramitación, expediente, historia, administración y seguridad, MongoDB para el estado y
                la historia, Object Storage para los binarios y workers para el procesamiento asíncrono. La arquitectura se organiza alrededor del expediente.
              </p>
            </section>

            <section className="mt-5">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-azure">Decisiones de diseño</h3>
              <dl className="mt-2 flex flex-col gap-3">
                {DECISIONS.map((d) => (
                  <div key={d.title} className="rounded-lg border border-slate-line bg-mist px-4 py-3">
                    <dt className="font-semibold">{d.title}</dt>
                    <dd className="mt-0.5 text-pretty text-slate-ink">{d.body}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-5">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-azure">Alcance y límites</h3>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-pretty">
                {LIMITS.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>

            <p className="mt-6 border-t border-slate-line pt-3 text-[12px] text-slate-ink">Análisis de arquitectura: {AUTHOR}.</p>
          </div>
        </div>
      </dialog>
    </>
  )
}
