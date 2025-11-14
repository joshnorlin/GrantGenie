import { BrowserRouter as Router } from "react-router-dom";
import { SessionProvider } from "./contexts/SessionProvider";
import { AppRoutes } from "./AppRoutes";

export default function App() {

  return (
    <SessionProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SessionProvider>
  );
}
