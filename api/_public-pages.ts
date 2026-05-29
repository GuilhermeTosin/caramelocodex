export type PublicPage = {
  slug: "home" | "buscar" | "sobre" | "contato" | "privacidade" | "termos" | "negocio-verificado";
  path: string;
  title: string;
  description: string;
  h1: string;
};

export const PUBLIC_PAGES: PublicPage[] = [
  {
    slug: "home",
    path: "/",
    title: "Caramelinho.com | Negócios brasileiros perto de você",
    description:
      "Encontre negócios, serviços e produtos brasileiros perto de você com busca por localização, categorias e avaliações da comunidade.",
    h1: "Encontre negócios brasileiros no mundo todo",
  },
  {
    slug: "buscar",
    path: "/buscar",
    title: "Buscar negócios brasileiros | Caramelinho.com",
    description:
      "Busque por produto, serviço ou cidade e encontre negócios brasileiros próximos com filtros inteligentes de distância e categoria.",
    h1: "Buscar negócios brasileiros",
  },
  {
    slug: "sobre",
    path: "/sobre",
    title: "Sobre nós | Caramelinho.com",
    description:
      "Conheça a missão da Caramelinho: conectar brasileiros no exterior a serviços, comércios e profissionais de confiança em todo o mundo.",
    h1: "Sobre nós",
  },
  {
    slug: "contato",
    path: "/contato",
    title: "Contato | Caramelinho.com",
    description:
      "Fale com a equipe da Caramelinho. Tire dúvidas, envie sugestões e entre em contato sobre suporte, parcerias e uso da plataforma.",
    h1: "Contato",
  },
  {
    slug: "privacidade",
    path: "/privacidade",
    title: "Política de Privacidade | Caramelinho.com",
    description:
      "Leia a Política de Privacidade da Caramelinho e entenda como coletamos, usamos e protegemos seus dados e informações de localização.",
    h1: "Política de Privacidade",
  },
  {
    slug: "termos",
    path: "/termos",
    title: "Termos e Condições | Caramelinho.com",
    description:
      "Confira os Termos e Condições de uso da Caramelinho, incluindo responsabilidades, regras de publicação, segurança e legislação aplicável.",
    h1: "Termos e Condições",
  },
  {
    slug: "negocio-verificado",
    path: "/negocio-verificado",
    title: "Negócio Verificado | Caramelinho.com",
    description:
      "Saiba como funciona o selo Negócio Verificado da Caramelinho, critérios de aprovação, benefícios e validade da verificação.",
    h1: "Negócio Verificado",
  },
];

export function getPublicPageBySlug(slug: string) {
  return PUBLIC_PAGES.find((page) => page.slug === slug);
}

