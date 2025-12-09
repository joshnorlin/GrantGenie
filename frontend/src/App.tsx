import { BrowserRouter as Router } from "react-router-dom";
import { SessionProvider } from "./contexts/SessionProvider";
import { DataCacheProvider } from "./contexts/DataCacheProvider";
import { AppRoutes } from "./AppRoutes";

export default function App() {

  return (
    <SessionProvider>
        <DataCacheProvider>
      <Router>
        <AppRoutes />
      </Router>
      </DataCacheProvider>
    </SessionProvider>
  );
}
