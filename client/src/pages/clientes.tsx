import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Clock } from "lucide-react";
import ClientesList from "@/components/clientes/ClientesList";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatMoney, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClienteForm } from "@/components/clientes/ClienteForm";

interface ClienteDetalhado {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
  data_cadastro: string;
  agendamentos_total: number;
  valor_gasto: number;
  ultima_visita: string;
  servicos_frequentes: { nome: string; quantidade: number }[];
}

export default function Clientes() {
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Buscar cliente detalhado
  const { data: clienteDetalhado, isLoading: isLoadingDetalhes } = useQuery({
    queryKey: ['/api/clientes/detalhes', selectedCliente],
    enabled: !!selectedCliente,
  });
  
  // Função para abrir detalhes do cliente
  const handleOpenDetalhes = (clienteId: string) => {
    setSelectedCliente(clienteId);
  };
  
  // Renderizar detalhes do cliente
  const renderClienteDetalhes = () => {
    if (!clienteDetalhado) return null;
    
    const cliente: ClienteDetalhado = clienteDetalhado;
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 bg-primary-100 text-primary text-lg">
              <AvatarFallback>{getInitials(cliente.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{cliente.nome}</CardTitle>
              <p className="text-sm text-neutral-500">Cliente desde {formatDate(cliente.data_cadastro)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium text-neutral-800 mb-1">Contato</h3>
              {cliente.telefone && <p className="text-sm">{cliente.telefone}</p>}
              {cliente.email && <p className="text-sm">{cliente.email}</p>}
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium text-neutral-800 mb-1">Agendamentos</h3>
              <p className="text-sm">{cliente.agendamentos_total} visitas</p>
              <p className="text-sm">Última visita: {formatDate(cliente.ultima_visita)}</p>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium text-neutral-800 mb-1">Gasto Total</h3>
              <p className="text-xl font-semibold text-primary">
                {formatMoney(cliente.valor_gasto)}
              </p>
            </div>
          </div>
          
          {cliente.observacoes && (
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium text-neutral-800 mb-1">Observações</h3>
              <p className="text-sm">{cliente.observacoes}</p>
            </div>
          )}
          
          {cliente.servicos_frequentes?.length > 0 && (
            <div>
              <h3 className="font-medium text-neutral-800 mb-2">Serviços Mais Utilizados</h3>
              <div className="space-y-2">
                {cliente.servicos_frequentes.map((servico, index) => (
                  <div key={index} className="bg-neutral-50 p-3 rounded-lg flex justify-between">
                    <span className="text-sm">{servico.nome}</span>
                    <span className="text-sm font-medium">{servico.quantidade}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedCliente(null)}
            >
              Voltar
            </Button>
            <Button
              onClick={() => {
                setShowForm(true);
              }}
            >
              Editar Cliente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      
      {selectedCliente ? (
        renderClienteDetalhes()
      ) : (
        <Tabs defaultValue="todos">
          <TabsList className="mb-4">
            <TabsTrigger value="todos" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Todos os Clientes
            </TabsTrigger>
            <TabsTrigger value="recentes" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Adicionados Recentemente
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos">
            <ClientesList />
          </TabsContent>
          
          <TabsContent value="recentes">
            <ClientesList />
          </TabsContent>
        </Tabs>
      )}
      
      {showForm && selectedCliente && (
        <ClienteForm 
          open={showForm}
          onOpenChange={setShowForm}
          initialData={clienteDetalhado}
          isEdit={true}
        />
      )}
    </div>
  );
}
