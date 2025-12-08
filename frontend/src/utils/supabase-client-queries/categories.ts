import { SupabaseClient } from "@supabase/supabase-js";

export async function selectCategoriesByGrant(client: SupabaseClient, grantId: string) {
  const { data, error } = await client
    .from("grant_budget_items")
    .select(`
      category_lookup:category_id (
        category_id,
        category
      ),
      current_amount:amount
    `)
    .eq("grant_id", grantId);

  if (error) throw error;

  // Filter to fit previous return values:
  return (data || []).map((item: any) => ({
    category_id: item.category_lookup.category_id,
    category: item.category_lookup.category,
    current_amount: item.current_amount,
  }));
}


export async function selectAllCategories(client: SupabaseClient) {
  const { data, error } = await client
    .from("category_lookup")
    .select("category_id, category, description, created_at");

  if (error) throw error;

  return data || [];
}