import { useState, useEffect } from 'react'
import { createClient, type Session } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Home } from './Home'

export const supabase = createClient(
  'https://ihoqewwgkpjmkgwoenck.supabase.co',
  'sb_publishable_D5CnwE2fd6yCsARi6MVNGA_C-FVjvSd'
)

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) handleFirstTimeUser(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) {
          await handleFirstTimeUser(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Handle first-time user insert
  async function handleFirstTimeUser(session: Session) {
    try {
      // Check if user already exists in public.users
      const { data, error } = await supabase
        .from('users')
        .select('uid')
        .eq('uid', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for first-time user
        console.error('Error checking user existence:', error)
        return
      }

      if (!data) {
        // Call Edge Function to insert user
        const res = await fetch('https://ihoqewwgkpjmkgwoenck.supabase.co/functions/v1/handle_new_user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
          })
        })

        if (!res.ok) {
          const errText = await res.text()
          console.error('Edge function error:', errText)
        } else {
          console.log('✅ User inserted into public.users')
        }
      }
    } catch (err) {
      console.error('Error in handleFirstTimeUser:', err)
    }
  }

  if (!session) {
    return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
  } else {
    return <Home />
  }
}
