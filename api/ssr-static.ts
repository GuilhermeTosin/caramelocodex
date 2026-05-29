import type { VercelRequest, VercelResponse } from "@vercel/node";

type StaticPageKey = "home" | "buscar" | "sobre" | "contato" | "privacidade" | "termos" | "negocio-verificado";

const PRIVATE_OR_UTILITY_SLUGS = new Set([
  "cadastro",
  "entrar",
  "perfil",
  "negocio",
  "api",
  "sitemap.xml",
  "robots.txt",
  "llms.txt",
]);

function htmlEscape(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseUrl(req: VercelRequest) {
  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "www.caramelinho.com");
  return `${proto}://${host}`;
}

function slugToLabel(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPageData(page: StaticPageKey, base: string) {
  const common = {
    image: `${base}/og-image.jpg`,
    type: "website" as const,
  };

  const map: Record<StaticPageKey, { path: string; title: string; description: string; h1: string }> = {
    home: {
      path: "/",
      title: "Caramelinho.com | Negócios brasileiros perto de você",
      description:
        "Encontre negócios, serviços e produtos brasileiros perto de você com busca por localização, categorias e avaliações da comunidade.",
      h1: "Encontre negócios brasileiros no mundo todo",
    },
    buscar: {
      path: "/buscar",
      title: "Buscar negócios brasileiros | Caramelinho.com",
      description:
        "Busque por produto, serviço ou cidade e encontre negócios brasileiros próximos com filtros inteligentes de distância e categoria.",
      h1: "Buscar negócios brasileiros",
    },
    sobre: {
      path: "/sobre",
      title: "Sobre nós | Caramelinho.com",
      description:
        "Conheça a missão da Caramelinho: conectar brasileiros no exterior a serviços, comércios e profissionais de confiança em todo o mundo.",
      h1: "Sobre nós",
    },
    contato: {
      path: "/contato",
      title: "Contato | Caramelinho.com",
      description:
        "Fale com a equipe da Caramelinho. Tire dúvidas, envie sugestões e entre em contato sobre suporte, parcerias e uso da plataforma.",
      h1: "Contato",
    },
    privacidade: {
      path: "/privacidade",
      title: "Política de Privacidade | Caramelinho.com",
      description:
        "Leia a Política de Privacidade da Caramelinho e entenda como coletamos, usamos e protegemos seus dados e informações de localização.",
      h1: "Política de Privacidade",
    },
    termos: {
      path: "/termos",
      title: "Termos e Condições | Caramelinho.com",
      description:
        "Confira os Termos e Condições de uso da Caramelinho, incluindo responsabilidades, regras de publicação, segurança e legislação aplicável.",
      h1: "Termos e Condições",
    },
    "negocio-verificado": {
      path: "/negocio-verificado",
      title: "Negócio Verificado | Caramelinho.com",
      description:
        "Saiba como funciona o selo Negócio Verificado da Caramelinho, critérios de aprovação, benefícios e validade da verificação.",
      h1: "Negócio Verificado",
    },
  };

  const pageData = map[page] || map.home;
  return { ...common, ...pageData, canonical: `${base}${pageData.path}` };
}

function renderHtml(input: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  type: "website" | "article";
  h1: string;
  robots?: string;
}) {
  const title = htmlEscape(input.title);
  const description = htmlEscape(input.description);
  const canonical = htmlEscape(input.canonicalUrl);
  const image = htmlEscape(input.imageUrl);
  const h1 = htmlEscape(input.h1);
  const robots = htmlEscape(input.robots || "index,follow,max-image-preview:large");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${input.type}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  </head>
  <body>
    <main>
      <h1>${h1}</h1>
      <p>${description}</p>
      <p><a href="${canonical}">Abrir página completa</a></p>
    </main>
  </body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPage = String(req.query.page || "").trim();
  const rawSlug = String(req.query.slug || "").trim().toLowerCase();
  const page = (rawPage || "home") as StaticPageKey;
  const allowed: StaticPageKey[] = ["home", "buscar", "sobre", "contato", "privacidade", "termos", "negocio-verificado"];

  const base = baseUrl(req);
  const isPrivateOrUtility = rawSlug ? PRIVATE_OR_UTILITY_SLUGS.has(rawSlug) : false;
  const data = isPrivateOrUtility
    ? {
        title: "Página não indexável | Caramelinho.com",
        description: "Esta página da Caramelinho não deve ser exibida nos resultados de busca.",
        canonical: `${base}/${encodeURIComponent(rawSlug)}`,
        h1: "Página não indexável",
        image: `${base}/og-image.jpg`,
        type: "website" as const,
        robots: "noindex,nofollow,noarchive",
      }
    : allowed.includes(page)
    ? getPageData(page, base)
    : rawSlug
      ? {
          title: `${slugToLabel(rawSlug)} | Caramelinho.com`,
          description:
            "Conheça esta página institucional da Caramelinho e encontre informações sobre a plataforma, recursos e políticas.",
          canonical: `${base}/${encodeURIComponent(rawSlug)}`,
          h1: slugToLabel(rawSlug),
          image: `${base}/og-image.jpg`,
          type: "website" as const,
          robots: "index,follow,max-image-preview:large",
        }
      : getPageData("home", base);
  const html = renderHtml({
    title: data.title,
    description: data.description,
    canonicalUrl: data.canonical,
    imageUrl: data.image,
    type: data.type,
    h1: data.h1,
    robots: "robots" in data ? data.robots : undefined,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("Vercel-CDN-Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
