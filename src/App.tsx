import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChangePassword from "./pages/ChangePassword";
import DietitianDashboard from "./pages/dietitian/Dashboard";
import ClientList from "./pages/dietitian/ClientList";
import NewClient from "./pages/dietitian/NewClient";
import ClientProfile from "./pages/dietitian/ClientProfile";
import MealReview from "./pages/dietitian/MealReview";
import ReflectionInbox from "./pages/dietitian/ReflectionInbox";
import ClientDashboard from "./pages/client/Dashboard";
import ClientGoals from "./pages/client/Goals";
import ClientMeals from "./pages/client/Meals";
import ClientReflections from "./pages/client/Reflections";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Dietitian routes */}
            <Route path="/dietitian" element={<ProtectedRoute requiredRole="dietitian"><DietitianDashboard /></ProtectedRoute>} />
            <Route path="/dietitian/clients" element={<ProtectedRoute requiredRole="dietitian"><ClientList /></ProtectedRoute>} />
            <Route path="/dietitian/clients/new" element={<ProtectedRoute requiredRole="dietitian"><NewClient /></ProtectedRoute>} />
            <Route path="/dietitian/clients/:id" element={<ProtectedRoute requiredRole="dietitian"><ClientProfile /></ProtectedRoute>} />
            <Route path="/dietitian/meals" element={<ProtectedRoute requiredRole="dietitian"><MealReview /></ProtectedRoute>} />
            <Route path="/dietitian/reflections" element={<ProtectedRoute requiredRole="dietitian"><ReflectionInbox /></ProtectedRoute>} />

            {/* Client routes */}
            <Route path="/client" element={<ProtectedRoute requiredRole="client"><ClientDashboard /></ProtectedRoute>} />
            <Route path="/client/goals" element={<ProtectedRoute requiredRole="client"><ClientGoals /></ProtectedRoute>} />
            <Route path="/client/meals" element={<ProtectedRoute requiredRole="client"><ClientMeals /></ProtectedRoute>} />
            <Route path="/client/reflections" element={<ProtectedRoute requiredRole="client"><ClientReflections /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
