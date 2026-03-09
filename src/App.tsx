import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequirePermission } from "@/components/layout/RequirePermission";

import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import MikrotiksPage from "@/pages/Mikrotiks";
import BackupsPage from "@/pages/Backups";
import PingTargetsPage from "@/pages/PingTargets";
import AuditLogsPage from "@/pages/AuditLogs";
import UsersPage from "@/pages/Users";
import GroupsPage from "@/pages/Groups";
import CompaniesPage from "@/pages/Companies";
import ProfilePage from "@/pages/Profile";
import SettingsPage from "@/pages/SettingsPage";
import FirmwarePage from "@/pages/FirmwarePage";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0b0b0d]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/mikrotiks" element={<MikrotiksPage />} />
              <Route path="/backups" element={<BackupsPage />} />
              <Route path="/ping-targets" element={<PingTargetsPage />} />
              <Route path="/logs" element={<AuditLogsPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              
              <Route element={<RequirePermission permission="firmware:read" />}>
                <Route path="/firmware" element={<FirmwarePage />} />
              </Route>

              <Route element={<RequirePermission permission="user:write" />}>
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>

              <Route element={<RequirePermission permission="group:write" />}>
                <Route path="/grupos" element={<GroupsPage />} />
              </Route>

              <Route element={<RequirePermission permission="settings:read" />}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="/empresas" element={<CompaniesPage />} />

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      
      <Toaster /> 
    </AuthProvider>
  );
}

export default App;