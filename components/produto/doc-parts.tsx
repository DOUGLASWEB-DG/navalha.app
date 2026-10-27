import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Peças da documentação do produto (/produto). Só apresentação: o texto vem de app/produto/page.tsx.
// A variável --font-display é definida na página (next/font), então estas classes só valem dentro dela.
export const titulo = 'font-[family-name:var(--font-display)] font-bold tracking-normal'

export function DocSection({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 py-12 first:border-t-0 first:pt-0">
      <h2 className={cn(titulo, 'text-4xl leading-none sm:text-5xl')}>{title}</h2>
      {lead && <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-[#9fb0cc]">{lead}</p>}
      {children}
    </section>
  )
}

export function Sub({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 mt-9 text-lg font-semibold text-white">{children}</h3>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-[68ch] leading-relaxed text-[#9fb0cc]">{children}</p>
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
      <p className="font-semibold text-white">{title}</p>
      <div className="mt-1.5 text-sm leading-relaxed text-[#c7d3e6]">{children}</div>
    </aside>
  )
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-4 max-w-[68ch] space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white" aria-hidden="true">
            {i + 1}
          </span>
          <span className="leading-relaxed text-[#9fb0cc]">{item}</span>
        </li>
      ))}
    </ol>
  )
}

export function RuleTable({ head, rows }: { head: [string, string]; rows: [ReactNode, ReactNode][] }) {
  return (
    <div className="mt-4 max-w-3xl overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-[#9fb0cc]">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">{head[0]}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{head[1]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map(([a, b], i) => (
            <tr key={i}>
              <th scope="row" className="w-[32%] px-4 py-3 text-left align-top font-semibold text-white">{a}</th>
              <td className="px-4 py-3 align-top leading-relaxed text-[#9fb0cc]">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
