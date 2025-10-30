import { useState, useEffect, type JSX } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { createClient, type Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Tabs, Tab, Box, AppBar, Toolbar, Button, Typography } from "@mui/material";

import Grants from "./pages/Grants";
import Transactions from "./pages/Transactions";
import Home from "./pages/Home";

// Initialize Supabase client
export const supabase = createClient(
  "https://ihoqewwgkpjmkgwoenck.supabase.co",
  "sb_publishable_D5CnwE2fd6yCsARi6MVNGA_C-FVjvSd"
);

// 🔒 Protected Route wrapper
function ProtectedRoute({
  session,
  children,
}: {
  session: Session | null;
  children: JSX.Element;
}) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function NavigationTabs({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = (() => {
    switch (location.pathname) {
      case "/home":
        return 0;
      case "/grants":
        return 1;
      case "/transactions":
        return 2;
      default:
        return false;
    }
  })();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    const paths = ["/home", "/grants", "/transactions"];
    navigate(paths[newValue]);
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ ml: 2 }}>
          GrantGenie
        </Typography>
        <Tabs
          value={currentIndex}
          onChange={handleChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Home" />
          <Tab label="Grants" />
          <Tab label="Transactions" />
        </Tabs>
        <Button color="error" onClick={onLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
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

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Handle first-time user insert
  async function handleFirstTimeUser(session: Session) {
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
  }

  return (
    <Router>
      {!session ? (
        <Routes>
          <Route
            path="*"
            element={
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "100vh",
                }}
              >
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                />
              </Box>
            }
          />
        </Routes>
      ) : (
        <>
          <NavigationTabs onLogout={handleLogout} />
          <Routes>
            <Route
              path="/home"
              element={<ProtectedRoute session={session}><Home /></ProtectedRoute>}
            />
            <Route
              path="/grants"
              element={<ProtectedRoute session={session}><Grants /></ProtectedRoute>}
            />
            <Route
              path="/transactions"
              element={<ProtectedRoute session={session}><Transactions /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </>
      )}
    </Router>
  );
}
