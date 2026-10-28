// Cria uma barbearia nova e o seu proprietário (ADMIN) num banco de INSTALAÇÃO DE CLIENTE (deploy/instancia-cliente).
// Roda dentro da imagem "builder" (tem tsx, Prisma e bcryptjs):
//   docker run --rm --network navalha_default --env-file <slug>.env -e BARBEARIA_NOME=... -e BARBEARIA_SLUG=... \
//     -e ADMIN_NOME=... -e ADMIN_EMAIL=... -e ADMIN_SENHA_HASH='$2b$...' navalha-migrate:<tag> npx tsx scripts/criar-barbearia.ts
//
// Trava: só roda se o banco da DATABASE_URL se chamar navalha_<slug>. Assim este script nunca escreve no banco da América
// (navalha) nem no da demo (navalha_demo), mesmo que alguém aponte a variável errada.
// A senha NÃO entra aqui: o hash bcrypt é gerado no PC (a senha em texto nunca vai ao servidor).
import { PrismaClient, Role } from '@prisma/client'
import { DEFAULT_BARBEARIA_ID, RESERVED_SUBDOMAINS } from '../lib/tenant-host'
import { seedDefaultCategories } from '../prisma/seed-data'

const SUBDOMINIO = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
const NAO_PODE = new Set(['america', 'demo'])

function exigir(nome: string): string {
  const valor = process.env[nome]?.trim()
  if (!valor) throw new Error(`Falta a variável ${nome}.`)
  return valor
}

async function main() {
  const nome = exigir('BARBEARIA_NOME')
  const slug = exigir('BARBEARIA_SLUG').toLowerCase()
  const fuso = process.env.BARBEARIA_TIMEZONE?.trim() || 'America/Porto_Velho'
  const adminNome = exigir('ADMIN_NOME')
  const adminEmail = exigir('ADMIN_EMAIL').toLowerCase()
  const hash = exigir('ADMIN_SENHA_HASH')

  if (!SUBDOMINIO.test(slug) || RESERVED_SUBDOMAINS.has(slug) || NAO_PODE.has(slug)) {
    throw new Error(`Subdomínio "${slug}" inválido, reservado ou já usado (a América e a demo têm o delas).`)
  }
  if (!/^\S+@\S+\.\S+$/.test(adminEmail)) throw new Error('ADMIN_EMAIL inválido.')
  if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(hash)) throw new Error('ADMIN_SENHA_HASH não parece um hash bcrypt.')
  try {
    Intl.DateTimeFormat('pt-BR', { timeZone: fuso })
  } catch {
    throw new Error(`Fuso horário inválido: ${fuso}`)
  }

  // Trava do banco: o nome precisa ser navalha_<slug> (hífen vira sublinhado, como no Postgres da instalação)
  const bancoEsperado = `navalha_${slug.replace(/-/g, '_')}`
  const bancoAtual = new URL(exigir('DATABASE_URL')).pathname.replace(/^\//, '')
  if (bancoAtual !== bancoEsperado) {
    throw new Error(`ABORTADO: o banco é "${bancoAtual}", mas este script só escreve em "${bancoEsperado}".`)
  }

  const prisma = new PrismaClient()
  try {
    const id = `barbearia-${slug}`
    if (await prisma.barbearia.findFirst({ where: { OR: [{ id }, { subdomain: slug }] } })) {
      throw new Error(`A barbearia "${slug}" já existe neste banco; nada foi alterado.`)
    }
    if (await prisma.user.findUnique({ where: { email: adminEmail } })) {
      throw new Error(`O e-mail ${adminEmail} já está cadastrado; nada foi alterado.`)
    }

    await prisma.$transaction(async (tx) => {
      await tx.barbearia.create({ data: { id, name: nome, subdomain: slug, timezone: fuso } })
      await tx.user.create({
        data: { barbeariaId: id, name: adminNome, email: adminEmail, password: hash, role: Role.ADMIN },
      })
      // A migration do Bloco 2 cria a barbearia padrão (América) em todo banco novo. Nesta instalação ela não é de ninguém:
      // fica desativada, para não existir uma barbearia "fantasma" nem as rotas exclusivas da barbearia padrão.
      await tx.barbearia.updateMany({ where: { id: DEFAULT_BARBEARIA_ID }, data: { active: false } })
    })
    await seedDefaultCategories(prisma, id)

    console.log(`OK: barbearia "${nome}" criada (${slug}) no banco ${bancoAtual}, com o proprietário ${adminEmail}.`)
    console.log(`Nota: a cópia da "América" que a migration cria em todo banco novo foi desativada, só dentro de ${bancoAtual}.`)
    console.log('A América de verdade fica em outro banco (navalha) e não foi tocada por este script.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exit(1)
})
