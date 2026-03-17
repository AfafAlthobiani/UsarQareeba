// Favorites API
import { supabase } from "../lib/supabase.js";

export async function listMyFavorites() {
  const { data, error } = await supabase.from("favorites").select("business_id");
  if (error) throw error;
  return (data || []).map((x) => x.business_id);
}

export async function toggleFavorite(businessId, isFavorite) {
  if (isFavorite) {
    const { error } = await supabase.from("favorites").delete().eq("business_id", businessId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("favorites").insert({ business_id: businessId });
  if (error) throw error;
  return true;
}

export function subscribeFavorites(onEvent) {
  return supabase
    .channel("favorites-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "favorites" }, onEvent)
    .subscribe();
}
