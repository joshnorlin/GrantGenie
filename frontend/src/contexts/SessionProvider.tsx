// SessionProvider.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

interface SessionContextType {
  session: Session | null;
  supabase: SupabaseClient;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  // Create Supabase client ONCE, inside the component
  const supabase = useMemo(
    () =>
      createClient(
        "https://ihoqewwgkpjmkgwoenck.supabase.co",
        "sb_publishable_D5CnwE2fd6yCsARi6MVNGA_C-FVjvSd" // your anon/public key
      ),
    []
  );

  const [session, setSession] = useState<Session | null>(null);

  // Load session when app starts
  useEffect(() => {
    supabase.auth.getSession().then((res) => {
      setSession(res.data.session ?? null);
    });

    // Listen for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SessionContext.Provider value={{ session, supabase, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

// Access the session (or null)
export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return ctx.session;
};

// Access the Supabase client
export const useSupabase = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSupabase must be used inside <SessionProvider>");
  }
  return ctx.supabase;
};
