import { Routes, Route, Navigate } from "react-router-dom";
import { useSession, useSupabase } from "./contexts/SessionProvider";
import { Auth } from "@supabase/auth-ui-react";
import Grants from "./pages/Grants";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import NavigationTabs from "./components/NavigationTabs";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { logout } from "./utils/supabase-client-queries/auth";

export const AppRoutes = () => {
  const session = useSession();
  const supabase = useSupabase();

  if (!session) {
    return (
      <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
    );
  }

  return (
    <>
      <NavigationTabs onLogout={() => logout(supabase)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grants" element={<Grants />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};
