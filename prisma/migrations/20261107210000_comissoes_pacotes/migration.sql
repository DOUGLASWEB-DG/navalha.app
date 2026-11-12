-- Migração aditiva para Comissões e Módulo de Pacotes de Cortes
-- 1. Campos de comissão no Usuário (Barbeiro) e congelamento no Agendamento
ALTER TABLE "User" ADD COLUMN "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 50.0;

ALTER TABLE "Appointment" ADD COLUMN "commissionPercent" DOUBLE PRECISION;
ALTER TABLE "Appointment" ADD COLUMN "commissionAmount" DOUBLE PRECISION;
ALTER TABLE "Appointment" ADD COLUMN "commissionPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN "clientPackageId" TEXT;

-- 2. Enum de Status do Pacote
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELED');

-- 3. Tabela de Modelos de Pacote (definidos pela barbearia / barbeiro)
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "barbeariaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "totalCuts" INTEGER NOT NULL DEFAULT 4,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "barberId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- 4. Tabela de Pacotes do Cliente (cartela digital adquirida)
CREATE TABLE "ClientPackage" (
    "id" TEXT NOT NULL,
    "barbeariaId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "barberId" TEXT,
    "totalCuts" INTEGER NOT NULL,
    "usedCuts" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "paidToAdmin" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPackage_pkey" PRIMARY KEY ("id")
);

-- 5. Índices de busca e isolamento multi-tenant
CREATE INDEX "Package_barbeariaId_idx" ON "Package"("barbeariaId");
CREATE INDEX "Package_barberId_idx" ON "Package"("barberId");

CREATE INDEX "ClientPackage_barbeariaId_idx" ON "ClientPackage"("barbeariaId");
CREATE INDEX "ClientPackage_clientId_idx" ON "ClientPackage"("clientId");
CREATE INDEX "ClientPackage_packageId_idx" ON "ClientPackage"("packageId");
CREATE INDEX "ClientPackage_barberId_idx" ON "ClientPackage"("barberId");
CREATE INDEX "ClientPackage_status_idx" ON "ClientPackage"("status");

-- 6. Chaves estrangeiras com segurança referencial
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientPackageId_fkey" FOREIGN KEY ("clientPackageId") REFERENCES "ClientPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Package" ADD CONSTRAINT "Package_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Package" ADD CONSTRAINT "Package_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClientPackage" ADD CONSTRAINT "ClientPackage_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientPackage" ADD CONSTRAINT "ClientPackage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientPackage" ADD CONSTRAINT "ClientPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientPackage" ADD CONSTRAINT "ClientPackage_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
