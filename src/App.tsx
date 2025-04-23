import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ProtectedRoute } from '@/components/ProtectedRoute';
import BackgroundFX from "./components/BackgroundFX";
import { useEffect } from "react";
import { saveLastVisitedPath } from "./lib/sessionStorage";

// Layout and Components
import Layout from "./components/Layout";
import Dashboard from '@/components/Dashboard';
import MathChaos from '@/components/math-chaos/MathChaos';

// Pages
import Solver from "./pages/Solver";
import History from "./pages/History";
import Examples from "./pages/Examples";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PracticeIt from "./pages/PracticeIt";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ScienceCalculatorsPage from './pages/ScienceCalculators';
import FAQ from './pages/FAQ';
import Documentation from './pages/Documentation';
import Badges from './pages/Badges';
import AITest from '@/components/AITest';
import MathMentorPage from './pages/MathMentor';
import MathOraclePage from './pages/math-oracle';
import LandingPage from './pages/LandingPage';

// Navigation tracker component to save the last visited path
const NavigationTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    saveLastVisitedPath(location.pathname);
  }, [location]);
  
  return null;
};

const App = () => {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={0}>
        <AuthProvider>
          <WebSocketProvider>
            <HistoryProvider>
              <Router>
                <BackgroundFX />
                <NavigationTracker />
                <div className="relative min-h-screen bg-background/50">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route element={<Layout />}>
                      <Route path="solver" element={<Solver />} />
                      <Route path="practice" element={
                        <ProtectedRoute>
                          <PracticeIt />
                        </ProtectedRoute>
                      } />
                      <Route path="history" element={<History />} />
                      <Route path="examples" element={<Examples />} />
                      <Route path="about" element={<About />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="badges" element={<Badges />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="science-calculators" element={
                        <ProtectedRoute>
                          <ScienceCalculatorsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="faq" element={<FAQ />} />
                      <Route path="documentation" element={<Documentation />} />
                      <Route path="dashboard" element={
                        <ProtectedRoute allowedRoles={['admin', 'developer']}>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="login" element={<Login />} />
                      <Route path="signup" element={<Signup />} />
                      <Route path="ai-test" element={<AITest />} />
                      <Route path="math-mentor" element={
                        <ProtectedRoute>
                          <MathMentorPage />
                        </ProtectedRoute>
                      } />
                      <Route path="math-oracle" element={
                        <ProtectedRoute>
                          <MathOraclePage />
                        </ProtectedRoute>
                      } />
                      <Route path="math-chaos" element={
                        <ProtectedRoute>
                          <MathChaos />
                        </ProtectedRoute>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                  <Toaster />
                  <Sonner position="top-right" closeButton richColors />
                </div>
              </Router>
            </HistoryProvider>
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
