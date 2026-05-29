import type { VercelRequest, VercelResponse } from "@vercel/node";

type BusinessRow = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  hero_image: string | null;
  logo_url: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  country_code: string | null;
  state_code: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  average_rating: number | null;
  opening_hours: string[] | null;
};

type ReviewRow = {
  user_name: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
};

const BUSINESS_SELECT =
  "id,name,slug,description,category_id,hero_image,logo_url,street,city,state,country,country_code,state_code,postal_code,lat,lng,phone,email,website,instagram,facebook,average_rating,opening_hours";

type EventRow = {
  id: string;
  title: string | null;
  description: string | null;
  date: string | null;
  location: string | null;
  price: string | null;
  flyer_url: string | null;
  business_id: string | null;
};

function env(name: string) {
  return (process.env[name] || "").trim();
}

function getSupabaseUrl() {
  return env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
}

function getServiceRoleKey() {
  return env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY");
}

function htmlEscape(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePart(value: string): string {
  return encodeURIComponent(
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, ""),
  );
}

function baseUrl(req: VercelRequest) {
  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "www.caramelinho.com");
  return `${proto}://${host}`;
}

function businessCanonical(base: string, b: BusinessRow) {
  const slug = normalizePart(String(b.slug || b.name || ""));
  const country = normalizePart(String(b.country_code || ""));
  const state = normalizePart(String(b.state_code || ""));
  const city = normalizePart(String(b.city || ""));
  if (country && state && city && slug) return `${base}/${country}/${state}/${city}/${slug}`;
  if (country && slug) return `${base}/${country}/${slug}`;
  return `${base}/buscar`;
}

function defaultOgImage(base: string) {
  return `${base}/og-image.jpg`;
}

function buildMetaDescription(value: string | null | undefined, fallback: string, maxLength = 158) {
  const normalized = String(value || fallback)
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= maxLength) return normalized;
  const shortened = normalized.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 90 ? lastSpace : maxLength).trim()}...`;
}

const WEEKDAY_SCHEMA_MAP: Record<string, string> = {
  domingo: "Sunday",
  segunda: "Monday",
  "segunda-feira": "Monday",
  terca: "Tuesday",
  "terca-feira": "Tuesday",
  quarta: "Wednesday",
  "quarta-feira": "Wednesday",
  quinta: "Thursday",
  "quinta-feira": "Thursday",
  sexta: "Friday",
  sabado: "Saturday",
  "sabado-feira": "Saturday",
};

function normalizeWeekday(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseOpeningHoursToSchema(hours: string[] | null | undefined) {
  return (hours || [])
    .map((line) => {
      const text = String(line || "").trim();
      if (!text || /fechado/i.test(text)) return null;
      const [dayRaw, timeRaw] = text.split(":");
      if (!dayRaw || !timeRaw) return null;
      const day = WEEKDAY_SCHEMA_MAP[normalizeWeekday(dayRaw)];
      const rangeMatch = timeRaw.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (!day || !rangeMatch) return null;
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${day}`,
        opens: rangeMatch[1].padStart(5, "0"),
        closes: rangeMatch[2].padStart(5, "0"),
      };
    })
    .filter(Boolean);
}

async function fetchJson<T>(url: string, key: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json; charset=utf-8",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}${body ? `: ${body}` : ""}`);
  }

  return response.json() as Promise<T>;
}

async function getBusinessBySlugCountry(slug: string, countryCode: string): Promise<BusinessRow | null> {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) throw new Error("missing_env");
  const endpoint =
    `${url}/rest/v1/businesses?` +
    `select=${BUSINESS_SELECT}` +
    `&slug=eq.${encodeURIComponent(slug)}` +
    `&country_code=eq.${encodeURIComponent(countryCode.toLowerCase())}` +
    `&or=(moderation_status.eq.approved,moderation_status.is.null)` +
    `&limit=1`;
  const rows = await fetchJson<BusinessRow[]>(endpoint, key);
  return rows[0] || null;
}

async function getBusinessByShortSlug(slug: string): Promise<BusinessRow | null> {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) throw new Error("missing_env");
  const endpoint =
    `${url}/rest/v1/businesses?` +
    `select=${BUSINESS_SELECT}` +
    `&slug=eq.${encodeURIComponent(slug)}` +
    `&or=(moderation_status.eq.approved,moderation_status.is.null)` +
    `&limit=1`;
  const rows = await fetchJson<BusinessRow[]>(endpoint, key);
  return rows[0] || null;
}

async function getBusinessReviews(businessId: string): Promise<ReviewRow[]> {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) throw new Error("missing_env");
  const endpoint =
    `${url}/rest/v1/reviews?` +
    `select=user_name,rating,comment,created_at` +
    `&business_id=eq.${encodeURIComponent(businessId)}` +
    `&order=created_at.desc` +
    `&limit=10`;
  return fetchJson<ReviewRow[]>(endpoint, key);
}

async function getEventById(eventId: string): Promise<{ event: EventRow | null; business: BusinessRow | null }> {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) throw new Error("missing_env");
  const eventEndpoint =
    `${url}/rest/v1/events?` +
    `select=id,title,description,date,location,price,flyer_url,business_id` +
    `&id=eq.${encodeURIComponent(eventId)}` +
    `&limit=1`;
  const events = await fetchJson<EventRow[]>(eventEndpoint, key);
  const event = events[0] || null;
  if (!event?.business_id) return { event, business: null };

  const bizEndpoint =
    `${url}/rest/v1/businesses?` +
    `select=${BUSINESS_SELECT}` +
    `&id=eq.${encodeURIComponent(event.business_id)}` +
    `&limit=1`;
  const businesses = await fetchJson<BusinessRow[]>(bizEndpoint, key);
  return { event, business: businesses[0] || null };
}

