import { supabase } from "@/lib/supabase";

const GA_SETTING_KEY = "google_analytics_measurement_id";

function normalizeMeasurementId(input: string): string {
  return (input || "").trim().toUpperCase();
}

export async function getGoogleAnalyticsMeasurementId(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("search_settings")
      .select("value")
      .eq("key", GA_SETTING_KEY)
      .maybeSingle();

    if (error) return "";
    const rawValue = data?.value;
    if (typeof rawValue === "string") return normalizeMeasurementId(rawValue);
    if (rawValue && typeof rawValue === "object" && "id" in rawValue) {
      return normalizeMeasurementId(String((rawValue as { id?: string }).id || ""));
    }
    return "";
  } catch {
    return "";
  }
}

export async function saveGoogleAnalyticsMeasurementId(measurementId: string): Promise<boolean> {
  try {
    const normalized = normalizeMeasurementId(measurementId);
    const payload = normalized ? normalized : "";
    const { error } = await supabase.from("search_settings").upsert(
      {
        key: GA_SETTING_KEY,
        value: payload,
      },
      { onConflict: "key" }
    );
    return !error;
  } catch {
    return false;
  }
}

