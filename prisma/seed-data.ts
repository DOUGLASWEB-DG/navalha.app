import { CategoryType, type PrismaClient } from '@prisma/client'

// Categorias financeiras padrão de toda barbearia. Sem id fixo: o nome é único dentro da barbearia
// (@@unique([barbeariaId, name])), então cada barbearia tem as suas e não há colisão entre elas.
export const DEFAULT_CATEGORIES = [
  // Receitas
  { name: 'Serviço',          icon: 'Scissors',        color: '#00c896', type: CategoryType.INCOME },
  { name: 'Produto',          icon: 'Package',         color: '#3b82f6', type: CategoryType.INCOME },
  { name: 'Gorjeta',          icon: 'Heart',           color: '#f59e0b', type: CategoryType.INCOME },
  { name: 'Outros (Receita)', icon: 'MoreHorizontal',  color: '#8b5cf6', type: CategoryType.INCOME },
  // Despesas
  { name: 'Materiais',        icon: 'Package',         color: '#ef4444', type: CategoryType.EXPENSE },
  { name: 'Aluguel',          icon: 'Home',            color: '#06b6d4', type: CategoryType.EXPENSE },
  { name: 'Equipamentos',     icon: 'Wrench',          color: '#f59e0b', type: CategoryType.EXPENSE },
  { name: 'Marketing',        icon: 'Megaphone',       color: '#8b5cf6', type: CategoryType.EXPENSE },
  { name: 'Salários',         icon: 'Users',           color: '#3b82f6', type: CategoryType.EXPENSE },
  { name: 'Utilidades',       icon: 'Zap',             color: '#10b981', type: CategoryType.EXPENSE },
  { name: 'Impostos',         icon: 'FileText',        color: '#ef4444', type: CategoryType.EXPENSE },
  { name: 'Manutenção',       icon: 'Settings',        color: '#06b6d4', type: CategoryType.EXPENSE },
  { name: 'Transporte',       icon: 'Car',             color: '#3b82f6', type: CategoryType.EXPENSE },
  { name: 'Alimentação',      icon: 'UtensilsCrossed', color: '#f59e0b', type: CategoryType.EXPENSE },
  { name: 'Outros (Despesa)', icon: 'MoreHorizontal',  color: '#6b7280', type: CategoryType.EXPENSE },
]

// Cria as categorias padrão que faltarem na barbearia. Categoria existente nunca é alterada: os ids antigos
// da América (cat-servico, cat-produto...) continuam valendo, porque o upsert procura pelo nome.
export async function seedDefaultCategories(prisma: PrismaClient, barbeariaId: string) {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { barbeariaId_name: { barbeariaId, name: category.name } },
      update: {},
      create: { ...category, barbeariaId },
    })
  }
}
