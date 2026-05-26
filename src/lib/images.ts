type SupabaseImageOptions = {
  width: number | undefined;
  quality: number | undefined;
  format: "origin" | "webp" | undefined;
};

function isSupabaseStoragePublicUrl(url: string): boolean {
  return /\/storage\/v1\/object\/public\//.test(url);
}

export function getOptimizedImageUrl(
  url: string,
  options: SupabaseImageOptions = { width: undefined, quality: undefined, format: undefined }
): string {
  if (!url || !isSupabaseStoragePublicUrl(url)) return url;
  const width = options.width ?? 768;
  const quality = options.quality ?? 80;
  const format = options.format ?? "webp";

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    parsed.searchParams.set("quality", String(quality));
    parsed.searchParams.set("format", format);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getOptimizedImageSrcSet(
  url: string,
  widths: number[] = [480, 768, 1024],
  quality = 80
): string | undefined {
  if (!url || !isSupabaseStoragePublicUrl(url)) return undefined;
  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w, quality, format: "webp" })} ${w}w`)
    .join(", ");
}
