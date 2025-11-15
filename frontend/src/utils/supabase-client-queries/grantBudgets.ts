import type { SupabaseClient } from "@supabase/supabase-js";

export interface GrantBudgetItem {
  grant_id: number;
  description: string;
  amount: number;
  category_id: number;
}

export async function insertGrantBudgetItems(
  client: SupabaseClient,
  grantBudgetItemsData: GrantBudgetItem[]
) {
  if (!grantBudgetItemsData || grantBudgetItemsData.length === 0) {
    throw new Error("No budget items provided for bulk creation");
  }

  const { data, error } = await client
    .from("grant_budget_items")
    .insert(grantBudgetItemsData)
    .select();

  if (error) {
    throw error;
  }

  console.log("Bulk inserted budget items:", data);
  return data;
}