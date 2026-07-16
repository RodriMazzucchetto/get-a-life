import { createClient } from "@/lib/supabase";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Faz upload de imagem para o bucket público `media` e devolve a URL pública. */
export async function uploadOsGoalImage(userId: string, file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem demasiado grande (máx. 8 MB).");
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const path = `os-goals/${userId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error("Erro ao fazer upload de imagem da meta:", error);
    throw new Error("Não foi possível enviar a imagem.");
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
