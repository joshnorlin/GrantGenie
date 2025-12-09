import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchLogsForTransaction(
    client: SupabaseClient,
    transactionId: number
  ) {
    return client
      .from("llm_logs")
      .select("*")
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: false });
  }