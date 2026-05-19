import { supabase } from "@/lib/supabase";

const IMAGE_TYPES_TO_CONVERT = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

async function convertImageToWebp(file: File, quality = 0.84): Promise<File> {
  if (!IMAGE_TYPES_TO_CONVERT.has(file.type)) return file;
  if (file.type === "image/webp") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });
    if (!blob) return file;

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
    const uploadFile = await convertImageToWebp(file);
    const normalizedPath =
      uploadFile.type === "image/webp"
        ? path.replace(/\.[^.\/]+$/, ".webp")
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
