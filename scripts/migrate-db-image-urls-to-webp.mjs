import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const IMG_EXT_RE = /\.(jpg|jpeg|png)(\?.*)?$/i;

function toWebpUrl(value) {
  if (!value || typeof value !== "string") return value;
  return value.replace(IMG_EXT_RE, ".webp$2");
}

function updateBusinessEvents(events) {
  if (!Array.isArray(events)) return events;
  return events.map((evt) => {
    if (!evt || typeof evt !== "object") return evt;
    if (evt.flyerUrl) {
      return { ...evt, flyerUrl: toWebpUrl(evt.flyerUrl) };
    }
    if (evt.flyer_url) {
      return { ...evt, flyer_url: toWebpUrl(evt.flyer_url) };
    }
    return evt;
  });
}

async function migrateBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select("id,logo_url,hero_image,photos,events");

  if (error) throw error;

  let updated = 0;
  for (const row of data || []) {
    const nextLogo = toWebpUrl(row.logo_url);
    const nextHero = toWebpUrl(row.hero_image);
    const nextPhotos = Array.isArray(row.photos) ? row.photos.map((p) => toWebpUrl(p)) : row.photos;
    const nextEvents = updateBusinessEvents(row.events);

    const changed =
      nextLogo !== row.logo_url ||
      nextHero !== row.hero_image ||
      JSON.stringify(nextPhotos) !== JSON.stringify(row.photos) ||
      JSON.stringify(nextEvents) !== JSON.stringify(row.events);

    if (!changed) continue;

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        logo_url: nextLogo,
        hero_image: nextHero,
        photos: nextPhotos,
        events: nextEvents,
      })
      .eq("id", row.id);

    if (updateError) {
      console.warn(`Falha ao atualizar businesses.id=${row.id}: ${updateError.message}`);
      continue;
    }

    updated += 1;
    console.log(`Business atualizado: ${row.id}`);
  }

  return updated;
}

async function migrateCommunityEvents() {
  const { data, error } = await supabase
    .from("community_events")
    .select("id,flyer_url");

  if (error) {
    // Tabela pode não existir em alguns ambientes
    console.warn("Aviso: não foi possível ler community_events. Pulando essa etapa.");
    return 0;
  }

  let updated = 0;
  for (const row of data || []) {
    const nextFlyer = toWebpUrl(row.flyer_url);
    if (nextFlyer === row.flyer_url) continue;

    const { error: updateError } = await supabase
      .from("community_events")
      .update({ flyer_url: nextFlyer })
      .eq("id", row.id);

    if (updateError) {
      console.warn(`Falha ao atualizar community_events.id=${row.id}: ${updateError.message}`);
      continue;
    }

    updated += 1;
    console.log(`Community event atualizado: ${row.id}`);
  }

  return updated;
}

async function main() {
  const businessCount = await migrateBusinesses();
  const communityEventsCount = await migrateCommunityEvents();

  console.log("Migração de URLs no banco finalizada.");
  console.log(`Resumo: businesses_atualizados=${businessCount}, community_events_atualizados=${communityEventsCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

