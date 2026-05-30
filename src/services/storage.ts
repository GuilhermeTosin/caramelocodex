import { supabase } from "@/lib/supabase";

const IMAGE_TYPES_TO_CONVERT = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type ImagePreset = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

const DEFAULT_IMAGE_PRESET: ImagePreset = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
};

const IMAGE_PRESETS: Record<string, ImagePreset> = {
  hero: { maxWidth: 1920, maxHeight: 1080, quality: 0.8 },
  logo: { maxWidth: 700, maxHeight: 700, quality: 0.86 },
  photo: { maxWidth: 1400, maxHeight: 1400, quality: 0.78 },
  "event-flyer": { maxWidth: 1400, maxHeight: 1800, quality: 0.8 },
  avatar: { maxWidth: 600, maxHeight: 600, quality: 0.85 },
};

function getImagePresetFromPath(path: string): ImagePreset {
  const fileName = path.split("/").pop() || "";
  const kind = fileName.split("_")[0].toLowerCase();
  return IMAGE_PRESETS[kind] || DEFAULT_IMAGE_PRESET;
}

function fitSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function convertImageToWebp(
  file: File,
  preset: ImagePreset = DEFAULT_IMAGE_PRESET
): Promise<File> {
  if (!IMAGE_TYPES_TO_CONVERT.has(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const target = fitSize(
      bitmap.width,
      bitmap.height,
      preset.maxWidth,
      preset.maxHeight
    );
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, target.width, target.height);

    // If image is still too heavy, reduce quality progressively.
    const encode = (quality: number) =>
      new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", quality);
      });

    let blob = await encode(preset.quality);
    if (!blob) return file;

    const maxTargetBytes = 950 * 1024; // ~0.95MB
    if (blob.size > maxTargetBytes) {
      const lowQ = Math.max(0.62, preset.quality - 0.16);
      const lowBlob = await encode(lowQ);
      if (lowBlob) blob = lowBlob;
    }

    const webpName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], webpName, { type: "image/webp" });
  } catch (error) {
    console.warn("[uploadImage] Falha ao converter para WebP, enviando original:", error);
    return file;
  }
}

/**
 * Faz o upload de uma imagem para o bucket do Supabase.
 * @param bucket Nome do bucket (ex: 'business-images')
 * @param path Caminho interno no bucket (ex: 'logos/meu-negocio.png')
 * @param file O arquivo File vindo do input HTML
 */
export async function uploadImage(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  try {
    const preset = getImagePresetFromPath(path);
    const uploadFile = await convertImageToWebp(file, preset);
    const normalizedPath =
      uploadFile.type === "image/webp"
        ? path.replace(/\.[^./]+$/, ".webp")
        : path;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(normalizedPath, uploadFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: uploadFile.type || undefined,
      });

    if (error) {
      console.error("[uploadImage] Erro no upload:", error.message);
      return null;
    }

    // Retorna a URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[uploadImage] Erro inesperado:", err);
    return null;
  }
}

/**
 * Helper para gerar caminhos únicos de imagem
 */
export function generateImagePath(
  businessId: string,
  type: string,
  fileName: string
): string {
  const extension = fileName.split(".").pop();
  const timestamp = Date.now();
  return `${businessId}/${type}_${timestamp}.${extension}`;
}
