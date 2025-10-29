import type { SupabaseClient } from "@supabase/supabase-js";

export const createGrant = async (client: SupabaseClient) => {
  const { data, error } = await client
    .from('grants')
    .insert({name: 'greatest grant ever'})
    .select()
  if(error) {
    throw error;
  } else {
    alert("hello world");
    console.log("data", data);
  }
}