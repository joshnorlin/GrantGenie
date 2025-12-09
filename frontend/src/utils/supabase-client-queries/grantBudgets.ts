import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { GrantBudgetItem } from "../../types/types";

export async function upsertGrantBudgetItems(
  client: SupabaseClient,
  session: Session | null,
  grantId: number,
  items: GrantBudgetItem[]
) {
  if (!items || items.length === 0) {
    throw new Error("No budget items provided");
  }

  // First, delete all existing budget items for this grant
  const { error: deleteError } = await client
    .from("grant_budget_items")
    .delete()
    .eq("grant_id", grantId);

  if (deleteError) throw deleteError;

  // Filter out empty/zero amounts
  const nonZeroItems = items.filter(item => item.value !== "" && item.value !== 0);

  if (nonZeroItems.length === 0) {
    return []; // No items to insert
  }

  // Transform items for DB insert
  const formatted = nonZeroItems.map((item) => ({
    grant_id: grantId,
    category_id: item.category_id,
    amount: item.value,
    entered_by: session?.user.id,
  }));

  const { data, error } = await client
    .from("grant_budget_items")
    .insert(formatted)
    .select();

  if (error) throw error;
  return data;
}

export async function selectGrantBudgetItems(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("grant_budget_items")
    .select("amount, category_id, category_lookup(category)")
    .eq("grant_id", grantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Get only the most recent entry per category
  const latestByCategory = new Map();
  (data || []).forEach(item => {
    if (!latestByCategory.has(item.category_id)) {
      latestByCategory.set(item.category_id, item);
    }
  });
  
  return Array.from(latestByCategory.values());
}
