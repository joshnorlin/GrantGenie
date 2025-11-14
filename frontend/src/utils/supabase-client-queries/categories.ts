// utils/supabase-client-queries/categories.ts
import { SupabaseClient } from "@supabase/supabase-js";

export async function selectCategoriesByGrant(client: SupabaseClient, grantId: string) {
  const { data, error } = await client
    .from("category")
    .select("category_id, category, current_amount")
    .eq("grant_id", grantId);

  if (error) throw error;

  return data || [];
}
