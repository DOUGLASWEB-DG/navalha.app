-- Bloco 3: domínio próprio da barbearia e categorias únicas por barbearia.

-- 1. Domínio próprio (ex.: americabarbearia.tech), alternativa ao subdomínio da plataforma.
ALTER TABLE "Barbearia" ADD COLUMN "customDomain" TEXT;
CREATE UNIQUE INDEX "Barbearia_customDomain_key" ON "Barbearia"("customDomain");

-- Guardado já normalizado (a aplicação compara por igualdade exata): minúsculas, sem porta, sem ponto final,
-- ao menos dois rótulos DNS válidos, até 253 caracteres.
ALTER TABLE "Barbearia" ADD CONSTRAINT "Barbearia_customDomain_format_check" CHECK (
    "customDomain" IS NULL OR (
        length("customDomain") <= 253
        AND "customDomain" ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]([a-z0-9-]{0,61}[a-z0-9])?$'
    )
);
-- Domínio próprio não pode ser o domínio da plataforma nem um subdomínio dela: esses hosts são
-- resolvidos pelo subdomínio e nunca consultam customDomain. Se a plataforma mudar de domínio,
-- esta regra precisa acompanhar.
ALTER TABLE "Barbearia" ADD CONSTRAINT "Barbearia_customDomain_platform_check" CHECK (
    "customDomain" IS NULL OR ("customDomain" <> 'navalha.app' AND "customDomain" NOT LIKE '%.navalha.app')
);

UPDATE "Barbearia" SET "customDomain" = 'americabarbearia.tech' WHERE "id" = 'barbearia-america';

-- 2. Categoria: nome único dentro da barbearia (o seed passa a fazer upsert por esta chave).
-- Se existirem nomes repetidos na mesma barbearia, esta linha falha e a migration inteira é desfeita.
CREATE UNIQUE INDEX "Category_barbeariaId_name_key" ON "Category"("barbeariaId", "name");
