// Lightweight analytics model for SaaS dashboard.
import { supabase } from "../lib/supabase.js";

export async function trackEvent(payload) {
  const { error } = await supabase.from("analytics_events").insert(payload);
  if (error) throw error;
}

export async function getOverviewByBusiness(businessId) {
  const { data, error } = await supabase.rpc("business_overview", { p_business_id: businessId });
  if (error) throw error;
  return data?.[0] || { views: 0, clicks: 0, favorites: 0 };
}

export async function getViewsTimeseries(businessId) {
  const { data, error } = await supabase
    .from("analytics_events")
    .select("created_at")
    .eq("business_id", businessId)
    .eq("event_type", "view")
    .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}
