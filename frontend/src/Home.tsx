import { supabase } from './App.tsx'
import { logOut } from './utils/supabase-client-queries/auth.ts'
import { createGrant } from './utils/supabase-client-queries/grants.ts'


export function Home() {
  return (
    <div>
      <div>Logged in!</div>
      <button onClick={() => createGrant(supabase)}>Hello</button>
      <button onClick={() => logOut(supabase)}>Log Out!</button>
    </div>
  )
}