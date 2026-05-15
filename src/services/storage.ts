import { supabase } from "@/lib/supabase";

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
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
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
  type: "logo" | "hero" | "photo" | "menu",
  fileName: string
): string {
  const extension = fileName.split(".").pop();
  const timestamp = Date.now();
  return `${businessId}/${type}_${timestamp}.${extension}`;
}
