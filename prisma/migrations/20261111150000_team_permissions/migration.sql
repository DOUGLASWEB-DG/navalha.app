ALTER TABLE "Barbearia" ADD COLUMN "barberPermissions" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN "permissionOverrides" JSONB NOT NULL DEFAULT '{}';
