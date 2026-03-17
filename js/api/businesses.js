// Businesses API
import { supabase } from "../lib/supabase.js";
import { APP_CONFIG } from "../config.js";

export async function listBusinesses({ search = "", category = "الكل", page = 0 } = {}) {
  const from = page * APP_CONFIG.paginationSize;
  const to = from + APP_CONFIG.paginationSize - 1;

  let query = supabase
    .from("businesses")
    .select("id,owner_id,name,category,description,lat,lng,phone,instagram,rating,logo_url,cover_url,created_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category && category !== "الكل") query = query.eq("category", category);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBusinessByOwner(ownerId) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertBusiness(payload) {
  const { data, error } = await supabase
    .from("businesses")
    .upsert(payload, { onConflict: "owner_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export function subscribeBusinesses(onEvent) {
  return supabase
    .channel("businesses-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, onEvent)
    .subscribe();
}
