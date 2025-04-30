import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Search, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Header() {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Função para determinar o título da página com base na rota atual
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/agenda":
        return "Agenda";
      case "/clientes":
        return "Clientes";
      case "/servicos":
        return "Serviços";
      case "/estoque":
        return "Estoque";
      case "/financas":
        return "Finanças";
      case "/relatorios":
        return "Relatórios";
      case "/configuracoes":
        return "Configurações";
      default:
        return "Dashboard";
    }
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    
    // Captura o elemento do sidebar e altera sua visibilidade
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('flex');
    }
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button 
            className="md:hidden text-neutral-500 hover:text-neutral-700"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold text-neutral-800">{getPageTitle()}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-neutral-500 hover:text-neutral-700 relative">
            <Bell className="h-6 w-6" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px]">
              3
            </Badge>
          </button>
          <div className="relative w-64 hidden md:block">
            <Input
              type="text"
              placeholder="Pesquisar..."
              className="w-full py-2 pl-10 pr-4 text-sm text-neutral-700 bg-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
