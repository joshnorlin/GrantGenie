import { supabase } from './App.tsx'
import { logOut } from './utils/supabase-client-queries/auth.ts'
import ThumbsUp from '../public/thumbs-up.webp'

export function Home() {
  return (
    <div>
      <div>Logged in!</div>
      <div style={{ borderWidth: 1, borderStyle: 'solid', color: 'black', padding: 5 }}>
        <h3>Let's create a grant!</h3>
        <div>
          <span>Enter the name of your grant! =={'>'} (67)</span> <input placeholder='glorious grant'/>
        </div>
        <div>
          <span>What's that grant / award number?!?</span> <input placeholder='674206968'/>
        </div>
      </div>
      <button onClick={() => logOut(supabase)}>Log Out!</button>
      <img style={{ display: 'block', margin: 50}}height={100} width={500}src={ThumbsUp}/>
    </div>
  )
}