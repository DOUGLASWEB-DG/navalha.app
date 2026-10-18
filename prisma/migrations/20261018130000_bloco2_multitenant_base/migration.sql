-- Bloco 2: base multi-tenant (barbeariaId), timezone da barbearia, exclusão lógica de agendamento,
-- fotos de serviço/barbeiro e estorno auditado de transações.
--
-- Ordem segura para tabelas com dados: coluna nasce opcional -> preenche -> torna obrigatória.
-- O Prisma aplica cada migration dentro de uma transação no PostgreSQL: se qualquer passo falhar,
-- nada é gravado.

-- 1. Tabela de tenants --------------------------------------------------------------------------
CREATE TABLE "Barbearia" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Porto_Velho',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barbearia_pkey" PRIMARY KEY ("id"),
    -- Fuso IANA válido: timezone(text, timestamp) é IMMUTABLE e lança erro para fuso desconhecido
    CONSTRAINT "Barbearia_timezone_check" CHECK (('2000-01-01'::timestamp AT TIME ZONE "timezone") IS NOT NULL),
    -- Subdomínio: minúsculas, números e hífen; 1 a 63 caracteres (limite de um rótulo DNS); sem hífen nas pontas
    CONSTRAINT "Barbearia_subdomain_check" CHECK ("subdomain" ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
    -- Subdomínios reservados para a própria plataforma não podem ser de uma barbearia.
    -- O Bloco 3 também rejeita esses nomes na aplicação; aqui é a última barreira.
    CONSTRAINT "Barbearia_subdomain_reserved_check" CHECK ("subdomain" NOT IN ('www', 'app', 'api', 'admin', 'painel', 'login', 'static', 'mail'))
);

CREATE UNIQUE INDEX "Barbearia_subdomain_key" ON "Barbearia"("subdomain");

