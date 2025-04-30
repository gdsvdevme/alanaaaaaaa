import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, isTomorrow, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar dinheiro em BRL
export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

// Função para formatar data
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Hoje, ${format(dateObj, "HH:mm", { locale: ptBR })}`;
  } else if (isYesterday(dateObj)) {
    return `Ontem, ${format(dateObj, "HH:mm", { locale: ptBR })}`;
  } else if (isTomorrow(dateObj)) {
    return `Amanhã, ${format(dateObj, "HH:mm", { locale: ptBR })}`;
  } else if (Math.abs(differenceInCalendarDays(dateObj, new Date())) < 7) {
    return format(dateObj, "EEEE, HH:mm", { locale: ptBR });
  } else {
    return format(dateObj, "dd/MM/yyyy, HH:mm", { locale: ptBR });
  }
}

// Função para formatar intervalo de tempo
export function formatTimeRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  
  return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
}

// Funções de cálculo de duração
export function calculateDuration(start: Date | string, end: Date | string): number {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  
  const durationMs = endDate.getTime() - startDate.getTime();
  return Math.round(durationMs / (1000 * 60)); // Duração em minutos
}

// Função para calcular data final com base na duração em minutos
export function addMinutesToDate(date: Date | string, minutes: number): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Date(dateObj.getTime() + minutes * 60000);
}

// Funções para status de agendamento
export function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "agendado":
      return "status-agendado";
    case "finalizado":
      return "status-finalizado";
    case "cancelado":
      return "status-cancelado";
    case "pagamento_pendente":
    case "pagamento pendente":
      return "status-pagamento-pendente";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getCategoriaClass(categoria: string): string {
  switch (categoria.toLowerCase()) {
    case "servico":
    case "serviço":
      return "categoria-servico";
    case "estoque":
      return "categoria-estoque";
    case "despesa_fixa":
    case "despesa fixa":
      return "categoria-despesa-fixa";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Utilitário para iniciais do nome
export function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.split(' ').filter(part => part.length > 0);
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Função para validar telefone
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  return phone;
}
