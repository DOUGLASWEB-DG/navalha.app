export const tenantConfig = {
  // Configurações Globais da Barbearia
  name: "Navalha.App",
  shortName: "Navalha", // Usado em lugares pequenos como a aba do navegador
  description: "O sistema definitivo para barbearias.",
  
  // Contato
  whatsappNumber: "5569992476425", // Apenas números, com DDI e DDD
  phoneDisplay: "(69) 99247-6425", // Apenas para exibição, pode conter caracteres
  instagram: "@navalha.app",
  instagramLink: "https://instagram.com/navalha.app",
  
  // Endereço
  address: "Digital",
  city: "Brasil", // Usado em textos dinâmicos (ex: A melhor de Ariquemes)
  
  // Imagens e Logos
  logoUrl: "/assets/logo.png", // Você pode colocar o caminho de qualquer imagem que colocar na pasta public
  
  // Motivos para escolher a barbearia (Aparece na seção "Sobre")
  reasons: [
    'Barbeiros experientes e atualizados nas tendências',
    'Ambiente climatizado e premium',
    'Agendamento rápido pelo WhatsApp',
    'Satisfação garantida em cada corte',
  ],

  // Horários de Funcionamento (Aparece na seção "Sobre")
  businessHours: [
    { day: 'Segunda – Sexta', time: '09:00 – 19:00' },
    { day: 'Sábado', time: '08:00 – 18:00' },
    { day: 'Domingo', time: 'Fechado' },
  ],
};
