import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ViewAsProvider } from "@/contexts/ViewAsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import FilaAtendimento from "@/pages/FilaAtendimento";
import NovoAtendimento from "@/pages/NovoAtendimento";
import Comandos from "@/pages/Comandos";
import Chat from "@/pages/Chat";
import Notificacoes from "@/pages/Notificacoes";
import AtendimentoDetalhe from "@/pages/AtendimentoDetalhe";
import Demandas from "@/pages/Demandas";
import AutorizacoesFinanceiras from "@/pages/AutorizacoesFinanceiras";
import Agenda from "@/pages/Agenda";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
};

const LoginGuard = () => {
  const { isAuthenticated, usuario } = useAuth();
  if (isAuthenticated) {
    const defaultRoute = usuario?.perfil === 'sala_espera' ? '/fila' : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }
  return <LoginPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ViewAsProvider>
              <Routes>
                <Route path="/login" element={<LoginGuard />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route element={<ProtectedRoutes />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/fila" element={<FilaAtendimento />} />
                  <Route path="/atendimento/:id" element={<AtendimentoDetalhe />} />
                  <Route path="/novo-atendimento" element={<NovoAtendimento />} />
                  <Route path="/comandos" element={<Comandos />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/demandas" element={<Demandas />} />
                  <Route path="/autorizacoes" element={<AutorizacoesFinanceiras />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/notificacoes" element={<Notificacoes />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ViewAsProvider>
          </BrowserRouter>
          </ThemeProvider>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
