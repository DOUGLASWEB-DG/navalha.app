import { PrismaClient, CategoryType, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ─── Seed Categorias Financeiras ────────────────────────────────────
  const categoriesData = [
    // Receitas
    { id: 'cat-servico',   name: 'Serviço',        icon: 'Scissors',          color: '#00c896', type: CategoryType.INCOME },
    { id: 'cat-produto',   name: 'Produto',         icon: 'Package',           color: '#3b82f6', type: CategoryType.INCOME },
    { id: 'cat-gorjeta',   name: 'Gorjeta',         icon: 'Heart',             color: '#f59e0b', type: CategoryType.INCOME },
    { id: 'cat-outros-r',  name: 'Outros (Receita)',icon: 'MoreHorizontal',    color: '#8b5cf6', type: CategoryType.INCOME },
    // Despesas
    { id: 'cat-materiais', name: 'Materiais',       icon: 'Package',           color: '#ef4444', type: CategoryType.EXPENSE },
    { id: 'cat-aluguel',   name: 'Aluguel',         icon: 'Home',              color: '#06b6d4', type: CategoryType.EXPENSE },
    { id: 'cat-equipamentos', name: 'Equipamentos', icon: 'Wrench',            color: '#f59e0b', type: CategoryType.EXPENSE },
    { id: 'cat-marketing', name: 'Marketing',       icon: 'Megaphone',         color: '#8b5cf6', type: CategoryType.EXPENSE },
    { id: 'cat-salarios',  name: 'Salários',        icon: 'Users',             color: '#3b82f6', type: CategoryType.EXPENSE },
    { id: 'cat-utilidades',name: 'Utilidades',       icon: 'Zap',              color: '#10b981', type: CategoryType.EXPENSE },
    { id: 'cat-impostos',  name: 'Impostos',        icon: 'FileText',          color: '#ef4444', type: CategoryType.EXPENSE },
    { id: 'cat-manutencao',name: 'Manutenção',      icon: 'Settings',          color: '#06b6d4', type: CategoryType.EXPENSE },
    { id: 'cat-transporte',name: 'Transporte',      icon: 'Car',              color: '#3b82f6', type: CategoryType.EXPENSE },
    { id: 'cat-alimentacao',name: 'Alimentação',    icon: 'UtensilsCrossed',   color: '#f59e0b', type: CategoryType.EXPENSE },
    { id: 'cat-outros-d',  name: 'Outros (Despesa)',icon: 'MoreHorizontal',    color: '#6b7280', type: CategoryType.EXPENSE },
  ]

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    })
  }

  // Seed Usuário Admin
  const hashedPassword = await bcrypt.hash('admin@administrador', 10)
  await prisma.user.upsert({
    where: { email: 'admin@administrador.com' },
    update: {
      password: hashedPassword,
      role: Role.ADMIN, // Garantir que está como ADMIN no formato Enum
    },
    create: {
      id: 'user-admin',
      name: 'Administrador',
      email: 'admin@administrador.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  console.log('✅ Dados base inseridos com sucesso (Categorias e Admin)! Dados fictícios removidos.')
  console.log('📧 Login: admin@administrador.com')
  console.log('🔑 Senha: admin@administrador')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
