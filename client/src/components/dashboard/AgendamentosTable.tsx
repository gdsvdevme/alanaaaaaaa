import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatMoney, getInitials, getStatusClass } from "@/lib/utils";
import { AgendamentoForm } from "../agendamentos/AgendamentoForm";
import { useState } from "react";

interface Agendamento {
  id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string;
  };
  servicos: {
    nome: string;
    duracao: number;
  }[];
  preco_final: number;
  status: string;
}

interface AgendamentosTableProps {
  agendamentos: Agendamento[];
  titulo?: string;
  paginacao?: {
    total: number;
    atual: number;
    anterior: () => void;
    proxima: () => void;
  };
  onUpdate?: (id: string, status: string) => void;
}

export default function AgendamentosTable({ 
  agendamentos, 
  titulo = "Agendamentos de Hoje",
  paginacao,
  onUpdate
}: AgendamentosTableProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  
  const handleStatusChange = (id: string, novoStatus: string) => {
    if (onUpdate) {
      onUpdate(id, novoStatus);
      toast({
        title: "Status atualizado",
        description: `O agendamento foi marcado como ${novoStatus.toLowerCase()}.`,
      });
    }
  };
  
  const formatHorario = (inicio: string, fim: string) => {
    const startDate = new Date(inicio);
    const endDate = new Date(fim);
    
    return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')} - ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2 md:mb-0">
          {titulo}
        </h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>
      
      <Card className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow>
                <TableHead className="w-[150px]">Horário</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                agendamentos.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">
                      {formatHorario(agendamento.data_hora_inicio, agendamento.data_hora_fim)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 bg-primary-100 text-primary">
                          <AvatarFallback>{getInitials(agendamento.cliente.nome)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-neutral-800">{agendamento.cliente.nome}</p>
                          <p className="text-xs text-neutral-500">{agendamento.cliente.telefone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{agendamento.servicos?.[0]?.nome || "Serviço não especificado"}</p>
                      <p className="text-xs text-neutral-500">
                        {agendamento.servicos?.[0]?.duracao || 0} minutos
                      </p>
                    </TableCell>
                    <TableCell>{formatMoney(agendamento.preco_final)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusClass(agendamento.status)}>
                        {agendamento.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {agendamento.status === "agendado" && (
                          <>
                            <Button 
                              variant="link" 
                              className="text-primary hover:text-primary/80"
                              onClick={() => handleStatusChange(agendamento.id, "finalizado")}
                            >
                              Finalizar
                            </Button>
                            <Button 
                              variant="link" 
                              className="text-neutral-500 hover:text-neutral-700"
                              onClick={() => handleStatusChange(agendamento.id, "cancelado")}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {agendamento.status === "cancelado" && (
                          <Button 
                            variant="link" 
                            className="text-primary hover:text-primary/80"
                          >
                            Reagendar
                          </Button>
                        )}
                        {agendamento.status === "finalizado" || agendamento.status === "pagamento_pendente" && (
                          <Button 
                            variant="link" 
                            className="text-primary hover:text-primary/80"
                          >
                            Detalhes
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {paginacao && (
          <div className="bg-white px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-neutral-700">
              <p>
                Mostrando <span className="font-medium">{agendamentos.length}</span> de{" "}
                <span className="font-medium">{paginacao.total}</span> agendamentos
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={paginacao.anterior}
                disabled={paginacao.atual === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant={paginacao.atual === 1 ? "secondary" : "outline"}
                size="sm"
              >
                1
              </Button>
              {paginacao.total > 1 && (
                <Button
                  variant={paginacao.atual === 2 ? "secondary" : "outline"}
                  size="sm"
                >
                  2
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={paginacao.proxima}
                disabled={paginacao.atual === Math.ceil(paginacao.total / 10)}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      <AgendamentoForm 
        open={showForm} 
        onOpenChange={setShowForm} 
      />
    </>
  );
}
