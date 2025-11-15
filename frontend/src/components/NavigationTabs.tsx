import { AppBar, Toolbar, Tabs, Tab, Button, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function NavigationTabs({ onLogout }: { onLogout: () => void }) {
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
        return 0;
    }
  })();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    const paths = ["/", "/grants", "/transactions"];
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