-- 2. Barbearia padrão: recebe todos os dados existentes ----------------------------------------
-- O id precisa continuar igual a DEFAULT_BARBEARIA_ID em lib/tenant.ts.
INSERT INTO "Barbearia" ("id", "name", "subdomain", "timezone", "active", "createdAt", "updatedAt")
VALUES ('barbearia-america', 'América Barbearia', 'america', 'America/Porto_Velho', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Colunas novas (barbeariaId nasce opcional para permitir o preenchimento) ------------------
ALTER TABLE "User"         ADD COLUMN "barbeariaId" TEXT, ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "Client"       ADD COLUMN "barbeariaId" TEXT;
ALTER TABLE "Service"      ADD COLUMN "barbeariaId" TEXT, ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Appointment"  ADD COLUMN "barbeariaId" TEXT,
                           ADD COLUMN "deletedAt" TIMESTAMP(3),
                           ADD COLUMN "deletedById" TEXT,
                           ADD COLUMN "deletionReason" TEXT;
ALTER TABLE "Transaction"  ADD COLUMN "barbeariaId" TEXT,
                           ADD COLUMN "reversalOfId" TEXT,
                           ADD COLUMN "createdById" TEXT,
                           ADD COLUMN "reason" TEXT;
ALTER TABLE "Category"     ADD COLUMN "barbeariaId" TEXT;
ALTER TABLE "FinanceAlert" ADD COLUMN "barbeariaId" TEXT;
ALTER TABLE "Goal"         ADD COLUMN "barbeariaId" TEXT;
ALTER TABLE "Product"      ADD COLUMN "barbeariaId" TEXT;

-- 4. Preenchimento: todo dado existente pertence à barbearia padrão ---------------------------
UPDATE "User"         SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "Client"       SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "Service"      SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "Appointment"  SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "Transaction"  SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "Category"     SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "FinanceAlert" SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "Goal"         SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;
UPDATE "Product"      SET "barbeariaId" = 'barbearia-america' WHERE "barbeariaId" IS NULL;

-- 5. Agora obrigatória ------------------------------------------------------------------------
ALTER TABLE "User"         ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "Client"       ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "Service"      ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "Appointment"  ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "Transaction"  ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "Category"     ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "FinanceAlert" ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "Goal"         ALTER COLUMN "barbeariaId" SET NOT NULL;
ALTER TABLE "Product"      ALTER COLUMN "barbeariaId" SET NOT NULL;

-- 6. Telefone do cliente passa a ser único por barbearia (antes: único global) ----------------
DROP INDEX "Client_phone_key";
CREATE UNIQUE INDEX "Client_barbeariaId_phone_key" ON "Client"("barbeariaId", "phone");

-- 7. Índices --------------------------------------------------------------------------------------
CREATE INDEX "User_barbeariaId_idx"            ON "User"("barbeariaId");
CREATE INDEX "Service_barbeariaId_idx"         ON "Service"("barbeariaId");
CREATE INDEX "Appointment_barbeariaId_date_idx" ON "Appointment"("barbeariaId", "date");
CREATE INDEX "Transaction_barbeariaId_date_idx" ON "Transaction"("barbeariaId", "date");
CREATE INDEX "Category_barbeariaId_idx"        ON "Category"("barbeariaId");
CREATE INDEX "FinanceAlert_barbeariaId_idx"    ON "FinanceAlert"("barbeariaId");
CREATE INDEX "Goal_barbeariaId_idx"            ON "Goal"("barbeariaId");
CREATE INDEX "Product_barbeariaId_idx"         ON "Product"("barbeariaId");
CREATE UNIQUE INDEX "Transaction_reversalOfId_key" ON "Transaction"("reversalOfId");

-- 8. Chaves estrangeiras ----------------------------------------------------------------------
-- Barbearia não pode ser apagada enquanto tiver dados (RESTRICT).
ALTER TABLE "User"         ADD CONSTRAINT "User_barbeariaId_fkey"         FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client"       ADD CONSTRAINT "Client_barbeariaId_fkey"       FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Service"      ADD CONSTRAINT "Service_barbeariaId_fkey"      FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment"  ADD CONSTRAINT "Appointment_barbeariaId_fkey"  FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction"  ADD CONSTRAINT "Transaction_barbeariaId_fkey"  FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Category"     ADD CONSTRAINT "Category_barbeariaId_fkey"     FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceAlert" ADD CONSTRAINT "FinanceAlert_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Goal"         ADD CONSTRAINT "Goal_barbeariaId_fkey"         FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product"      ADD CONSTRAINT "Product_barbeariaId_fkey"      FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Auditoria: quem excluiu o agendamento / quem lançou a transação. RESTRICT preserva o rastro:
-- um usuário com registros de auditoria não pode ser apagado fisicamente.
ALTER TABLE "Appointment"  ADD CONSTRAINT "Appointment_deletedById_fkey"  FOREIGN KEY ("deletedById")  REFERENCES "User"("id")        ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction"  ADD CONSTRAINT "Transaction_createdById_fkey"  FOREIGN KEY ("createdById")  REFERENCES "User"("id")        ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction"  ADD CONSTRAINT "Transaction_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Regras de integridade no banco (o Prisma não modela CHECK; ficam só no SQL) ----------------
-- Atenção: CHECK só rejeita resultado FALSE; NULL passa. Por isso coalesce nos textos obrigatórios.
-- Exclusão lógica: os três campos andam juntos e o motivo não pode ser vazio.
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_deletion_audit_check" CHECK (
    ("deletedAt" IS NULL AND "deletedById" IS NULL AND "deletionReason" IS NULL)
    OR ("deletedAt" IS NOT NULL AND "deletedById" IS NOT NULL AND length(btrim(coalesce("deletionReason", ''))) > 0)
);
-- Agendamento concluído não pode ser excluído (o caminho é o estorno da transação).
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_deletion_not_completed_check" CHECK (
    "deletedAt" IS NULL OR "status" <> 'COMPLETED'
);
-- Estorno: exige autor e motivo, e não pode estornar a si mesmo.
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_reversal_audit_check" CHECK (
    "reversalOfId" IS NULL
    OR ("reversalOfId" <> "id" AND "createdById" IS NOT NULL AND length(btrim(coalesce("reason", ''))) > 0)
);

-- 10. Alinhamento de histórico ---------------------------------------------------------------
-- A migration 20260911 criou esta FK sem ON DELETE (NO ACTION); o schema e os bancos criados via
-- db push usam RESTRICT. Recriar converge os dois caminhos para o mesmo estado.
ALTER TABLE "AppointmentService" DROP CONSTRAINT IF EXISTS "AppointmentService_serviceId_fkey";
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
