import type { SupabaseClient } from "@supabase/supabase-js"

export const logOut = async (client: SupabaseClient) => {
  await client.auth.signOut()
}