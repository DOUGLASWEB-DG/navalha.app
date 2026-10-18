import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEFAULT_BARBEARIA_ID } from '../lib/tenant-host'
import { seedDefaultCategories } from './seed-data'
import { assertLocalDatabase } from '../scripts/local-db-guard'

// Antes de criar o client: o seed escreve dados e nunca roda fora do banco local
assertLocalDatabase('seed')
const prisma = new PrismaClient()

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD precisa estar definido (mínimo 12 caracteres).')
  }

  // Barbearia padrão. Via migrate deploy ela já existe (criada pela migration do Bloco 2);
  // via db push não, por isso o upsert. Barbearia existente nunca é alterada.
  await prisma.barbearia.upsert({
    where: { id: DEFAULT_BARBEARIA_ID },
    update: {},
    create: {
      id: DEFAULT_BARBEARIA_ID,
      name: 'América Barbearia',
      subdomain: 'america',
      timezone: 'America/Porto_Velho',
    },
  })

  // ─── Seed Categorias Financeiras (por barbearia, chave barbeariaId + nome) ───
  await seedDefaultCategories(prisma, DEFAULT_BARBEARIA_ID)

  // Seed Usuário Admin
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  await prisma.user.upsert({
    where: { email: 'admin@administrador.com' },
    // Admin existente: nunca sobrescrever a senha (evita reset acidental em produção)
    update: {
      role: Role.ADMIN, // Garantir que está como ADMIN no formato Enum
    },
    create: {
      id: 'user-admin',
      barbeariaId: DEFAULT_BARBEARIA_ID,
      name: 'Administrador',
      email: 'admin@administrador.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  console.log('✅ Dados base inseridos com sucesso (Categorias e Admin)! Dados fictícios removidos.')
  console.log('Login: admin@administrador.com (senha definida por SEED_ADMIN_PASSWORD; admin existente mantém a senha atual)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
