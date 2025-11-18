import type { SupabaseClient } from "@supabase/supabase-js";

export async function selectGrantTransactions(client: SupabaseClient , grantId: string) {
    const { data, error } = await client
    .from("transactions")
    .select("*")
    .eq("grant_id", grantId)
    .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}
