import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertGrant(client: SupabaseClient, grantData: { name: string; grant_number: string; session: any }) {

  console.log("client.getSession()", await client.auth.getSession());

  const { data, error } = await client
    .from('grants')
    .insert({
      name: grantData.name, 
      grant_number: grantData.grant_number,
      // created_by is automatically set by the DEFAULT auth.uid() in the schema
      // Do NOT pass created_by from client—let the database handle it
    })
    .select()
  
  if(error) {
    throw error;
  } else {
    console.log("inserted data", data);
    return data;
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