import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { GrantBudgetItem } from "../../types/types";

export async function insertGrantBudgetItems(
  client: SupabaseClient,
  session: Session | null,
  items: GrantBudgetItem[]
) {
  if (!items || items.length === 0) {
    throw new Error("No budget items provided for bulk creation");
  }

  console.log('session', session)
  console.log('session?.user.id', session?.user.id);

  // Transform items for DB insert
  const formatted = items.map((item) => ({
    grant_id: item.grant_id,
    category_id: item.category_id,
    amount: item.value === "" ? 0 : item.value,
    entered_by: session?.user.id,
  }));

  console.log('formatted budget items array', formatted);

  const { data, error } = await client
    .from("grant_budget_items")
    .insert(formatted)
    .select();

  if (error) {
    throw error;
  }

  console.log("Bulk inserted budget items:", data);
  return data;
}

export async function selectGrantBudgetItems(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("grant_budget_items")
    .select("amount, category_lookup(category)")
    .eq("grant_id", grantId);

  if (error) throw error;
  return data || [];
}