function renderHtml(input: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  type: "website" | "article";
  jsonLd?: unknown;
}) {
  const title = htmlEscape(input.title);
  const description = htmlEscape(input.description);
  const canonical = htmlEscape(input.canonicalUrl);
  const image = htmlEscape(input.imageUrl);
  const jsonLd = input.jsonLd ? `<script type="application/ld+json">${JSON.stringify(input.jsonLd)}</script>` : "";
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
    ${jsonLd}
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${description}</p>
      <p><a href="${canonical}">Abrir página completa</a></p>
    </main>
  </body>
</html>`;
}

async function renderBusinessResponse(base: string, business: BusinessRow, title: string, res: VercelResponse, cacheHeader: string) {
  const canonicalUrl = businessCanonical(base, business);
  const reviews = await getBusinessReviews(business.id).catch(() => []);
  const description = buildMetaDescription(
    business.description,
    `Conheça ${business.name || "este negócio brasileiro"} em ${business.city || "sua região"} no Caramelinho.`,
  );
  const openingHoursSpecification = parseOpeningHoursToSchema(business.opening_hours);
  const ratingValues = reviews.map((review) => Number(review.rating || 0)).filter((rating) => rating > 0);
  const averageRating =
    Number(business.average_rating || 0) ||
    (ratingValues.length > 0 ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length : 0);
  const reviewJsonLd = reviews
    .filter((review) => review.rating)
    .map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.user_name || "Usuário",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: review.comment || undefined,
      datePublished: review.created_at || undefined,
    }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: business.name || undefined,
      description,
      url: canonicalUrl,
      image: [business.hero_image, business.logo_url].filter(Boolean),
      telephone: business.phone || undefined,
      email: business.email || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: business.street || undefined,
        addressLocality: business.city || undefined,
        addressRegion: business.state_code || business.state || undefined,
        postalCode: business.postal_code || undefined,
        addressCountry: business.country_code?.toUpperCase() || business.country || undefined,
      },
      geo:
        typeof business.lat === "number" &&
        typeof business.lng === "number" &&
        Number.isFinite(business.lat) &&
        Number.isFinite(business.lng)
          ? {
              "@type": "GeoCoordinates",
              latitude: business.lat,
              longitude: business.lng,
            }
          : undefined,
      sameAs: [business.instagram, business.facebook, business.website].filter(Boolean),
      aggregateRating:
        reviews.length > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: Number(averageRating.toFixed(1)),
              reviewCount: reviews.length,
            }
          : undefined,
      review: reviewJsonLd.length > 0 ? reviewJsonLd : undefined,
      openingHoursSpecification: openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
      priceRange: "$$",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Início",
          item: `${base}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Buscar",
          item: `${base}/buscar`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: business.name || "Negócio",
          item: canonicalUrl,
        },
      ],
    },
  ];

  const html = renderHtml({
    title,
    description,
    canonicalUrl,
    imageUrl: business.hero_image || business.logo_url || defaultOgImage(base),
    type: "website",
    jsonLd,
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", cacheHeader);
  res.setHeader("Vercel-CDN-Cache-Control", cacheHeader);
  return res.status(200).send(html);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const base = baseUrl(req);
    const kind = String(req.query.kind || "");

    const cdnCacheHeaderByKind =
      kind === "event"
        ? "s-maxage=300, stale-while-revalidate=3600"
        : "s-maxage=3600, stale-while-revalidate=86400";
    const browserCacheHeader = "public, max-age=0, must-revalidate";

    if (kind === "go") {
      const businessSlug = String(req.query.businessSlug || "");
      const business = await getBusinessByShortSlug(businessSlug);
      if (!business) return res.status(404).send("Not found");
      const title = `${business.name || "Negócio"} | Caramelinho.com`;
      return renderBusinessResponse(base, business, title, res, cdnCacheHeaderByKind);
    }

    if (kind === "event") {
      const eventId = String(req.query.eventId || "");
      const { event, business } = await getEventById(eventId);
      if (!event) return res.status(404).send("Not found");
      const canonicalUrl = `${base}/eventos/${encodeURIComponent(event.id)}`;
      const title = `${event.title || "Evento"} | Caramelinho.com`;
      const description = buildMetaDescription(
        event.description,
        `Evento da comunidade brasileira em ${event.location || "sua região"}.`,
      );
      const html = renderHtml({
        title,
        description,
        canonicalUrl,
        imageUrl: event.flyer_url || business?.hero_image || business?.logo_url || defaultOgImage(base),
        type: "article",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title || undefined,
          description: event.description || undefined,
          startDate: event.date || undefined,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: event.location || undefined,
          },
          organizer: business?.name
            ? {
                "@type": "Organization",
                name: business.name,
              }
            : undefined,
          image: [event.flyer_url, business?.hero_image, business?.logo_url].filter(Boolean),
          url: canonicalUrl,
        },
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", browserCacheHeader);
      res.setHeader("CDN-Cache-Control", cdnCacheHeaderByKind);
      res.setHeader("Vercel-CDN-Cache-Control", cdnCacheHeaderByKind);
      return res.status(200).send(html);
    }

    if (kind === "business") {
      const countryCode = String(req.query.countryCode || "");
      const businessName = String(req.query.businessName || "");
      const business = await getBusinessBySlugCountry(businessName, countryCode);
      if (!business) return res.status(404).send("Not found");
      const title = `${business.name || "Negócio"} | Negócio brasileiro | Caramelinho.com`;
      return renderBusinessResponse(base, business, title, res, cdnCacheHeaderByKind);
    }

    return res.status(400).json({ error: "kind inválido" });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro SSR dinâmico." });
  }
}
