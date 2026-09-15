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
       image: '/assets/servico-corte.jpg' // Coloque a imagem em public/assets/servico-corte.jpg
    }, 
    {
       name: 'Barba',
       price: 20, 
       duration: '20 min', 
       desc: 'Alinhamento e modelagem de barba com acabamento impecável',
       image: '/assets/servico-barba.jpg' // Coloque a imagem em public/assets/servico-barba.jpg
    },
    { 
      name: 'Nevou', 
      price: 50, 
      duration: '50 min',
      desc: 'Nosso serviço mais procurado, para eventos especiais e ocasiões únicas',
      image: '/assets/servico-nevou.jpg' // Coloque a imagem em public/assets/servico-corte-barba.jpg
    },
    {
       name: 'Artistico', 
       price: 60, 
       duration: '40 min', 
       desc: 'Cortes artísticos e desenhos na barba ou cabelo, feitos com precisão e criatividade',
       image: '/assets/servico-artistico.jpg' // Coloque a imagem em public/assets/servico-artistico.jpg
    },
    { 
      name: 'Listra', 
      price: 25, 
      duration: '25 min', 
      desc: 'Listra na barba ou cabelo com precisão e estilo',
      image: '/assets/servico-listra.jpg' // Coloque a imagem em public/assets/servico-listra.jpg
    },
  ]
};
