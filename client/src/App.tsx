import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import NotFound from "@/pages/not-found";
import { useAuth } from "./contexts/AuthContext";

// Páginas
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Agenda from "./pages/agenda";
import Clientes from "./pages/clientes";
import Servicos from "./pages/servicos";
import Estoque from "./pages/estoque";
import Financas from "./pages/financas";
import Relatorios from "./pages/relatorios";
import Configuracoes from "./pages/configuracoes";

function AppContent() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Se o usuário não estiver autenticado, mostrar tela de login
  if (!user) {
    return <Login />;
  }
  
  // Se estiver na página de login mas já autenticado, redirecionar para home
  if (user && location === "/login") {
    window.location.href = "/";
    return null;
  }
  
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/agenda" component={Agenda} />
        <Route path="/clientes" component={Clientes} />
        <Route path="/servicos" component={Servicos} />
        <Route path="/estoque" component={Estoque} />
        <Route path="/financas" component={Financas} />
        <Route path="/relatorios" component={Relatorios} />
        <Route path="/configuracoes" component={Configuracoes} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
