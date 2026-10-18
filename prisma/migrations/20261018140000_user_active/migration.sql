-- Usuário desativado: não faz login, perde a sessão aberta e deixa de receber agendamentos novos.
-- Substitui a exclusão física na tela Equipe, preservando o histórico de agendamentos do barbeiro.
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
