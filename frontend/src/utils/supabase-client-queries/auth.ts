import type { SupabaseClient } from "@supabase/supabase-js"

export const logout = async (client: SupabaseClient) => {
  await client.auth.signOut()
}