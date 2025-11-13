import { Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./contexts/SessionProvider";
import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "./supabaseClient";
import Grants from "./pages/Grants";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import NavigationTabs from "./components/NavigationTabs";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export const AppRoutes = () => {
  const { session, logout } = useSession(); // destructured from context

  if (!session) {
    return (
      <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
    );
  }

  return (
    <>
      <NavigationTabs onLogout={logout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grants" element={<Grants />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
};
