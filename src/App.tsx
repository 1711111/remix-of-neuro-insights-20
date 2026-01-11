import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Quests from "./pages/Quests";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Rewards from "./pages/Rewards";
import Badges from "./pages/Badges";
import Teams from "./pages/Teams";
import EcoFeed from "./pages/EcoFeed";
import Profile from "./pages/Profile";
import Leaderboards from "./pages/Leaderboards";
import NotFound from "./pages/NotFound";
import FloatingAIChat from "./components/FloatingAIChat";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/feed" element={<EcoFeed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingAIChat />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
