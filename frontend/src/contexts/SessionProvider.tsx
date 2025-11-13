// contexts/SessionProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";

interface SessionContextType {
  session: Session | null;
  logout: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  session: null,
  logout: async () => {},
});

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  // First-time user logic
  const handleFirstTimeUser = async (session: Session) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("uid")
        .eq("uid", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking user existence:", error);
        return;
      }

      if (!data) {
        const res = await fetch(
          "https://ihoqewwgkpjmkgwoenck.supabase.co/functions/v1/handle_new_user",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: session.user.id,
              email: session.user.email,
            }),
          }
        );

        if (!res.ok) {
          console.error("Edge function error:", await res.text());
        } else {
          console.log("✅ User inserted into public.users");
        }
      }
    } catch (err) {
      console.error("Error in handleFirstTimeUser:", err);
    }
  };

  // Logout handler
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleFirstTimeUser(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) await handleFirstTimeUser(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

// Hook for easier usage
export const useSession = () => useContext(SessionContext);
