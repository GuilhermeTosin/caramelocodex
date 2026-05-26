export function setSeoMeta(title: string, description: string) {
  if (typeof document === "undefined") return;
  document.title = title;

  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", description);
}

export function upsertMetaTag(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let meta = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export function setCanonical(url: string) {
  if (typeof document === "undefined") return;
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
}

export function setHreflang(hreflang: string, href: string) {
  if (typeof document === "undefined") return;
  let link = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export function setRobots(content: string) {
  upsertMetaTag("name", "robots", content);
}

export function setJsonLd(id: string, payload: unknown) {
  if (typeof document === "undefined") return;
  const elementId = `jsonld-${id}`;
  let script = document.getElementById(elementId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = elementId;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}
