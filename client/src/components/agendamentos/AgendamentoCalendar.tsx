import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatTimeRange, getStatusClass } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AgendamentoForm } from "./AgendamentoForm";
import { useQuery } from "@tanstack/react-query";

interface Agendamento {
  id: string;
  cliente: {
    nome: string;
  };
  data_hora_inicio: string;
  data_hora_fim: string;
  servicos: {
    nome: string;
  }[];
  status: string;
}

type Visao = "dia" | "semana" | "mes";

export default function AgendamentoCalendar() {
  const [data, setData] = useState<Date>(new Date());
  const [visao, setVisao] = useState<Visao>("dia");
  const [showForm, setShowForm] = useState(false);
  
  // Busca de agendamentos
  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['/api/agendamentos'],
  });
  
  // Renderizar slots de horário - visão diária
  const renderHorariosDisponiveis = () => {
    // Gerar horários das 8h às 20h, a cada 30 minutos
    const horarios = [];
    for (let hora = 8; hora < 20; hora++) {
      for (let minuto of [0, 30]) {
        const horarioStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        horarios.push(horarioStr);
      }
    }
    
    return (
      <div className="mt-4 space-y-2">
        {horarios.map((horario) => {
          // Encontrar agendamentos neste horário
          const agendamentosNoHorario = agendamentos?.filter((agendamento: Agendamento) => {
            const dataInicio = new Date(agendamento.data_hora_inicio);
            const selectedDate = data;
            
            return (
              isSameDay(dataInicio, selectedDate) && 
              format(dataInicio, "HH:mm") === horario
            );
          });
          
          return (
            <div key={horario} className="flex items-start">
              <div className="w-16 text-sm text-neutral-500 pt-2 mr-2">{horario}</div>
              <div className="flex-1">
                {agendamentosNoHorario?.length > 0 ? (
                  agendamentosNoHorario.map((agendamento: Agendamento) => (
                    <Card key={agendamento.id} className="mb-1 overflow-hidden">
                      <div className={cn(
                        "h-1.5",
                        getStatusClass(agendamento.status).replace("bg-", ""),
                        agendamento.status === "finalizado" ? "bg-green-500" : 
                        agendamento.status === "cancelado" ? "bg-red-500" : 
                        agendamento.status === "pagamento_pendente" ? "bg-orange-500" : 
                        "bg-yellow-500"
                      )} />
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{agendamento.cliente.nome}</p>
                            <p className="text-xs text-neutral-500">
                              {formatTimeRange(
                                agendamento.data_hora_inicio, 
                                agendamento.data_hora_fim
                              )} • {agendamento.servicos[0]?.nome || "Serviço não especificado"}
                            </p>
                          </div>
                          <Badge className={getStatusClass(agendamento.status)}>
                            {agendamento.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="h-10 border border-dashed border-neutral-200 rounded-md flex items-center justify-center">
                    <button 
                      className="text-xs text-neutral-500 hover:text-primary"
                      onClick={() => setShowForm(true)}
                    >
                      Adicionar agendamento
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Renderizar visão semanal
  const renderVisaoSemanal = () => {
    const primeiroDiaSemana = startOfWeek(data, { weekStartsOn: 0 });
    const ultimoDiaSemana = endOfWeek(data, { weekStartsOn: 0 });
    const diasDaSemana = eachDayOfInterval({ start: primeiroDiaSemana, end: ultimoDiaSemana });
    
    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {diasDaSemana.map((dia) => (
          <div key={dia.toString()} className="border rounded-md p-2">
            <div className="text-center mb-2">
              <div className="text-xs text-neutral-500">{format(dia, 'EEEE', { locale: ptBR })}</div>
              <div className={cn(
                "text-sm font-medium",
                isSameDay(dia, new Date()) ? "text-primary" : ""
              )}>
                {format(dia, 'dd', { locale: ptBR })}
              </div>
            </div>
            
            <div className="space-y-1">
              {agendamentos?.filter((agendamento: Agendamento) => {
                const dataInicio = new Date(agendamento.data_hora_inicio);
                return isSameDay(dataInicio, dia);
              }).slice(0, 3).map((agendamento: Agendamento) => (
                <div 
                  key={agendamento.id} 
                  className={cn(
                    "text-xs p-1 rounded truncate",
                    getStatusClass(agendamento.status)
                  )}
                >
                  {format(new Date(agendamento.data_hora_inicio), 'HH:mm')} - {agendamento.cliente.nome}
                </div>
              ))}
              
              {agendamentos?.filter((agendamento: Agendamento) => {
                const dataInicio = new Date(agendamento.data_hora_inicio);
                return isSameDay(dataInicio, dia);
              }).length > 3 && (
                <div className="text-xs text-center text-neutral-500">
                  + {agendamentos?.filter((agendamento: Agendamento) => {
                    const dataInicio = new Date(agendamento.data_hora_inicio);
                    return isSameDay(dataInicio, dia);
                  }).length - 3} mais
                </div>
              )}
              
              {agendamentos?.filter((agendamento: Agendamento) => {
                const dataInicio = new Date(agendamento.data_hora_inicio);
                return isSameDay(dataInicio, dia);
              }).length === 0 && (
                <div className="text-xs text-center text-neutral-400 p-1">
                  Sem agendamentos
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar a visão do calendário
  const renderCalendarView = () => {
    switch (visao) {
      case "dia":
        return renderHorariosDisponiveis();
      case "semana":
        return renderVisaoSemanal();
      case "mes":
        return (
          <div className="mt-4">
            <CalendarComponent
              mode="single"
              selected={data}
              onSelect={(date) => date && setData(date)}
              className="rounded-md border p-3"
              locale={ptBR}
            />
          </div>
        );
      default:
        return null;
    }
  };
  
  // Navegação entre datas
  const navegarData = (direcao: 'anterior' | 'proximo') => {
    if (direcao === 'anterior') {
      switch (visao) {
        case 'dia':
          setData(addDays(data, -1));
          break;
        case 'semana':
          setData(addDays(data, -7));
          break;
        case 'mes':
          const mesAnterior = new Date(data);
          mesAnterior.setMonth(data.getMonth() - 1);
          setData(mesAnterior);
          break;
      }
    } else {
      switch (visao) {
        case 'dia':
          setData(addDays(data, 1));
          break;
        case 'semana':
          setData(addDays(data, 7));
          break;
        case 'mes':
          const proximoMes = new Date(data);
          proximoMes.setMonth(data.getMonth() + 1);
          setData(proximoMes);
          break;
      }
    }
  };
  
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Calendário de Agendamentos</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navegarData('anterior')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium text-lg">
              {visao === 'dia' && format(data, 'dd MMM, yyyy', { locale: ptBR })}
              {visao === 'semana' && `${format(startOfWeek(data, { weekStartsOn: 0 }), 'dd MMM', { locale: ptBR })} - ${format(endOfWeek(data, { weekStartsOn: 0 }), 'dd MMM, yyyy', { locale: ptBR })}`}
              {visao === 'mes' && format(data, 'MMMM yyyy', { locale: ptBR })}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navegarData('proximo')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setData(new Date())}
            >
              Hoje
            </Button>
          </div>
          
          <Select value={visao} onValueChange={(v) => setVisao(v as Visao)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Dia</SelectItem>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <p>Carregando agendamentos...</p>
          </div>
        ) : (
          renderCalendarView()
        )}
      </CardContent>
      
      <AgendamentoForm 
        open={showForm} 
        onOpenChange={setShowForm} 
      />
    </Card>
  );
}
