import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/components/layout/DashboardLayout";
import WorkDashboard from "@/pages/dashboard/work";
import PersonalDashboard from "@/pages/dashboard/personal";
import SchoolDashboard from "@/pages/dashboard/school";
import GeneralDashboard from "@/pages/dashboard/general";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Checkout from "@/pages/checkout";

// Education Components
import LessonBuilder from "@/components/education/LessonBuilder";
import ClassroomManager from "@/components/education/ClassroomManager";

// Work Components
import KanbanBoard from "@/components/work/KanbanBoard";

// Developer Components
import PluginMarketplace from "@/components/developer/PluginMarketplace";
import ApiKeyManager from "@/components/developer/ApiKeyManager";

// Scheduling Components
import BookingSystem from "@/components/scheduling/BookingSystem";

// Auth check for protected routes
import { BookMarketplace } from './components/marketplace/BookMarketplace';
import { DomainManager } from './components/hosting/DomainManager';
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      // Redirect to login if not authenticated
      setLocation('/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [setLocation]);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
    </div>;
  }

  return isAuthenticated ? <Component {...rest} /> : null;
};

function App() {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/signup';

  return (
    <>
      <Toaster />
      {isAuthPage ? (
        <Switch>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/signup">
            <Signup />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      ) : (
        <DashboardLayout>
          <Switch>
            <Route path="/checkout">
              <Checkout />
            </Route>
            {/* Dashboard Routes */}
            <Route path="/">
              <ProtectedRoute component={WorkDashboard} />
            </Route>
            <Route path="/dashboard/work">
              <ProtectedRoute component={WorkDashboard} />
            </Route>
            <Route path="/dashboard/personal">
              <ProtectedRoute component={PersonalDashboard} />
            </Route>
            <Route path="/dashboard/school">
              <ProtectedRoute component={SchoolDashboard} />
            </Route>
            <Route path="/dashboard/general">
              <ProtectedRoute component={GeneralDashboard} />
            </Route>

            {/* Education Routes */}
            <Route path="/education/lessons">
              <ProtectedRoute component={LessonBuilder} />
            </Route>
            <Route path="/education/classroom">
              <ProtectedRoute component={ClassroomManager} />
            </Route>

            {/* Work Routes */}
            <Route path="/work/kanban">
              <ProtectedRoute component={KanbanBoard} />
            </Route>

            {/* Developer Routes */}
            <Route path="/developer/plugins">
              <ProtectedRoute component={PluginMarketplace} />
            </Route>
            <Route path="/developer/api-keys">
              <ProtectedRoute component={ApiKeyManager} />
            </Route>

            {/* Scheduling Routes */}
            <Route path="/scheduling/booking">
              <ProtectedRoute component={BookingSystem} />
            </Route>

            <Route path="/profile">
              <ProtectedRoute component={Profile} />
            </Route>

            <Route path="/notifications">
              <ProtectedRoute component={Notifications} />
            </Route>

            <Route path="/modules">
              <ProtectedRoute component={ModulesPage} />
            </Route>

            <Route path="/settings">
              <ProtectedRoute component={Settings} />
            </Route>
            <Route path="/marketplace/books">
              <ProtectedRoute component={BookMarketplace} />
            </Route>
             <Route path="/hosting/domains">
              <ProtectedRoute component={DomainManager} />
            </Route>

            <Route>
              <NotFound />
            </Route>
          </Switch>
        </DashboardLayout>
      )}
    </>
  );
}

export default App;
