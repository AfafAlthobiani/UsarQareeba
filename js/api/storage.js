// Storage API
import { supabase } from "../lib/supabase.js";
import { toSlug } from "../lib/utils.js";

const BUCKET = "business-media";

export async function uploadBusinessImage(file, ownerId, kind) {
  const name = `${ownerId}/${kind}-${Date.now()}-${toSlug(file.name || "file")}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
  return data.publicUrl;
}
