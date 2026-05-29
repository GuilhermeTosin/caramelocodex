import type { VercelRequest, VercelResponse } from "@vercel/node";

type StaticPageKey = "home" | "buscar" | "sobre" | "contato" | "privacidade" | "termos" | "negocio-verificado";

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

function getPageData(page: StaticPageKey, base: string) {
  const common = {
    image: `${base}/og-image.jpg`,
    type: "website" as const,
  };

  const map: Record<StaticPageKey, { title: string; description: string; canonical: string; h1: string }> = {
    home: {
      title: "Caramelinho.com | Negócios brasileiros perto de você",
      description:
        "Encontre negócios, serviços e produtos brasileiros perto de você com busca por localização, categorias e avaliações da comunidade.",
      canonical: `${base}/`,
      h1: "Caramelinho.com",
    },
    buscar: {
      title: "Buscar negócios brasileiros | Caramelinho.com",
      description:
        "Busque por produto, serviço ou cidade e encontre negócios brasileiros próximos com filtros inteligentes de distância e categoria.",
      canonical: `${base}/buscar`,
      h1: "Buscar negócios brasileiros",
    },
    sobre: {
      title: "Sobre nós | Caramelinho.com",
      description:
        "Conheça a missão da Caramelinho: conectar brasileiros no exterior a serviços, comércios e profissionais de confiança em todo o mundo.",
      canonical: `${base}/sobre`,
      h1: "Sobre nós",
    },
    contato: {
      title: "Contato | Caramelinho.com",
      description:
        "Fale com a equipe da Caramelinho. Tire dúvidas, envie sugestões e entre em contato sobre suporte, parcerias e uso da plataforma.",
      canonical: `${base}/contato`,
      h1: "Contato",
    },
    privacidade: {
      title: "Política de Privacidade | Caramelinho.com",
      description:
        "Leia a Política de Privacidade da Caramelinho e entenda como coletamos, usamos e protegemos seus dados e informações de localização.",
      canonical: `${base}/privacidade`,
      h1: "Política de Privacidade",
    },
    termos: {
      title: "Termos e Condições | Caramelinho.com",
      description:
        "Confira os Termos e Condições de uso da Caramelinho, incluindo responsabilidades, regras de publicação, segurança e legislação aplicável.",
      canonical: `${base}/termos`,
      h1: "Termos e Condições",
    },
    "negocio-verificado": {
      title: "Negócio Verificado | Caramelinho.com",
      description:
        "Saiba como funciona o selo Negócio Verificado da Caramelinho, critérios de aprovação, benefícios e validade da verificação.",
      canonical: `${base}/negocio-verificado`,
      h1: "Negócio Verificado",
    },
  };

  return { ...common, ...map[page] };
}

function renderHtml(input: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  type: "website" | "article";
  h1: string;
}) {
  const title = htmlEscape(input.title);
  const description = htmlEscape(input.description);
  const canonical = htmlEscape(input.canonicalUrl);
  const image = htmlEscape(input.imageUrl);
  const h1 = htmlEscape(input.h1);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
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
  const page = (rawPage || "home") as StaticPageKey;
  const allowed: StaticPageKey[] = ["home", "buscar", "sobre", "contato", "privacidade", "termos", "negocio-verificado"];
  if (!allowed.includes(page)) {
    return res.status(400).json({ error: "page inválida" });
  }

  const base = baseUrl(req);
  const data = getPageData(page, base);
  const html = renderHtml({
    title: data.title,
    description: data.description,
    canonicalUrl: data.canonical,
    imageUrl: data.image,
    type: data.type,
    h1: data.h1,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("Vercel-CDN-Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(html);
}

