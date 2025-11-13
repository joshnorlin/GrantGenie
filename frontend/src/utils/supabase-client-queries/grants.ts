import type { SupabaseClient } from "@supabase/supabase-js";

export async function createGrant(client: SupabaseClient, grantData: { name: string; grant_number: string; session: any }) {
  const { data, error } = await client
    .from('grants')
    .insert({
      name: grantData.name, 
      grant_number: grantData.grant_number,
      created_by: grantData.session
    })
    .select()
  if(error) {
    throw error;
  } else {
    console.log("inserted data", data);
  }
}

export async function selectGrants(client: SupabaseClient) {
  const { data, error } = await client
    .from("grants")
    .select("grant_id, name, grant_number, created_at, created_by")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}