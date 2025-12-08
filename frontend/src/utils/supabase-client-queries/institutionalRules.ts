import type { SupabaseClient } from "@supabase/supabase-js";

export async function selectInstitutionalRules(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("institutional_rules")
    .select("ruleset")
    .eq("grant_id", grantId)
    .single();

  // PGRST116 = no rows found, which is acceptable
  if (error && error.code !== "PGRST116") throw error;
  return data?.ruleset || null;
}