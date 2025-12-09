import type { SupabaseClient } from "@supabase/supabase-js";

// this only shows one grant at a time
export async function selectTransactionsByGrant(
  client: SupabaseClient,
  grantId: number
) {
  const { data, error } = await client
    .from("transactions")
    .select(`
      transaction_id,
      amount,
      created_at,
      status,
      category_id,
      additional_details,
      confidence_score,
      human_verified,
      category_lookup:category_id (
        category_id,
        category
      )
    `)
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
  // Get the current user (via auth session)
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No logged-in user found");

  // Decide what to store as the verifier (id or email)
  const verifier = user.id;

  const { error } = await client
    .from("transactions")
    .update({
      status: newStatus,
      verified_by: verifier,
      human_verified: true,
    })
    .eq("transaction_id", transactionId);

  if (error) throw error;
}

export async function fetchUserTransactionsWithLogs( client: SupabaseClient ) {
  const { data, error } = await client
    .from("transactions")
    .select(`
      *,
      llm_logs (*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

