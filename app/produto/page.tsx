import type { Metadata } from 'next'
import Link from 'next/link'
import { Barlow_Condensed } from 'next/font/google'
import { Menu } from 'lucide-react'
import { DocFigure, type DocShot } from '@/components/produto/doc-figure'
import { DocSection, Sub, P, Code, Callout, Steps, RuleTable, titulo } from '@/components/produto/doc-parts'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'
import { cn } from '@/lib/utils'

// Página inicial da demo (demo.navalhaapp.tech): a documentação do sistema. O middleware só a serve para a barbearia "demo"
// (lib/demo-landing.ts); nas outras ela responde 404. Os prints são da própria demo, com dados fictícios.
// Tudo o que está escrito aqui foi conferido no código (regras de agenda, permissões, mensagens, sessão): ao mudar o sistema, mude aqui.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Documentação — Navalha.app',
  description: 'Como cada parte do Navalha.app funciona: agendamento online, painel, finanças, equipe, regras da agenda e lembretes no WhatsApp.',
}

// Letreiro de barbearia nos títulos; o corpo segue na Inter do app. A variável fica só nesta página.
const display = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display', display: 'swap' })

const shot = (file: string, title: string, caption: string, width = 1600, height = 1000): DocShot => ({
  src: `/assets/produto/${file}`,
  title,
  caption,
  width,
  height,
})

const shots = {
  painel: shot('painel-desktop.webp', 'Painel do dia', 'Receita, agenda de hoje, metas e transações recentes numa tela.'),
  agenda: shot('agenda-desktop.webp', 'Agendamentos', 'Os horários do dia, por barbeiro, com o status de cada um.'),
  clientes: shot('clientes-desktop.webp', 'Clientes', 'Cadastro com telefone, total de atendimentos e último atendimento.'),
  servicos: shot('servicos-desktop.webp', 'Serviços', 'Cada serviço com duração, valor e foto.'),
  equipe: shot('equipe-desktop.webp', 'Equipe', 'Dono e barbeiros, cada um com o seu acesso.', 1600, 600),
  financas: shot('financas-desktop.webp', 'Finanças', 'Caixa, receitas, despesas, lucro e fluxo de caixa.'),
  metas: shot('metas-desktop.webp', 'Metas', 'A meta do mês e o quanto já foi alcançado.', 1600, 600),
  produtos: shot('produtos-desktop.webp', 'Produtos', 'Catálogo com valor e estoque de cada produto.', 1600, 640),
  reserva: shot('agendamento-online-celular.webp', 'Agendamento online', 'O que o cliente vê no celular, no passo de escolher o serviço.', 700, 1515),
  painelCel: shot('painel-celular.webp', 'Painel no celular', 'O dono acompanha a barbearia pelo celular.', 700, 1515),
}

// Menu da documentação: o mesmo no lado esquerdo (computador) e no menu do celular
const nav: { grupo: string; itens: [id: string, rotulo: string][] }[] = [
  { grupo: 'Começando', itens: [['visao-geral', 'Visão geral'], ['primeiros-passos', 'Primeiros passos']] },
  { grupo: 'Para o cliente', itens: [['agendamento-online', 'Agendamento online']] },
  {
    grupo: 'Painel do dono',
    itens: [
      ['painel', 'Painel do dia'],
      ['agendamentos', 'Agendamentos'],
      ['clientes', 'Clientes'],
      ['servicos', 'Serviços'],
      ['equipe', 'Equipe e permissões'],
      ['financas', 'Finanças'],
      ['metas', 'Metas'],
      ['produtos', 'Produtos'],
    ],
  },
  { grupo: 'Automação', itens: [['whatsapp', 'Lembretes no WhatsApp']] },
  {
    grupo: 'Referência',
    itens: [['regras', 'Regras da agenda'], ['status', 'Status do agendamento'], ['seguranca', 'Segurança e dados'], ['planos', 'Planos e recursos'], ['faq', 'Perguntas frequentes']],
  },
]

const botao = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#010a1b]'
const botaoPrimario = cn(botao, 'bg-[#2563eb] text-white hover:bg-[#3b82f6]')
const botaoContorno = cn(botao, 'border border-white/25 text-white hover:border-blue-400 hover:bg-blue-500/10')

