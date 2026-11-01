import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Archivo, Archivo_Narrow, Josefin_Sans } from 'next/font/google'
import { Download, Ellipsis, EllipsisVertical, Menu, Monitor, Share, SquarePlus } from 'lucide-react'
import { DocFigure, type DocShot } from '@/components/produto/doc-figure'
import { Callout, Capitulo, Code, DocFigura, DocSection, P, RuleTable, Steps, Sub, Sumario, titulo } from '@/components/produto/doc-parts'
import { PrintButton } from '@/components/produto/print-button'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'
import { CAPITULOS, numeroDe } from '@/lib/produto-docs'
import { cn } from '@/lib/utils'
import './produto.css'

// Página inicial da demo (demo.navalhaapp.tech): a documentação do sistema. O middleware só a serve para a barbearia "demo"
// (lib/demo-landing.ts); nas outras ela responde 404. Os prints são da própria demo, com dados fictícios.
// Tudo o que está escrito aqui foi conferido no código (regras de agenda, permissões, mensagens, sessão): ao mudar o sistema, mude aqui.
// A numeração e o sumário vêm de lib/produto-docs.ts: cada <Capitulo> e <DocSection> abaixo usa o id de lá.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Documentação — Navalha.app',
  description: 'Como cada parte do Navalha.app funciona: agendamento online, painel, equipe, regras da agenda, lembretes no WhatsApp e como colocar o atalho no celular.',
  // Atalho da própria documentação (Android, iPhone e computador): ícone e nome do Navalha, e não os de uma barbearia.
  manifest: '/assets/produto/manifest.webmanifest',
  icons: {
    icon: [{ url: '/assets/produto/icone-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/assets/produto/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'Navalha', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = { themeColor: '#010a1b' }

// Fontes (parecidas com as do Instagram; ver o comentário no topo de produto.css). Cada uma vira uma variável usada só aqui.
const strong = Archivo({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-strong', display: 'swap' })
const squeeze = Archivo_Narrow({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-squeeze', display: 'swap' })
const deco = Josefin_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-deco', display: 'swap' })

// Os prints mantêm o nome quando são refeitos, e o navegador guarda a imagem antiga. Mude esta versão sempre que refizer os prints.
const PRINTS_VERSAO = '20261027'

const shot = (file: string, title: string, caption: string, width = 1600, height = 1000): DocShot => ({
  src: `/assets/produto/${file}?v=${PRINTS_VERSAO}`,
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
  equipe: shot('equipe-desktop.webp', 'Equipe', 'Proprietário e barbeiros, cada um com o seu acesso.', 1600, 500),
  financas: shot('financas-desktop.webp', 'Finanças', 'Caixa, receitas, despesas, lucro e fluxo de caixa.'),
  metas: shot('metas-desktop.webp', 'Metas', 'A meta do mês e o quanto já foi alcançado.', 1600, 560),
  produtos: shot('produtos-desktop.webp', 'Produtos', 'Catálogo com valor e estoque de cada produto.', 1600, 540),
  reserva: shot('agendamento-online-celular.webp', 'Agendamento online', 'O que o cliente vê no celular, no passo de escolher o serviço.', 700, 1515),
  painelCel: shot('painel-celular.webp', 'Painel no celular', 'O proprietário acompanha a barbearia pelo celular.', 700, 1515),
}

const botao = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#010a1b]'
const botaoPrimario = cn(botao, 'bg-[#2563eb] text-white hover:bg-[#3b82f6]')
const botaoContorno = cn(botao, 'border border-white/25 text-white hover:border-blue-400 hover:bg-blue-500/10')

// Ícone dentro do texto dos passos (o botão que a pessoa vai procurar na tela do celular)
const icone = 'mx-0.5 inline h-4 w-4 -translate-y-px align-middle text-blue-300'

// Menu da documentação: o mesmo no lado esquerdo (computador) e no menu do celular. Capítulos e seções vêm de lib/produto-docs.ts.
function NavLinks({ onde }: { onde: 'lado' | 'celular' }) {
  return (
    <>
      {CAPITULOS.map((cap) => (
        <div key={cap.id} className={onde === 'lado' ? 'mb-5' : 'mb-4'}>
          <a href={`#${cap.id}`} className="doc-squeeze mb-1 block rounded-lg px-3 py-1.5 text-sm font-bold text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            <span className="mr-2 text-blue-300">{numeroDe(cap.id)}</span>
            {cap.titulo}
          </a>
          <ul>
            {cap.secoes.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className="doc-squeeze block min-h-9 rounded-lg px-3 py-1.5 pl-9 text-sm text-[#9fb0cc] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <span className="mr-2 text-[#6f82a3]">{numeroDe(sec.id)}</span>
                  {sec.titulo}
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
    <main className={cn(strong.variable, squeeze.variable, deco.variable, 'doc min-h-screen bg-[#010a1b] text-white antialiased')}>
      <a
        href="#conteudo"
        className="no-print sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[#2563eb] focus:px-4 focus:py-3 focus:text-white"
      >
        Ir para o conteúdo
      </a>

      <header className="no-print sticky top-0 z-40 border-b border-white/[0.07] bg-[#010a1b]/90 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <span className="flex items-center gap-2.5">
            <img src="/assets/produto/navalha-icone.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
            <span className={cn(titulo, 'text-[1.4rem] leading-none')}>
              Navalha<span className="text-blue-400">.app</span>
            </span>
            <span className="doc-squeeze ml-1 hidden rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-medium text-[#9fb0cc] sm:inline">Documentação</span>
          </span>
          <Link href="/login" className={cn(botaoPrimario, 'min-h-11 px-5')}>
            Entrar na demo
          </Link>
        </div>
      </header>

      {/* Capa: só aparece na impressão (PDF). Elementos da NBR 14724: instituição, título, subtítulo e ano. O local fica em branco de propósito. */}
      <section className="doc-capa" aria-hidden="true">
        <p>DrewaWeb</p>
        <div>
          <h1 className="doc-strong">Manual do sistema Navalha.app</h1>
          <p style={{ marginTop: '1em' }}>Agendamento online e gestão para barbearias</p>
        </div>
        <p>2026</p>
      </section>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 sm:px-6">
        <aside className="no-print hidden w-64 shrink-0 lg:block">
          <nav aria-label="Documentação" className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-10 pr-2">
            <NavLinks onde="lado" />
          </nav>
        </aside>

        <div id="conteudo" className="min-w-0 flex-1 pb-20 pt-8 lg:pt-10">
          <details className="no-print group mb-8 rounded-2xl border border-white/10 lg:hidden">
            <summary className="doc-squeeze flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 [&::-webkit-details-marker]:hidden">
              <Menu className="h-4 w-4" aria-hidden="true" /> Menu da documentação
            </summary>
            <nav aria-label="Documentação (celular)" className="border-t border-white/10 px-1 py-4">
              <NavLinks onde="celular" />
            </nav>
          </details>

          <div className="no-print">
            <p className="doc-squeeze mb-3 flex items-center gap-2 text-sm font-medium text-[#9fb0cc]">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
              Documentação do sistema
            </p>
            <h1 className={cn(titulo, 'max-w-[20ch] text-5xl leading-[0.98] sm:text-6xl')}>Como o Navalha.app funciona, tela por tela</h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[#b4c2da]">
              Cada parte do sistema, as regras que ele aplica e o que esperar. Para o proprietário, para o barbeiro e para quem vai implantar. Os prints são desta demonstração, com dados fictícios.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/login" className={botaoPrimario}>
                Entrar na demo
              </Link>
              {accessLink && (
                <a href={accessLink} target="_blank" rel="noopener noreferrer" className={botaoContorno}>
                  <WhatsAppIcon className="h-4 w-4" /> Pedir meu acesso
                </a>
              )}
              <a href="#instalacao" className={botaoContorno}>
                <Download className="h-4 w-4" aria-hidden="true" /> Colocar no celular
              </a>
              <PrintButton className={botaoContorno}>Salvar em PDF</PrintButton>
            </div>
          </div>

          <Sumario />

          <div className="mt-14">
            {/* 1 Apresentação */}
            <Capitulo id="apresentacao">
              <DocSection
                id="visao-geral"
                lead="O Navalha.app reúne agenda online, clientes, equipe, serviços, finanças e metas da barbearia em um só sistema. Funciona no navegador, no computador e no celular, sem instalar nada."
              >
                <Sub>O caminho de um atendimento</Sub>
                <Steps
                  items={[
                    'O cliente agenda pelo link da barbearia, escolhendo serviço, barbeiro, dia e horário.',
                    'A equipe vê o horário na agenda, confirma e atende.',
                    'Ao concluir o atendimento, o valor entra como receita no caixa e conta para as metas.',
                  ]}
                />
                <P>
                  Cada barbearia tem o seu endereço (por exemplo <Code>suaBarbearia.navalhaapp.tech</Code>) e a sua própria instalação do sistema, com banco de dados e backup separados dos de qualquer outra. Datas e horários seguem o fuso da própria barbearia.
                </P>
              </DocSection>

              <DocSection id="perfis" lead="Cada pessoa entra com a própria conta e vê só o que precisa.">
                <RuleTable
                  titulo="Perfis de acesso e o que cada um pode usar"
                  head={['Perfil', 'Acesso']}
                  rows={[
                    ['Proprietário (administrador)', 'Todas as telas: painel, agendamentos, clientes, finanças, metas, serviços, produtos, equipe e configurações. Só o proprietário cria, edita e remove usuários.'],
                    ['Barbeiro', <>Só a tela de <strong className="text-white">Agendamentos</strong>, e apenas com os próprios horários. Ao criar um agendamento, ele entra na própria agenda.</>],
                    ['Cliente', <>Não tem login. Agenda pelo link público da barbearia (<Code>/book</Code>).</>],
                  ]}
                />
              </DocSection>

              <DocSection id="planos" lead="O que cada plano inclui. Os valores e as condições de lançamento ficam na página de planos.">
                <RuleTable
                  titulo="Recursos incluídos em cada plano"
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
            </Capitulo>

            {/* 2 Atalho no celular e no computador */}
            <Capitulo id="instalacao">
              <DocSection
                id="como-funciona-atalho"
                lead="O Navalha.app é um site: não está em loja de aplicativos e não ocupa espaço no aparelho. Para abrir com um toque, como um aplicativo, você salva o endereço como atalho na tela inicial."
              >
                <P>
                  O atalho abre sempre a versão mais atual do sistema. Em muitos aparelhos ele abre em tela cheia, sem a barra do navegador, e com o seu próprio ícone. Você pode fazer isso com o endereço da sua barbearia ou com esta documentação (experimente agora).
                </P>
                <RuleTable
                  titulo="Onde fica a opção de atalho em cada aparelho"
                  head={['Aparelho e navegador', 'Caminho no menu']}
                  rows={[
                    ['Android, Chrome', <>Menu <EllipsisVertical className={icone} aria-hidden="true" /> (três pontos) e <strong className="text-white">Adicionar à tela inicial</strong>. Em algumas versões aparece <strong className="text-white">Instalar app</strong>.</>],
                    ['iPhone e iPad, Safari', <>Botão <Share className={icone} aria-hidden="true" /> Compartilhar e <strong className="text-white">Adicionar à Tela de Início</strong>.</>],
                    ['Computador, Chrome', <>Ícone de instalação na barra de endereço, ou menu <EllipsisVertical className={icone} aria-hidden="true" />, <strong className="text-white">Salvar e compartilhar</strong> e <strong className="text-white">Instalar página como app</strong>.</>],
                    ['Computador, Edge', <>Menu <Ellipsis className={icone} aria-hidden="true" />, <strong className="text-white">Aplicativos</strong> e <strong className="text-white">Instalar este site como um aplicativo</strong>.</>],
                  ]}
                />
                <Callout title="Os nomes dos menus mudam um pouco">
                  Cada versão do sistema do aparelho e do navegador pode escrever os nomes de um jeito diferente. Se não achar o texto exato, procure por &quot;tela inicial&quot;, &quot;atalho&quot; ou &quot;instalar&quot; no menu do navegador.
                </Callout>
              </DocSection>

              <DocSection id="android" lead="Pelo navegador Chrome, o padrão da maioria dos aparelhos Android.">
                <Steps
                  items={[
                    <>Abra o <strong className="text-white">Chrome</strong> e entre no endereço da sua barbearia (ou desta documentação).</>,
                    <>Toque nos três pontos <EllipsisVertical className={icone} aria-hidden="true" /> no canto superior direito.</>,
                    <>Toque em <strong className="text-white">Adicionar à tela inicial</strong>. Se aparecer a opção <strong className="text-white">Instalar app</strong>, prefira ela.</>,
                    <>Confira o nome (você pode trocar) e toque em <strong className="text-white">Instalar</strong> ou <strong className="text-white">Adicionar</strong>.</>,
                    <>O ícone aparece na tela inicial. Se o sistema perguntar, toque em <strong className="text-white">Adicionar automaticamente</strong> ou arraste o ícone para onde quiser.</>,
                  ]}
                />
                <Callout title="Navegador Samsung Internet">
                  Toque no menu (três linhas), em <strong className="text-white">Adicionar página a</strong> e em <strong className="text-white">Tela inicial</strong>.
                </Callout>
              </DocSection>

              <DocSection id="iphone" lead="No iPhone e no iPad, o caminho é pelo Safari.">
                <Steps
                  items={[
                    <>Abra o <strong className="text-white">Safari</strong> e entre no endereço da sua barbearia (ou desta documentação).</>,
                    <>Toque no botão <Share className={icone} aria-hidden="true" /> <strong className="text-white">Compartilhar</strong>: o quadrado com uma seta para cima, na barra de baixo (iPhone) ou no alto da tela (iPad).</>,
                    <>Role a lista e toque em <SquarePlus className={icone} aria-hidden="true" /> <strong className="text-white">Adicionar à Tela de Início</strong>.</>,
                    <>Confira o nome e toque em <strong className="text-white">Adicionar</strong>, no canto superior direito.</>,
                    'Abra o sistema pelo novo ícone na tela de início.',
                  ]}
                />
                <Callout title="Outros navegadores no iPhone">
                  Nas versões mais recentes do iOS, o Chrome e outros navegadores também têm a opção no menu <strong className="text-white">Compartilhar</strong>. Se ela não aparecer, abra o endereço no Safari.
                </Callout>
              </DocSection>

              <DocSection id="computador" lead="No Windows, no Mac e no Linux, pelo Chrome ou pelo Edge.">
                <Sub>Chrome</Sub>
                <Steps
                  items={[
                    <>Abra o endereço no <strong className="text-white">Chrome</strong>.</>,
                    <>Clique no ícone de instalação <Monitor className={icone} aria-hidden="true" /> no fim da barra de endereço e em <strong className="text-white">Instalar</strong>. Se ele não aparecer, use o menu <EllipsisVertical className={icone} aria-hidden="true" />, <strong className="text-white">Salvar e compartilhar</strong> e <strong className="text-white">Instalar página como app</strong>.</>,
                    'O sistema abre em uma janela própria, e você pode fixá-lo na barra de tarefas.',
                  ]}
                />
                <Sub>Edge</Sub>
                <Steps
                  items={[
                    <>Abra o endereço no <strong className="text-white">Edge</strong>.</>,
                    <>Clique no menu <Ellipsis className={icone} aria-hidden="true" />, em <strong className="text-white">Aplicativos</strong> e em <strong className="text-white">Instalar este site como um aplicativo</strong>.</>,
                    'Confirme em Instalar. O sistema abre em uma janela própria.',
                  ]}
                />
              </DocSection>

              <DocSection id="atalho-problemas" lead="O atalho não precisa de atualização: ele sempre abre a versão atual do sistema.">
                <RuleTable
                  titulo="Problemas comuns com o atalho e o que fazer"
                  head={['Situação', 'O que fazer']}
                  rows={[
                    ['A opção de atalho não aparece', 'Você pode estar dentro do navegador de outro aplicativo (Instagram, WhatsApp). Toque no menu e escolha Abrir no navegador (ou Abrir no Safari / Chrome) e repita os passos.'],
                    ['O sistema pede o login de novo', 'A sessão dura no máximo 8 horas, e depois disso é preciso entrar de novo. Isso vale com ou sem atalho.'],
                    ['Quero tirar o atalho', 'Android: segure o ícone e toque em Desinstalar ou Remover. iPhone: segure o ícone, toque em Remover app e em Excluir da Tela de Início. Computador: no menu da janela do app, escolha Desinstalar.'],
                    ['Quero trocar o nome do atalho', 'No Android e no iPhone, o nome pode ser alterado na hora de adicionar (passo de confirmar o nome).'],
                  ]}
                />
              </DocSection>
            </Capitulo>

            {/* 3 Primeiros passos */}
            <Capitulo id="comecando">
              <DocSection id="primeiros-passos" lead="Em dois minutos você percorre o sistema inteiro.">
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
            </Capitulo>

            {/* 4 Para o cliente */}
            <Capitulo id="cliente">
              <DocSection
                id="agendamento-online"
                lead="O cliente marca sozinho, pelo link da barbearia, em quatro passos. Sem conta, sem senha e sem precisar chamar no WhatsApp."
              >
                <RuleTable
                  titulo="Passos do agendamento online"
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
                id="pagina-profissional"
                lead="Para o barbeiro que atende sozinho, a instalação pode ter uma página inicial própria, no lugar da página de barbearia."
              >
                <P>
                  A página apresenta o profissional com a foto, os serviços, os botões <strong className="text-white">Agendar</strong> e <strong className="text-white">Chamar no WhatsApp</strong>, o Instagram e a cidade. O cliente escolhe o serviço e o horário em um minuto e recebe a confirmação no WhatsApp. No celular, um botão do WhatsApp fica sempre à vista.
                </P>
                <RuleTable
                  titulo="De onde vem cada informação da página do profissional"
                  head={['Informação', 'Onde é definida']}
                  rows={[
                    ['Nome, WhatsApp, Instagram, cidade e apresentação', 'Na instalação, pela DrewaWeb. Para mudar, fale com a DrewaWeb.'],
                    ['Foto do profissional', 'No painel, em Equipe: a foto do proprietário.'],
                    ['Lista de serviços e fotos de trabalho', 'No painel, em Serviços: os serviços ativos aparecem na lista, e até duas fotos de serviços aparecem inteiras, na proporção original.'],
                    ['Preços', 'Não aparecem na página inicial: o cliente vê o valor no agendamento, e não há dois lugares para manter.'],
                  ]}
                />
                <Callout title="Número de WhatsApp correto">
                  Se o número da instalação não estiver configurado ou estiver inválido, a página não mostra nenhum número (e nunca o de outra barbearia). O agendamento continua funcionando.
                </Callout>
              </DocSection>
            </Capitulo>

            {/* 5 Painel do proprietário */}
            <Capitulo id="proprietario">
              <DocSection id="painel" lead="A primeira tela do proprietário. Mostra como o dia e o mês estão, sem abrir relatório.">
                <RuleTable
                  titulo="Blocos do painel do dia"
                  head={['Bloco', 'O que mostra']}
                  rows={[
                    ['Receita de hoje, da semana e do mês', 'O faturamento de cada período, somando os atendimentos concluídos.'],
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

              <DocSection id="agendamentos" lead="A agenda completa. Aqui a equipe confirma, conclui, cancela e cria horários.">
                <P>
                  A lista é organizada por dia e pode ser filtrada por status (todos, pendentes, confirmados, concluídos e cancelados). Cada linha traz horário, cliente, serviços, barbeiro, valor e status, com um menu de ações. O botão <strong className="text-white">Novo Agendamento</strong> cria um horário pelo balcão.
                </P>
                <P>
                  O barbeiro vê somente os agendamentos dele. O proprietário vê os de toda a equipe. O que pode mudar de um status para outro está em Status do agendamento.
                </P>
                <DocFigure shot={shots.agenda} />
              </DocSection>

              <DocSection id="clientes" lead="O cadastro e o histórico de quem frequenta a barbearia. Telas do proprietário.">
                <P>
                  Cada cliente tem nome, telefone, e-mail (opcional) e observações. A lista mostra o total de atendimentos e a data do último, e tem busca por nome ou telefone. Há um atalho para chamar o cliente no WhatsApp. Ao remover um cliente, ele é arquivado e some da lista, mas o histórico dos atendimentos é preservado.
                </P>
                <DocFigure shot={shots.clientes} />
              </DocSection>

              <DocSection id="servicos" lead="O catálogo que aparece para o cliente no agendamento online.">
                <RuleTable
                  titulo="Campos de um serviço"
                  head={['Campo', 'Detalhe']}
                  rows={[
                    ['Nome e descrição', 'Aparecem na escolha do serviço, no agendamento online.'],
                    ['Duração', 'Em minutos. Define quanto tempo o horário ocupa e se o serviço cabe antes do fechamento.'],
                    ['Valor', 'É o preço cobrado e o que entra no caixa quando o atendimento é concluído.'],
                    ['Foto', 'Aceita JPEG, PNG ou WebP de até 15 MB. O sistema converte para WebP e reduz para no máximo 800 px no lado maior, para a página carregar rápido. Envie a foto inteira e em boa qualidade: ela é exibida sem recorte.'],
                  ]}
                />
                <DocFigure shot={shots.servicos} />
              </DocSection>

              <DocSection id="equipe" lead="Cada pessoa entra com a própria conta, e cada uma vê só o que precisa.">
                <P>
                  O proprietário cadastra os barbeiros com nome, e-mail e cargo (administrador ou barbeiro). Só o proprietário cria, edita e remove usuários. As permissões de cada perfil estão em Perfis de acesso.
                </P>
                <DocFigure shot={shots.equipe} />
              </DocSection>

              <DocSection id="financas" lead="O caixa da barbearia, sem planilha. Telas do proprietário.">
                <P>
                  A tela tem quatro áreas: <strong className="text-white">Visão Geral</strong> (caixa, receitas e despesas do mês, lucro líquido, margem e fluxo de caixa), <strong className="text-white">Transações</strong> (os lançamentos), <strong className="text-white">Relatórios</strong> e <strong className="text-white">Alertas</strong>. Cada atendimento concluído gera uma receita automaticamente. Despesas e outras receitas são lançadas à mão, por categoria.
                </P>
                <Sub>Alertas</Sub>
                <P>
                  O sistema avisa quando um limite é excedido, quando o saldo fica negativo, quando um gasto está alto, quando há diferença relevante entre um mês e outro e quando uma meta é alcançada. Cada alerta tem um nível de gravidade: Info, Atenção ou Crítico.
                </P>
                <DocFigure shot={shots.financas} />
              </DocSection>

              <DocSection id="metas" lead="Defina o objetivo do mês e acompanhe o quanto já foi alcançado.">
                <P>
                  Uma meta pode ser de <strong className="text-white">receita</strong>, de <strong className="text-white">novos clientes</strong> ou de <strong className="text-white">agendamentos</strong>. O progresso aparece em porcentagem, com barra, e as metas ativas também são mostradas no Painel do dia.
                </P>
                <DocFigure shot={shots.metas} />
              </DocSection>

              <DocSection id="produtos" lead="O catálogo dos produtos que a barbearia vende.">
                <P>Cada produto tem nome, descrição, valor e a quantidade em estoque, para você enxergar o que está acabando.</P>
                <DocFigure shot={shots.produtos} />
              </DocSection>
            </Capitulo>

            {/* 6 Para o barbeiro */}
            <Capitulo id="barbeiro">
              <DocSection id="rotina-barbeiro" lead="O barbeiro usa uma tela só: a de Agendamentos, com a agenda dele.">
                <Sub>Um dia de trabalho</Sub>
                <Steps
                  items={[
                    <>Entre com o seu e-mail e a sua senha. Se você usa o atalho no celular, toque no ícone (veja o capítulo {numeroDe('instalacao')}).</>,
                    'Na tela de Agendamentos, veja os horários do dia: só aparecem os seus.',
                    'Confirme o horário do cliente. Só é possível confirmar um horário que ainda não passou.',
                    'Atenda o cliente e, depois da hora marcada, conclua o atendimento. Ao concluir, a receita é lançada no caixa.',
                    'Se precisar cancelar, faça isso com pelo menos 2 horas de antecedência.',
                  ]}
                />
                <Sub>Agendamento pelo balcão</Sub>
                <P>
                  Com o botão <strong className="text-white">Novo Agendamento</strong>, o barbeiro cria um horário para o cliente que está no balcão. O horário entra na agenda dele e segue as mesmas regras do agendamento online.
                </P>
                <Callout tone="aviso" title="Quando o status é final">
                  Um agendamento concluído ou cancelado não volta atrás para o barbeiro. Se houver um erro, o proprietário pode corrigir o status.
                </Callout>
              </DocSection>
            </Capitulo>

            {/* 7 Automação */}
            <Capitulo id="automacao">
              <DocSection id="whatsapp" lead="O sistema avisa o cliente e a barbearia nos momentos certos, sem ninguém precisar lembrar.">
                <RuleTable
                  titulo="Mensagens automáticas por WhatsApp e quando saem"
                  head={['Quando', 'O que é enviado']}
                  rows={[
                    ['Cliente faz um agendamento', 'O cliente recebe a mensagem de agendamento recebido. O barbeiro também é avisado, se tiver telefone cadastrado.'],
                    ['Agendamento é confirmado', 'O cliente recebe a confirmação com serviço, dia e horário.'],
                    ['Falta cerca de 1 hora', 'Um robô verifica a cada 5 minutos os agendamentos confirmados que começam daqui a 30 a 70 minutos e avisa o cliente e, se tiver telefone cadastrado, o barbeiro.'],
                    ['Atendimento é concluído', 'O cliente recebe o agradecimento, e o proprietário recebe o aviso da receita lançada.'],
                  ]}
                />
                <Sub>Número de WhatsApp de cada barbearia</Sub>
                <P>
                  Cada barbearia envia pelo próprio número de WhatsApp, configurado na sua instalação. Quando a instalação não tem o número configurado, o sistema não envia mensagem nenhuma, e a agenda continua funcionando normalmente.
                </P>
                <Sub>Confiabilidade</Sub>
                <P>
                  Cada agendamento recebe um único lembrete: depois do envio, ele é marcado e não se repete. Se o WhatsApp recusar a mensagem, o lembrete é tentado de novo na volta seguinte, enquanto o horário ainda está na janela. Se o WhatsApp estiver fora do ar, o agendamento é salvo do mesmo jeito. Os registros do robô de lembretes guardam só o identificador do agendamento, sem nome nem telefone do cliente.
                </P>
                <Callout tone="aviso" title="Disponibilidade">
                  Os avisos por WhatsApp fazem parte do plano Completo (veja Planos e recursos). Nesta demonstração o envio fica desligado.
                </Callout>
              </DocSection>
            </Capitulo>

            {/* 8 Regras e referência */}
            <Capitulo id="referencia">
              <DocSection id="regras" lead="O que o sistema aceita ao criar ou mudar um horário. Estas regras valem para o agendamento online e para o painel.">
                <RuleTable
                  titulo="Regras da agenda"
                  head={['Regra', 'Como funciona']}
                  rows={[
                    ['Dias', 'De segunda a sábado. Domingo não aceita agendamentos.'],
                    ['Horários', 'O início fica entre 08:00 e 19:30, de 30 em 30 minutos.'],
                    ['Fechamento', 'O serviço precisa terminar até as 20:00. Um serviço longo que passaria disso não é aceito naquele horário.'],
                    ['Datas', 'Não é possível agendar no passado.'],
                    ['Cancelamento', 'O barbeiro só cancela com pelo menos 2 horas de antecedência. O proprietário pode corrigir um status a qualquer momento.'],
                    ['Fuso', 'Todos os horários seguem o fuso da barbearia.'],
                  ]}
                />
                <P>Os horários de funcionamento acima são o padrão do sistema.</P>
              </DocSection>

              <DocSection id="status" lead="Todo agendamento está em um destes quatro estados.">
                <DocFigura titulo="Fluxo dos status do agendamento">
                  <div
                    className="flex flex-wrap items-center gap-2 text-sm font-semibold"
                    role="img"
                    aria-label="Fluxo de status: pendente, confirmado, concluído; cancelado a partir de pendente ou confirmado"
                  >
                    <span className="doc-squeeze rounded-full bg-amber-400/15 px-3 py-1 text-amber-200">Pendente</span>
                    <span aria-hidden="true" className="text-[#6f82a3]">então</span>
                    <span className="doc-squeeze rounded-full bg-blue-400/15 px-3 py-1 text-blue-200">Confirmado</span>
                    <span aria-hidden="true" className="text-[#6f82a3]">então</span>
                    <span className="doc-squeeze rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-200">Concluído</span>
                    <span className="doc-squeeze ml-2 rounded-full bg-red-400/15 px-3 py-1 text-red-200">Cancelado</span>
                  </div>
                </DocFigura>
                <RuleTable
                  titulo="Passagens permitidas entre os status"
                  head={['De', 'Pode ir para']}
                  rows={[
                    ['Pendente', 'Confirmado ou Cancelado.'],
                    ['Confirmado', 'Concluído ou Cancelado.'],
                    ['Concluído e Cancelado', 'São finais para o barbeiro. O proprietário pode corrigir.'],
                  ]}
                />
                <Sub>Travas</Sub>
                <P>
                  Só se confirma um horário que ainda não passou. Só se conclui um atendimento depois da hora marcada. Concluir lança a receita no caixa.
                </P>
              </DocSection>

              <DocSection id="seguranca" lead="Como o sistema protege o acesso e separa os dados de cada barbearia.">
                <RuleTable
                  titulo="Medidas de segurança e proteção de dados"
                  head={['Tema', 'Como é tratado']}
                  rows={[
                    ['Login', 'Por e-mail e senha. A sessão fica num cookie que o JavaScript do navegador não consegue ler (httpOnly).'],
                    ['Duração da sessão', 'Termina em no máximo 8 horas, e é preciso entrar de novo. Enquanto você usa o sistema, ela é estendida por até 2 horas de inatividade.'],
                    ['Uma sessão, uma barbearia', 'A sessão só vale na barbearia em que você entrou. Uma sessão de outra barbearia é recusada.'],
                    ['Uma instalação para cada barbearia', 'Cada barbearia tem o próprio aplicativo, o próprio banco de dados e o próprio backup. Os dados de uma não ficam no banco de outra.'],
                    ['Dados separados', 'Todo dado pertence a uma barbearia, e as telas e as rotas conferem isso a cada pedido. Testes automáticos verificam esse isolamento.'],
                    ['Limites nos campos', 'Os formulários têm tamanho máximo (por exemplo, observações até 1000 caracteres e nome até 100). O servidor recusa o que passar disso, com mensagem em português.'],
                    ['Proteção das páginas', 'As páginas não podem ser exibidas dentro de outro site (contra clique disfarçado) e o navegador é orientado a usar sempre HTTPS.'],
                    ['Fotos', 'O tipo do arquivo é conferido pelo conteúdo, e não pelo nome. A foto é regravada em WebP, sem metadados como a localização, e guardada num volume próprio de cada instalação.'],
                    ['Backup', 'Diário.'],
                  ]}
                />
              </DocSection>

              <DocSection id="faq">
                <div className="mt-6 max-w-3xl divide-y divide-white/10 border-y border-white/10">
                  {[
                    ['Preciso instalar algum programa?', 'Não. O Navalha.app abre no navegador, no computador e no celular. Se quiser um ícone na tela, veja o capítulo 2.'],
                    ['Como coloco o Navalha.app como aplicativo no celular?', 'Salve o endereço como atalho: no Android, menu do Chrome e Adicionar à tela inicial; no iPhone, Compartilhar e Adicionar à Tela de Início. Os passos completos estão no capítulo 2.'],
                    ['O cliente precisa criar conta para agendar?', 'Não. Ele informa só o nome e o telefone no último passo.'],
                    ['Posso ter mais de um barbeiro?', 'Sim. Cada barbeiro tem o seu acesso e vê só a própria agenda. O limite de barbeiros depende do plano.'],
                    ['Atendo sozinho. Posso ter uma página só minha?', 'Sim. A instalação pode ter uma página inicial do profissional, com foto, serviços, WhatsApp e Instagram. Veja a seção Página do profissional.'],
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
                      <p className="max-w-[68ch] pb-5 leading-relaxed text-[#b4c2da]">{resposta}</p>
                    </details>
                  ))}
                </div>
              </DocSection>
            </Capitulo>

            {/* 9 Glossário */}
            <Capitulo id="glossario">
              <DocSection id="termos" lead="As palavras que aparecem ao longo deste manual.">
                <RuleTable
                  titulo="Glossário dos termos do sistema"
                  head={['Termo', 'Significado']}
                  rows={[
                    ['Agendamento', 'Um horário marcado para um cliente, com um ou mais serviços.'],
                    ['Atalho', 'O ícone na tela inicial do aparelho que abre o sistema com um toque.'],
                    ['Barbeiro', 'Usuário que vê só a própria agenda.'],
                    ['Instalação', 'A cópia do Navalha.app mantida pela DrewaWeb para uma barbearia, com endereço, banco de dados e backup próprios.'],
                    ['Lembrete', 'A mensagem de WhatsApp enviada cerca de 1 hora antes do horário.'],
                    ['Plano', 'O conjunto de recursos contratado: Essencial ou Completo.'],
                    ['Proprietário', 'Usuário administrador, com acesso a todas as telas.'],
                    ['Sessão', 'O período em que o login continua valendo: no máximo 8 horas.'],
                    ['Status', 'A etapa do agendamento: Pendente, Confirmado, Concluído ou Cancelado.'],
                  ]}
                />
              </DocSection>
            </Capitulo>
          </div>

          <section className="no-print relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-[#08142b]/60 px-6 py-12 text-center sm:px-10">
            <div
              className="absolute inset-x-0 top-0 h-1.5 opacity-90"
              style={{ background: 'repeating-linear-gradient(-45deg, #2563eb 0 10px, #fff 10px 20px, #d6283b 20px 30px, #fff 30px 40px)' }}
              aria-hidden="true"
            />
            <h2 className={cn(titulo, 'mx-auto max-w-[16ch] text-4xl leading-none sm:text-5xl')}>Quer o Navalha.app na sua barbearia?</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[#b4c2da]">
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

      <footer className="doc-squeeze border-t border-white/[0.07] px-4 py-6 text-center text-sm text-[#9fb0cc] sm:px-6">
        Navalha.app, um produto DrewaWeb. Esta é uma demonstração: os dados são fictícios.
      </footer>
    </main>
  )
}
