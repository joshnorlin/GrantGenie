import type { SupabaseClient } from "@supabase/supabase-js";

// this only shows one grant at a time
export async function selectTransactionsByGrant(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("transactions")
    .select("amount, created_at")
    .eq("grant_id", grantId)
    .order("created_at", { ascending: false });

  if (error && error.code !== "PGRST116") throw error;
  return data || [];
}

// this function can be useful when we want to see all the transaction for all grants an user is a part of.
export async function selectAllTransactions(client: SupabaseClient) {
  const { data, error } = await client
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateTransactionStatus(
  client: SupabaseClient,
  transactionId: number,
  newStatus: string
) {
  const { error } = await client
    .from("transactions")
    .update({ status: newStatus })
    .eq("transaction_id", transactionId);

  if (error) throw error;
}
