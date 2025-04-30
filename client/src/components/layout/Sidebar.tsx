import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings as SettingsIcon,
  Package, 
  Scissors, 
  Wallet, 
  FileText, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (path: string) => location === path;
  
  // Menu items
  const menuItems = [
    { path: "/", icon: <LayoutDashboard className="h-5 w-5 mr-3" />, label: "Dashboard" },
    { path: "/agenda", icon: <Calendar className="h-5 w-5 mr-3" />, label: "Agenda" },
    { path: "/clientes", icon: <Users className="h-5 w-5 mr-3" />, label: "Clientes" },
    { path: "/servicos", icon: <Scissors className="h-5 w-5 mr-3" />, label: "Serviços" },
    { path: "/estoque", icon: <Package className="h-5 w-5 mr-3" />, label: "Estoque" },
    { path: "/financas", icon: <Wallet className="h-5 w-5 mr-3" />, label: "Finanças" },
    { path: "/relatorios", icon: <FileText className="h-5 w-5 mr-3" />, label: "Relatórios" },
    { path: "/configuracoes", icon: <SettingsIcon className="h-5 w-5 mr-3" />, label: "Configurações" },
  ];
  
  return (
    <aside className={`w-full md:w-64 bg-white border-r border-neutral-200 md:min-h-screen flex flex-col ${isOpen ? "fixed inset-0 z-50" : "hidden md:flex"}`}>
      {/* Logo Area */}
      <div className="px-6 py-5 border-b border-neutral-200">
        <h1 className="text-2xl font-display font-bold text-primary">
          <span className="block">Dellas</span>
          <span className="text-xs uppercase tracking-widest text-neutral-600">Cabelo & Pele</span>
        </h1>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}
                className={`flex items-center px-3 py-2 rounded-md group ${
                  isActive(item.path)
                    ? "bg-primary-50 text-primary"
                    : "text-neutral-700 hover:bg-neutral-100 transition-colors"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary">
              <span className="font-medium">{getInitials(user.nome)}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-800">{user.nome}</p>
              <p className="text-xs text-neutral-500">
                {user.perfil === "admin" ? "Administrador" : "Atendente"}
              </p>
            </div>
            <button 
              className="ml-auto text-neutral-500 hover:text-neutral-700"
              onClick={() => logout()}
              aria-label="Sair"
              title="Sair do Sistema"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Botão para fechar no mobile */}
      <button 
        className="md:hidden absolute top-4 right-4 text-neutral-500" 
        onClick={() => setIsOpen(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </aside>
  );
}