function NavLinks({ onde }: { onde: 'lado' | 'celular' }) {
  return (
    <>
      {nav.map((g) => (
        <div key={g.grupo} className={onde === 'lado' ? 'mb-6' : 'mb-4'}>
          <p className="mb-1.5 px-3 text-xs font-semibold text-[#6f82a3]">{g.grupo}</p>
          <ul>
            {g.itens.map(([id, rotulo]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="block min-h-9 rounded-lg px-3 py-1.5 text-sm text-[#9fb0cc] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {rotulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

export default function ProdutoPage() {
  // Contato comercial vem do servidor (demo.env), para não gravar número no código nem usar o da América.
  const contactDigits = (process.env.DEMO_CONTACT_WHATSAPP ?? '').replace(/\D/g, '')
  const whats = (texto: string) => (contactDigits ? `https://wa.me/${contactDigits}?text=${encodeURIComponent(texto)}` : null)
  const accessLink = whats('Olá! Quero um acesso para testar a demonstração do Navalha.app.')
  const contactLink = whats('Olá! Vi a documentação do Navalha.app e quero saber mais.')

  return (
    <main className={cn(display.variable, 'min-h-screen bg-[#010a1b] text-white antialiased')}>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[#2563eb] focus:px-4 focus:py-3 focus:text-white"
      >
        Ir para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#010a1b]/90 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <span className="flex items-center gap-2.5">
            <img src="/assets/produto/navalha-icone.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
            <span className={cn(titulo, 'text-[1.55rem] leading-none')}>
              Navalha<span className="text-blue-400">.app</span>
            </span>
            <span className="ml-1 hidden rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-medium text-[#9fb0cc] sm:inline">Documentação</span>
          </span>
          <Link href="/login" className={cn(botaoPrimario, 'min-h-11 px-5')}>
            Entrar na demo
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="Documentação" className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-10 pr-2">
            <NavLinks onde="lado" />
          </nav>
        </aside>

        <div id="conteudo" className="min-w-0 flex-1 pb-20 pt-8 lg:pt-10">
          <details className="group mb-8 rounded-2xl border border-white/10 lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 [&::-webkit-details-marker]:hidden">
              <Menu className="h-4 w-4" aria-hidden="true" /> Menu da documentação
            </summary>
            <nav aria-label="Documentação (celular)" className="border-t border-white/10 px-1 py-4">
              <NavLinks onde="celular" />
            </nav>
          </details>

          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#9fb0cc]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
            Documentação do sistema
          </p>
          <h1 className={cn(titulo, 'max-w-[20ch] text-5xl leading-[0.98] sm:text-6xl')}>
            Como o Navalha.app funciona, <span className="text-blue-400">tela por tela</span>
          </h1>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-[#9fb0cc] sm:text-lg">
            Cada parte do sistema, as regras que ele aplica e o que esperar. Para o dono, para o barbeiro e para quem vai implantar. Os prints são desta demonstração, com dados fictícios.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className={botaoPrimario}>
              Entrar na demo
            </Link>
            {accessLink && (
              <a href={accessLink} target="_blank" rel="noopener noreferrer" className={botaoContorno}>
                <WhatsAppIcon className="h-4 w-4" /> Pedir meu acesso
              </a>
            )}
          </div>

          <div className="mt-14">
            <DocSection
              id="visao-geral"
              title="Visão geral"
              lead="O Navalha.app reúne agenda online, clientes, equipe, serviços, finanças e metas da barbearia em um só sistema. Funciona no navegador, no computador e no celular, sem instalar nada."
            >
              <Sub>Quem usa e o que cada um acessa</Sub>
              <RuleTable
                head={['Perfil', 'Acesso']}
                rows={[
                  ['Dono (administrador)', 'Todas as telas: painel, agendamentos, clientes, finanças, metas, serviços, produtos, equipe e configurações. Só o dono cria, edita e remove usuários.'],
                  ['Barbeiro', <>Só a tela de <strong className="text-white">Agendamentos</strong>, e apenas com os próprios horários. Ao criar um agendamento, ele entra na própria agenda.</>],
                  ['Cliente', <>Não tem login. Agenda pelo link público da barbearia (<Code>/book</Code>).</>],
                ]}
              />
              <Sub>O caminho de um atendimento</Sub>
              <Steps
                items={[
                  'O cliente agenda pelo link da barbearia, escolhendo serviço, barbeiro, dia e horário.',
                  'A equipe vê o horário na agenda, confirma e atende.',
                  'Ao concluir o atendimento, o valor entra como receita no caixa e conta para as metas.',
                ]}
              />
              <P>
                Cada barbearia tem o seu endereço (por exemplo <Code>suaBarbearia.navalhaapp.tech</Code>) e os seus dados ficam separados dos de qualquer outra. Datas e horários seguem o fuso da própria barbearia.
              </P>
            </DocSection>

            <DocSection id="primeiros-passos" title="Primeiros passos" lead="Em dois minutos você percorre o sistema inteiro.">
              <Steps
                items={[
                  <>Toque em <strong className="text-white">Entrar na demo</strong> e use o e-mail e a senha que você recebeu.</>,
                  'Use o menu lateral (no celular, a barra de baixo) para ir de uma tela a outra.',
                  <>Para ver o lado do cliente, abra <strong className="text-white">Página de Agendamento</strong> no menu e faça um agendamento de teste.</>,
                  'Volte à tela de Agendamentos, confirme e conclua o horário, e veja a receita aparecer nas Finanças.',
                ]}
              />
              <Callout title="Esta é uma demonstração">
                Os dados são fictícios e voltam ao normal todos os dias, então pode mexer à vontade. O envio de WhatsApp fica desligado aqui.
              </Callout>
            </DocSection>

            <DocSection
              id="agendamento-online"
              title="Agendamento online"
              lead="O cliente marca sozinho, pelo link da barbearia, em quatro passos. Sem conta, sem senha e sem precisar chamar no WhatsApp."
            >
              <RuleTable
                head={['Passo', 'O que acontece']}
                rows={[
                  ['1. Serviço', 'Escolhe um ou mais serviços. O preço e a duração são somados.'],
                  ['2. Barbeiro', 'Escolhe o profissional. Se a barbearia tem só um barbeiro, este passo é pulado.'],
                  ['3. Data e horário', 'Escolhe o dia no calendário e o horário entre os disponíveis. Veja as regras em Regras da agenda.'],
                  ['4. Seus dados', 'Informa nome e telefone e, se quiser, uma observação. Ao enviar, aparece a tela de confirmação.'],
                ]}
              />
              <div className="flex flex-wrap gap-5">
                <DocFigure shot={shots.reserva} phone />
              </div>
            </DocSection>

            <DocSection
              id="painel"
              title="Painel do dia"
              lead="A primeira tela do dono. Mostra como o dia e o mês estão, sem abrir relatório."
            >
              <RuleTable
                head={['Bloco', 'O que mostra']}
                rows={[
                  ['Receita de hoje, da semana e do mês', 'O faturamento de cada período. A receita de hoje mostra a variação em relação à semana passada.'],
                  ['Total de clientes', 'Quantos clientes estão cadastrados.'],
                  ['Pendentes, confirmados e concluídos', 'A contagem dos agendamentos do dia por status.'],
                  ['Agenda de hoje', 'Os horários do dia, com cliente, serviço, barbeiro, valor e status.'],
                  ['Metas ativas e transações recentes', 'O andamento das metas e os últimos lançamentos do caixa.'],
                ]}
              />
              <DocFigure shot={shots.painel} />
              <div className="flex flex-wrap gap-5">
                <DocFigure shot={shots.painelCel} phone />
              </div>
            </DocSection>

            <DocSection
              id="agendamentos"
              title="Agendamentos"
              lead="A agenda completa. Aqui a equipe confirma, conclui, cancela e cria horários."
            >
              <P>
                A lista é organizada por dia e pode ser filtrada por status (todos, pendentes, confirmados, concluídos e cancelados). Cada linha traz horário, cliente, serviços, barbeiro, valor e status, com um menu de ações. O botão <strong className="text-white">Novo Agendamento</strong> cria um horário pelo balcão.
              </P>
              <P>
                O barbeiro vê somente os agendamentos dele. O dono vê os de toda a equipe. O que pode mudar de um status para outro está em Status do agendamento.
              </P>
              <DocFigure shot={shots.agenda} />
            </DocSection>

            <DocSection id="clientes" title="Clientes" lead="O cadastro e o histórico de quem frequenta a barbearia. Telas do dono.">
              <P>
                Cada cliente tem nome, telefone, e-mail (opcional) e observações. A lista mostra o total de atendimentos e a data do último, e tem busca por nome ou telefone. Há um atalho para chamar o cliente no WhatsApp. Ao remover um cliente, ele é arquivado e some da lista, mas o histórico dos atendimentos é preservado.
              </P>
              <DocFigure shot={shots.clientes} />
            </DocSection>

            <DocSection id="servicos" title="Serviços" lead="O catálogo que aparece para o cliente no agendamento online.">
              <RuleTable
                head={['Campo', 'Detalhe']}
                rows={[
                  ['Nome e descrição', 'Aparecem na escolha do serviço, no agendamento online.'],
                  ['Duração', 'Em minutos. Define quanto tempo o horário ocupa e se o serviço cabe antes do fechamento.'],
                  ['Valor', 'É o preço cobrado e o que entra no caixa quando o atendimento é concluído.'],
                  ['Foto', 'Aceita JPEG, PNG ou WebP de até 15 MB. O sistema converte para WebP e reduz para no máximo 800 px, para a página carregar rápido.'],
                ]}
              />
              <DocFigure shot={shots.servicos} />
            </DocSection>

            <DocSection id="equipe" title="Equipe e permissões" lead="Cada pessoa entra com a própria conta, e cada uma vê só o que precisa.">
              <P>
                O dono cadastra os barbeiros com nome, e-mail e cargo (administrador ou barbeiro). Só o dono cria, edita e remove usuários. As permissões de cada perfil estão em Visão geral.
              </P>
              <DocFigure shot={shots.equipe} />
            </DocSection>

            <DocSection id="financas" title="Finanças" lead="O caixa da barbearia, sem planilha. Telas do dono.">
              <P>
                A tela tem quatro áreas: <strong className="text-white">Visão Geral</strong> (caixa, receitas e despesas do mês, lucro líquido, margem e fluxo de caixa), <strong className="text-white">Transações</strong> (os lançamentos), <strong className="text-white">Relatórios</strong> e <strong className="text-white">Alertas</strong>. Cada atendimento concluído gera uma receita automaticamente. Despesas e outras receitas são lançadas à mão, por categoria.
              </P>
              <Sub>Alertas</Sub>
              <P>
                O sistema avisa quando um limite é excedido, quando o saldo fica negativo, quando um gasto está alto, quando há diferença relevante entre um mês e outro e quando uma meta é alcançada. Cada alerta tem um nível de gravidade: Info, Atenção ou Crítico.
              </P>
              <DocFigure shot={shots.financas} />
            </DocSection>

            <DocSection id="metas" title="Metas" lead="Defina o objetivo do mês e acompanhe o quanto já foi alcançado.">
              <P>
                Uma meta pode ser de <strong className="text-white">receita</strong>, de <strong className="text-white">novos clientes</strong> ou de <strong className="text-white">agendamentos</strong>. O progresso aparece em porcentagem, com barra, e as metas ativas também são mostradas no Painel do dia.
              </P>
              <DocFigure shot={shots.metas} />
            </DocSection>

            <DocSection id="produtos" title="Produtos" lead="O catálogo dos produtos que a barbearia vende.">
              <P>Cada produto tem nome, descrição, valor e a quantidade em estoque, para você enxergar o que está acabando.</P>
              <DocFigure shot={shots.produtos} />
            </DocSection>

            <DocSection
              id="whatsapp"
              title="Lembretes no WhatsApp"
              lead="O sistema avisa o cliente e a barbearia nos momentos certos, sem ninguém precisar lembrar."
            >
              <RuleTable
                head={['Quando', 'O que é enviado']}
                rows={[
                  ['Cliente faz um agendamento', 'O cliente recebe a mensagem de agendamento recebido. O barbeiro também é avisado, se tiver telefone cadastrado.'],
                  ['Agendamento é confirmado', 'O cliente recebe a confirmação com serviço, dia e horário.'],
                  ['Falta cerca de 1 hora', 'Um robô verifica a cada 5 minutos os agendamentos confirmados que começam daqui a 30 a 70 minutos e avisa o cliente e, se tiver telefone cadastrado, o barbeiro.'],
                  ['Atendimento é concluído', 'O cliente recebe o agradecimento, e o dono recebe o aviso da receita lançada.'],
                ]}
              />
              <Sub>Confiabilidade</Sub>
              <P>
                Cada agendamento recebe um único lembrete: depois do envio, ele é marcado e não se repete. Se o WhatsApp recusar a mensagem, o lembrete é tentado de novo na volta seguinte, enquanto o horário ainda está na janela. Se o WhatsApp estiver fora do ar, o agendamento é salvo do mesmo jeito. Os registros do robô de lembretes guardam só o identificador do agendamento, sem nome nem telefone do cliente.
              </P>
              <Callout tone="aviso" title="Disponibilidade">
                Os avisos por WhatsApp fazem parte do plano Completo (veja Planos e recursos). Nesta demonstração o envio fica desligado.
              </Callout>
            </DocSection>

            <DocSection id="regras" title="Regras da agenda" lead="O que o sistema aceita ao criar ou mudar um horário. Estas regras valem para o agendamento online e para o painel.">
              <RuleTable
                head={['Regra', 'Como funciona']}
                rows={[
                  ['Dias', 'De segunda a sábado. Domingo não aceita agendamentos.'],
                  ['Horários', 'O início fica entre 08:00 e 19:30, de 30 em 30 minutos.'],
                  ['Fechamento', 'O serviço precisa terminar até as 20:00. Um serviço longo que passaria disso não é aceito naquele horário.'],
                  ['Datas', 'Não é possível agendar no passado.'],
                  ['Cancelamento', 'O barbeiro só cancela com pelo menos 2 horas de antecedência. O dono pode corrigir um status a qualquer momento.'],
                  ['Fuso', 'Todos os horários seguem o fuso da barbearia.'],
                ]}
              />
              <P>Os horários de funcionamento acima são o padrão do sistema.</P>
            </DocSection>

            <DocSection id="status" title="Status do agendamento" lead="Todo agendamento está em um destes quatro estados.">
              <div className="mt-5 flex max-w-3xl flex-wrap items-center gap-2 text-sm font-semibold" aria-label="Fluxo de status: pendente, confirmado, concluído; cancelado a partir de pendente ou confirmado">
                <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-200">Pendente</span>
                <span aria-hidden="true" className="text-[#6f82a3]">então</span>
                <span className="rounded-full bg-blue-400/15 px-3 py-1 text-blue-200">Confirmado</span>
                <span aria-hidden="true" className="text-[#6f82a3]">então</span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-200">Concluído</span>
                <span className="ml-2 rounded-full bg-red-400/15 px-3 py-1 text-red-200">Cancelado</span>
              </div>
              <RuleTable
                head={['De', 'Pode ir para']}
                rows={[
                  ['Pendente', 'Confirmado ou Cancelado.'],
                  ['Confirmado', 'Concluído ou Cancelado.'],
                  ['Concluído e Cancelado', 'São finais para o barbeiro. O dono pode corrigir.'],
                ]}
              />
              <Sub>Travas</Sub>
              <P>
                Só se confirma um horário que ainda não passou. Só se conclui um atendimento depois da hora marcada. Concluir lança a receita no caixa.
              </P>
            </DocSection>

            <DocSection id="seguranca" title="Segurança e dados" lead="Como o sistema protege o acesso e separa os dados de cada barbearia.">
              <RuleTable
                head={['Tema', 'Como é tratado']}
                rows={[
                  ['Login', 'Por e-mail e senha. A sessão fica num cookie que o JavaScript do navegador não consegue ler (httpOnly).'],
                  ['Duração da sessão', 'Termina em no máximo 8 horas, e é preciso entrar de novo. Enquanto você usa o sistema, ela é estendida por até 2 horas de inatividade.'],
                  ['Uma sessão, uma barbearia', 'A sessão só vale na barbearia em que você entrou. Uma sessão de outra barbearia é recusada.'],
                  ['Dados separados', 'Todo dado pertence a uma barbearia, e as telas e as rotas conferem isso a cada pedido. Testes automáticos verificam esse isolamento.'],
                  ['Fotos', 'Guardadas em WebP, num volume próprio de cada instalação.'],
                  ['Backup', 'Diário.'],
                ]}
              />
            </DocSection>

            <DocSection id="planos" title="Planos e recursos" lead="O que cada plano inclui. Os valores e as condições de lançamento ficam na página de planos.">
              <RuleTable
                head={['Plano', 'Inclui']}
                rows={[
                  ['Essencial', 'Agenda e agendamento online 24h, clientes e histórico, serviços com preço, duração e foto, até 2 barbeiros com acesso próprio, uso no celular.'],
                  ['Completo', 'Tudo do Essencial, mais lembretes automáticos no WhatsApp, finanças (caixa, receitas, despesas e gráficos), metas e produtos, e até 5 barbeiros.'],
                ]}
              />
              <p className="mt-4">
                <a href="https://navalhaapp.tech/#planos" className="text-sm font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  Ver valores e condições
                </a>
              </p>
            </DocSection>

            <DocSection id="faq" title="Perguntas frequentes">
              <div className="mt-6 max-w-3xl divide-y divide-white/10 border-y border-white/10">
                {[
                  ['Preciso instalar algum programa?', 'Não. O Navalha.app abre no navegador, no computador e no celular.'],
                  ['O cliente precisa criar conta para agendar?', 'Não. Ele informa só o nome e o telefone no último passo.'],
                  ['Posso ter mais de um barbeiro?', 'Sim. Cada barbeiro tem o seu acesso e vê só a própria agenda. O limite de barbeiros depende do plano.'],
                  ['Posso mudar os horários de funcionamento?', 'Hoje o sistema usa o padrão de segunda a sábado, das 08:00 às 20:00, em intervalos de 30 minutos.'],
                  ['E se o WhatsApp sair do ar?', 'O agendamento é salvo normalmente. O lembrete é tentado de novo na volta seguinte do robô, enquanto o horário ainda estiver na janela.'],
                  ['Os dados desta demonstração são reais?', 'Não. São fictícios e voltam ao normal todos os dias.'],
                  ['Como contrato ou peço um acesso de teste?', 'Fale com a DrewaWeb pelo WhatsApp, nos botões desta página.'],
                ].map(([pergunta, resposta]) => (
                  <details key={pergunta} className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 [&::-webkit-details-marker]:hidden">
                      {pergunta}
                      <span className="text-xl leading-none text-blue-300 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="max-w-[68ch] pb-5 leading-relaxed text-[#9fb0cc]">{resposta}</p>
                  </details>
                ))}
              </div>
            </DocSection>
          </div>

          <section className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-[#08142b]/60 px-6 py-12 text-center sm:px-10">
            <div
              className="absolute inset-x-0 top-0 h-1.5 opacity-90"
              style={{ background: 'repeating-linear-gradient(-45deg, #2563eb 0 10px, #fff 10px 20px, #d6283b 20px 30px, #fff 30px 40px)' }}
              aria-hidden="true"
            />
            <h2 className={cn(titulo, 'mx-auto max-w-[16ch] text-4xl leading-none sm:text-5xl')}>Quer o Navalha.app na sua barbearia?</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[#9fb0cc]">
              Teste a demonstração à vontade. Para ter o seu endereço, os seus serviços e a sua equipe, fale com a DrewaWeb.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {contactLink && (
                <a href={contactLink} target="_blank" rel="noopener noreferrer" className={botaoPrimario}>
                  <WhatsAppIcon className="h-4 w-4" /> Falar com a DrewaWeb
                </a>
              )}
              <Link href="/login" className={contactLink ? botaoContorno : botaoPrimario}>
                Entrar na demo
              </Link>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/[0.07] px-4 py-6 text-center text-sm text-[#9fb0cc] sm:px-6">
        Navalha.app, um produto DrewaWeb. Esta é uma demonstração: os dados são fictícios.
      </footer>
    </main>
  )
}
