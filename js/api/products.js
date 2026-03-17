// Products API
import { supabase } from "../lib/supabase.js";

export async function listProductsByBusiness(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("id,business_id,name,price,image,created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProduct(payload) {
  const { data, error } = await supabase.from("products").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase.from("products").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeProducts(onEvent) {
  return supabase
    .channel("products-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, onEvent)
    .subscribe();
}
