// Cor da inicial do cliente: o tom sai do próprio nome, então o mesmo cliente tem sempre a mesma cor.
// As classes ficam escritas por inteiro de propósito, para o Tailwind encontrá-las.
const AVATAR_TONES = [
  'border-sky-500/25 bg-sky-500/10 text-sky-700',
  'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  'border-violet-500/25 bg-violet-500/10 text-violet-700',
  'border-amber-500/30 bg-amber-500/10 text-amber-700',
  'border-rose-500/25 bg-rose-500/10 text-rose-700',
  'border-cyan-500/25 bg-cyan-500/10 text-cyan-700',
  'border-orange-500/25 bg-orange-500/10 text-orange-700',
  'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700',
  'border-teal-500/25 bg-teal-500/10 text-teal-700',
  'border-indigo-500/25 bg-indigo-500/10 text-indigo-700',
] as const

export function getAvatarTone(seed: string | null | undefined): string {
  const text = (seed ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}
