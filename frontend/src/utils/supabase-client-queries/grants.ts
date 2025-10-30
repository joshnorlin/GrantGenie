import type { SupabaseClient } from "@supabase/supabase-js";

export const createGrant = async (client: SupabaseClient, grantData: { name: string; grant_number: string }) => {
  const { data, error } = await client
    .from('grants')
    .insert({name: grantData.name, grant_number: grantData.grant_number})
    .select()
  if(error) {
    throw error;
  } else {
    console.log("data", data);
  }
}