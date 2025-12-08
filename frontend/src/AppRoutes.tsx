import { Routes, Route, Navigate } from "react-router-dom";
import { useSession, useSupabase } from "./contexts/SessionProvider";
import { Auth } from "@supabase/auth-ui-react";
import Grants from "./pages/Grants";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import NavigationTabs from "./components/NavigationTabs";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { logout } from "./utils/supabase-client-queries/auth";
import { Box, Typography } from "@mui/material";

export const AppRoutes = () => {
  const session = useSession();
  const supabase = useSupabase();

  if (!session) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Box sx={{
          mt: 5,
          minWidth: 500,
        }}>
          <Typography variant="h3">GrantGenie</Typography>
          <Typography variant="subtitle1">Helping you grant your financial wishes</Typography>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
        </Box>
      </Box>
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
