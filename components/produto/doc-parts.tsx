import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { itensDoSumario, numeroDe, tituloDe } from '@/lib/produto-docs'

// Peças da documentação do produto (/produto). Só apresentação: o texto vem de app/produto/page.tsx e a numeração, de
// lib/produto-docs.ts. As fontes (.doc-strong, .doc-squeeze e a herança do .doc) estão em app/produto/produto.css.
export const titulo = 'doc-strong'

// A fonte padrão das tabelas e figuras (ABNT: toda tabela ou figura traz a fonte embaixo).
export const FONTE_PADRAO = 'Elaborado pela DrewaWeb (2026).'
export const FONTE_PRINTS = 'Captura de tela da demonstração do Navalha.app, com dados fictícios. DrewaWeb (2026).'

function numeroETitulo(id: string): { numero: string; nome: string } {
  const numero = numeroDe(id)
  const nome = tituloDe(id)
  // Falha alto: uma seção escrita na página sem entrada em lib/produto-docs.ts quebraria o sumário e a numeração.
  if (!numero || !nome) throw new Error(`Seção "${id}" sem entrada em lib/produto-docs.ts`)
  return { numero, nome }
}

export function Capitulo({ id, children }: { id: string; children?: ReactNode }) {
  const { numero, nome } = numeroETitulo(id)
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-24 pt-16 first:pt-0">
      <h2 id={`${id}-titulo`} className={cn(titulo, 'border-b border-white/10 pb-3 text-[1.9rem] leading-tight sm:text-4xl')}>
        <span className="mr-3 text-blue-400">{numero}</span>
        {nome}
      </h2>
      {children}
    </section>
  )
}

export function DocSection({ id, lead, children }: { id: string; lead?: ReactNode; children?: ReactNode }) {
  const { numero, nome } = numeroETitulo(id)
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-24 pt-10">
      <h3 id={`${id}-titulo`} className={cn(titulo, 'text-2xl leading-tight sm:text-[1.7rem]')}>
        <span className="mr-2.5 text-blue-400">{numero}</span>
        {nome}
      </h3>
      {lead && <p className="mt-3 max-w-[68ch] text-[1.05rem] leading-relaxed text-[#b4c2da]">{lead}</p>}
      {children}
    </section>
  )
}

export function Sub({ children }: { children: ReactNode }) {
  return <h4 className={cn(titulo, 'mb-1 mt-8 text-lg')}>{children}</h4>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-[68ch] leading-[1.7] text-[#b4c2da]">{children}</p>
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-200">{children}</code>
}

const tons = {
  info: 'border-blue-400/30 bg-blue-500/10',
  aviso: 'border-amber-400/30 bg-amber-500/10',
} as const

export function Callout({ tone = 'info', title, children }: { tone?: keyof typeof tons; title: string; children: ReactNode }) {
  return (
    <aside className={cn('mt-6 max-w-3xl rounded-2xl border p-5', tons[tone])}>
      <p className={cn(titulo, 'text-lg')}>{title}</p>
      <div className="mt-1.5 leading-relaxed text-[#c7d3e6]">{children}</div>
    </aside>
  )
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-4 max-w-[68ch] space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="doc-squeeze mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <span className="leading-[1.7] text-[#b4c2da]">{item}</span>
        </li>
      ))}
    </ol>
  )
}

// Tabela no padrão da ABNT: "Tabela N – título" em cima (o número é automático, em produto.css) e "Fonte:" embaixo.
export function RuleTable({
  titulo: tituloDaTabela,
  head,
  rows,
  fonte = FONTE_PADRAO,
}: {
  titulo: string
  head: [string, string]
  rows: [ReactNode, ReactNode][]
  fonte?: string
}) {
  return (
    <div className="mt-6 max-w-3xl">
      <div className="overflow-x-auto">
        <table className="doc-tabela w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-white/10 text-left [&_tbody_tr:not(:first-child)>*]:border-t [&_tbody_tr:not(:first-child)>*]:border-white/10">
          <caption>{tituloDaTabela}</caption>
          <thead className="bg-white/[0.04] text-[#9fb0cc]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">{head[0]}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b], i) => (
              <tr key={i}>
                <th scope="row" className="w-[32%] px-4 py-3 text-left align-top font-semibold text-white">{a}</th>
                <td className="px-4 py-3 align-top leading-relaxed text-[#b4c2da]">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="doc-fonte">Fonte: {fonte}</p>
    </div>
  )
}

// Figura que não é print (um esquema, por exemplo): "Figura N – título" em cima e "Fonte:" embaixo.
export function DocFigura({ titulo: tituloDaFigura, fonte = FONTE_PADRAO, children }: { titulo: string; fonte?: string; children: ReactNode }) {
  return (
    <figure className="mt-6 max-w-3xl">
      <figcaption className="doc-legenda">{tituloDaFigura}</figcaption>
      {children}
      <p className="doc-fonte">Fonte: {fonte}</p>
    </figure>
  )
}

// Sumário (NBR 6027): capítulos e seções com os números da lib/produto-docs.ts. Na tela os itens levam à seção.
export function Sumario() {
  const itens = itensDoSumario()
  return (
    <nav aria-labelledby="sumario-titulo" className="doc-sumario doc-sumario-bloco mt-10 max-w-3xl rounded-2xl border border-white/10 p-6">
      <h2 id="sumario-titulo" className={cn(titulo, 'mb-4 text-2xl')}>
        Sumário
      </h2>
      <ol>
        {itens.map((item) => (
          <li key={item.id} className={item.nivel === 1 ? 'mt-3 first:mt-0' : 'ml-7'}>
            <a
              href={`#${item.id}`}
              className={cn(
                'inline-flex min-h-9 items-center gap-3 rounded-md py-1 text-[#b4c2da] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                item.nivel === 1 ? 'font-bold text-white' : 'text-[0.97rem]',
              )}
            >
              <span className="w-9 shrink-0 text-blue-300">{item.numero}</span>
              {item.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
