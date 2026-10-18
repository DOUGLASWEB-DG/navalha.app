export const tenantConfig = {
  // Configurações Globais da Barbearia
  name: "Navalha.App",
  shortName: "Navalha", // Usado em lugares pequenos como a aba do navegador
  description: "O sistema definitivo para barbearias.",
  
  // Contato
  whatsappNumber: "5569999630329", // Apenas números, com DDI e DDD
  phoneDisplay: "(69) 99963-0329", // Apenas para exibição, pode conter caracteres
  instagram: "@barbeariaamerica2025",
  instagramLink: "https://instagram.com/barbeariaamerica2025",
  
  // Endereço
  address: "Rua Casemiro de Abreu, 3140 - Colonial, Ariquemes - RO, 768873-762",
  city: "Ariquemes", // Usado em textos dinâmicos (ex: A melhor de Ariquemes)
  googleMapsLink: "https://maps.google.com",
  googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31442.92273996682!2d-63.04603292770427!3d-9.903498658495092!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93cc91938711a90b%3A0xaf3d3a153fdfd464!2sAm%C3%A9rica%20Barbearia!5e0!3m2!1spt-BR!2sbr!4v1788697853299!5m2!1spt-BR!2sbr",

  
  // Imagens e Logos
  logoUrl: "/assets/logo.png", // Você pode colocar o caminho de qualquer imagem que colocar na pasta public
  logoWordmarkUrl: "/assets/logo-wordmark.png", // Logo com o nome, recortada e com fundo transparente (cabeçalhos)
  logoIconUrl: "/assets/logo-icon.png", // Apenas o símbolo, quadrado (favicon e menu recolhido)
  logoAppleIconUrl: "/assets/logo-apple.png", // Símbolo com fundo branco (iOS preenche transparência com preto)
  
  // Motivos para usar o app (Aparece na seção "Sobre o Sistema")
  reasons: [
    'Agendamento online 24h sem espera',
    'Lembretes automáticos e histórico de serviços',
    'Segurança total com seus dados pessoais',
    'Acesso rápido a todos os nossos barbeiros',
  ],

  // Horários de Funcionamento (Aparece na seção "Sobre")
  businessHours: [
    { day: 'Segunda – Sábado', time: '08:00 – 20:00' },
    
    { day: 'Domingo', time: 'Fechado' },
  ],
  // Serviços (Aparece na seção "O Que Oferecemos")
  services: [
    {
       name: 'Corte',
       price: 35,
       duration: '30 min',
       desc: 'Corte na tesoura ou máquina sob medida para seu estilo',
       image: '/assets/corte.jpeg'
    }, 
    {
       name: 'Barba',
       price: 20, 
       duration: '20 min', 
       desc: 'Alinhamento e modelagem de barba com acabamento impecável',
       image: '/assets/barba.jpeg'
    },
    {
       name: 'Combo (Corte + Barba)', 
       price: 50, 
       duration: '50 min', 
       desc: 'Pacote completo de corte e barba com alinhamento perfeito',
       image: '/assets/combo.png'
    },
    { 
      name: 'Pigmentação', 
      price: 45, 
      duration: '40 min', 
      desc: 'Realce do corte ou barba com pigmentação e disfarce',
      image: '/assets/pigmentacao_fed.jpeg'
    },
    { 
      name: 'Luzes / Platinado', 
      price: 80, 
      duration: '90 min', 
      desc: 'Visual moderno com luzes, reflexos ou platinado nevou',
      image: '/assets/luzes.jpeg'
    },
    { 
      name: 'Selagem', 
      price: 60, 
      duration: '60 min', 
      desc: 'Alinhamento capilar, hidratação e redução de frizz',
      image: '/assets/selagem.jpeg'
    },
  ]
};
