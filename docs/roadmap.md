# Roadmap e status

Atualizado em 2026-10-19. O trabalho segue em blocos; um bloco só avança depois de typecheck, testes, build e teste
funcional, com commit por fase em branch própria.

## 1. Status por bloco

| Bloco | Escopo | Status |
|---|---|---|
| 0 | Base: ambiente e banco local | Concluído |
| 1 | Segurança básica (chaves, permissões, segredo JWT obrigatório) | Concluído |
| 1.5 | Limites de tentativa, reserva pública, redirecionamento seguro | Concluído |
| 2 | Schema por migrations, tabela `Barbearia`, `barbeariaId`, `User.active` | Concluído |
| 3 | Multi-tenant pelo Host, sessão por barbearia, fuso da barbearia, testes de isolamento | Concluído |
| 4 | Fotos de serviço e de barbeiro, imagem Docker, guia de deploy | Concluído (limite de foto 15 MB desde 2026-10-20) |
| VPS | Servidor protegido, Docker, Caddy, app com banco de teste | Em andamento (fase 4 de 7) |
| 5 | Exclusão por engano com motivo e trilha (soft delete) | Planejado |
| 6 | Eventos com `barbeariaId`, n8n, WhatsApp e endereço por barbearia | Planejado |
| 7 | Evolution ponta a ponta, teste de concorrência | Planejado |

### Implantação na VPS

| Fase | Conteúdo | Status |
|---|---|---|
| 1 | Reconhecimento (só leitura) | Concluída |
| 2 | Proteção: SSH por chave, firewall, fail2ban, swap | Concluída |
| 3 | Docker, Caddy, página estática, limite de corpo comprovado | Concluída |
| 4 | App + PostgreSQL de teste, suítes contra o servidor real | Em andamento |
| 5 | Backup do banco e das fotos, restauração testada | Pendente |
| 6 | Dados da América vindos do Supabase (backup validado, comparação só leitura) | Pendente |
| 7 | DNS: `americabarbearia.tech` e `america.navalhaapp.tech` para a VPS (raiz redireciona para a América) | Pendente |

## 2. Antes de uma segunda barbearia real

1. Configuração por barbearia (nome, logo, WhatsApp, horários, endereço): hoje vem de `config/tenant.ts`, único.
2. Script seguro para provisionar barbearia no banco de produção (seed e fixture recusam banco remoto).
3. WhatsApp e lembretes por barbearia (instância fixa `barberos_main`, cron fora do Docker).

## 3. Dívidas conhecidas

| Dívida | Impacto | Onde tratar |
|---|---|---|
| Teste de concorrência quebrado | Horário duplo não é provado automaticamente | Bloco 7 |
| Build ignora erros de tipo e lint | Erro pode chegar à produção se o gate não rodar | CI |
| Sem CI | Testes dependem de execução manual | Próximo após VPS |
| Sem monitoramento, alerta e health check | Queda não é percebida | Após VPS |
| "+12%" fixo no painel (`app/dashboard/page.tsx`) | Dado falso na tela | Bloco 5 |
| Rate limit e cache em memória | Não escala para mais de um processo | Quando houver escala |
| Limpeza de fotos órfãs | Arquivos sem uso ocupam disco | Rotina futura |
| Next devolve 500 (não 413) em alguns envios grandes | Mensagem ruim; arquivo é recusado | Avaliar após o limite de 15 MB |
| Skeletons com `Math.random` (finanças) | Aviso de hidratação no desenvolvimento | Ajuste de UI |
| Merge de `fix/dados-exibicao` | Correções de exibição fora da branch principal | Pendente |
| `book/page.tsx` com ~950 linhas | Manutenção difícil | Refatoração dirigida |
