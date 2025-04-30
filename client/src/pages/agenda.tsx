import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Calendar as CalendarIcon, List, Plus } from "lucide-react";
import AgendamentoCalendar from "@/components/agendamentos/AgendamentoCalendar";
import AgendamentosTable from "@/components/dashboard/AgendamentosTable";
import { AgendamentoForm } from "@/components/agendamentos/AgendamentoForm";
import { useQuery } from "@tanstack/react-query";

export default function Agenda() {
  const [showForm, setShowForm] = useState(false);
  const [currentTab, setCurrentTab] = useState("calendario");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Buscar todos os agendamentos
  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['/api/agendamentos'],
  });
  
  // Função para atualizar status de agendamento
  const handleUpdateStatus = (id: string, status: string) => {
    // Implementação da atualização de status
    console.log(`Atualizar agendamento ${id} para status ${status}`);
  };
  
  // Controles de paginação
  const totalPages = Math.ceil((agendamentos?.length || 0) / itemsPerPage);
  
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  
  // Paginar os agendamentos
  const paginatedAgendamentos = agendamentos
    ? agendamentos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Gerenciamento de Agenda</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="calendario" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="lista" className="flex items-center">
            <List className="h-4 w-4 mr-2" />
            Listagem
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendario" className="space-y-4">
          <AgendamentoCalendar />
        </TabsContent>
        
        <TabsContent value="lista" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Lista de Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <AgendamentosTable 
                agendamentos={paginatedAgendamentos} 
                titulo=""
                onUpdate={handleUpdateStatus}
                paginacao={{
                  total: agendamentos?.length || 0,
                  atual: currentPage,
                  anterior: handlePreviousPage,
                  proxima: handleNextPage,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AgendamentoForm 
        open={showForm} 
        onOpenChange={setShowForm} 
      />
    </div>
  );
}
