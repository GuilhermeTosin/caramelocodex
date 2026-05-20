import { supabase } from "@/lib/supabase";

export type CategorySynonymsMap = Record<string, string[]>;

const STORAGE_KEY = "caramelinho_search_category_synonyms_v1";
const DB_KEY = "category_synonyms";

export const DEFAULT_CATEGORY_SYNONYMS: CategorySynonymsMap = {
  "Alimentação": ["restaurante", "lanchonete", "lanches", "padaria", "comida", "gastronomia", "café", "almoço", "jantar", "marmita"],
  "Automotivo": ["mecânico", "oficina", "carro", "conserto", "pneu", "óleo", "auto", "manutenção", "reparo"],
  "Saúde & Beleza": ["dentista", "médico", "clínica", "estética", "salão", "cabelo", "unha", "manicure", "pedicure", "terapia", "psicólogo"],
  "Construção": ["obra", "reforma", "pintor", "pedreiro", "eletricista", "encanador", "casa", "apartamento", "telhado"],
  "Advocacia & Traduções": ["advogado", "jurídico", "lei", "visto", "imigração", "consultoria", "tradutor", "tradução", "documentos"],
  "Contabilidade": ["contador", "imposto", "finanças", "investimento", "empresa"],
  "Educação": ["escola", "curso", "professor", "aula", "idiomas", "inglês", "francês", "português"],
  "Comércio": ["loja", "venda", "produto", "mercado", "roupa", "acessórios"],
  "Transporte & Mudança": ["mudança", "frete", "entrega", "logística", "caminhão", "envio"],
  "Serviços para Pets": ["pet", "pets", "cachorro", "gato", "banho", "tosa", "veterinário"],
  "Imobiliária": ["casa", "apartamento", "aluguel", "venda", "imóvel", "corretor"],
  "Cuidados Infantis e de Idosos": ["babá", "babysitter", "acompanhante", "cuidadora", "cuidador", "criança", "idosos"],
  "Diaristas": ["diarista", "faxina", "limpeza", "limpar", "casa"],
  "Artistas": ["música", "musical", "show", "banda", "cantor", "evento"],
  "Outros": [],
};

export function getCategorySynonymsConfig(): CategorySynonymsMap {
  if (typeof window === "undefined") return DEFAULT_CATEGORY_SYNONYMS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORY_SYNONYMS;
    const parsed = JSON.parse(raw) as CategorySynonymsMap;
    return { ...DEFAULT_CATEGORY_SYNONYMS, ...parsed };
  } catch {
    return DEFAULT_CATEGORY_SYNONYMS;
  }
}

export function saveCategorySynonymsConfig(config: CategorySynonymsMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function normalizeConfig(input: unknown): CategorySynonymsMap {
  const merged: CategorySynonymsMap = { ...DEFAULT_CATEGORY_SYNONYMS };
  if (!input || typeof input !== "object") return merged;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    merged[key] = value.map((v) => String(v).trim()).filter(Boolean);
  }
  return merged;
}

export async function getGlobalCategorySynonymsConfig(): Promise<CategorySynonymsMap> {
  try {
    const { data, error } = await supabase
      .from("search_settings")
      .select("value")
      .eq("key", DB_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return getCategorySynonymsConfig();
    }
    const normalized = normalizeConfig(data.value);
    saveCategorySynonymsConfig(normalized);
    return normalized;
  } catch {
    return getCategorySynonymsConfig();
  }
}

export async function saveGlobalCategorySynonymsConfig(config: CategorySynonymsMap): Promise<boolean> {
  try {
    const payload = normalizeConfig(config);
    const { error } = await supabase.from("search_settings").upsert(
      {
        key: DB_KEY,
        value: payload,
      },
      { onConflict: "key" }
    );
    if (error) return false;
    saveCategorySynonymsConfig(payload);
    return true;
  } catch {
    return false;
  }
}
