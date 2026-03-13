import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import KanbanBoard from "./pages/KanbanBoard";
import LeadsBoard from "./pages/LeadsBoard";
import ProfilePage from "./pages/ProfilePage";
import QAPage from "./pages/QAPage";
import KeyAppPage from "./pages/KeyAppPage";
import InsuranceForm from "./pages/InsuranceForm";
import HomePage from "./pages/HomePage";

function Router() {
  return (
    <Switch>
      {/* Public route - no login required */}
      <Route path="/form/:agentCode" component={InsuranceForm} />
      {/* Protected dashboard routes */}
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/kanban" component={KanbanBoard} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/leads" component={LeadsBoard} />
            <Route path="/keyapp" component={KeyAppPage} />
            <Route path="/qa" component={QAPage} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
