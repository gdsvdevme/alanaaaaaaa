import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClienteForm } from "./ClienteForm";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
  data_cadastro: string;
}

export default function ClientesList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pesquisa, setPesquisa] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  
  // Buscar clientes
  const { data: clientes, isLoading } = useQuery({
    queryKey: ['/api/clientes'],
  });
  
  // Mutação para excluir cliente
  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/clientes/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido do sistema com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      setShowDeleteDialog(false);
      setClienteSelecionado(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Ocorreu um erro ao tentar excluir o cliente.",
        variant: "destructive",
      });
    },
  });
  
  const handleAbrirEdicao = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setIsEdit(true);
    setShowForm(true);
  };
  
  const handleAbrirExclusao = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setShowDeleteDialog(true);
  };
  
  const handleExcluir = () => {
    if (clienteSelecionado) {
      deleteCliente.mutate(clienteSelecionado.id);
    }
  };
  
  const handleNovoCliente = () => {
    setClienteSelecionado(null);
    setIsEdit(false);
    setShowForm(true);
  };
  
  // Filtragem e paginação
  const clientesFiltrados = clientes
    ? clientes.filter((cliente: Cliente) => 
        cliente.nome.toLowerCase().includes(pesquisa.toLowerCase()) || 
        cliente.telefone.includes(pesquisa) || 
        (cliente.email && cliente.email.toLowerCase().includes(pesquisa.toLowerCase()))
      )
    : [];
  
  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);
  const clientesPaginados = clientesFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 pb-6">
          <CardTitle>Gerenciamento de Clientes</CardTitle>
          <Button onClick={handleNovoCliente}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                className="pl-8"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                ) : clientesPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      {pesquisa 
                        ? "Nenhum cliente encontrado para esta pesquisa." 
                        : "Nenhum cliente cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesPaginados.map((cliente: Cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        <div>
                          {cliente.telefone && (
                            <p className="text-sm">{cliente.telefone}</p>
                          )}
                          {cliente.email && (
                            <p className="text-xs text-neutral-500">{cliente.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(cliente.data_cadastro)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAbrirEdicao(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setClienteSelecionado(cliente)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAbrirExclusao(cliente)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-neutral-600">
                Mostrando {(paginaAtual - 1) * itensPorPagina + 1} a{" "}
                {Math.min(paginaAtual * itensPorPagina, clientesFiltrados.length)} de{" "}
                {clientesFiltrados.length} clientes
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
                  disabled={paginaAtual === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Formulário de cliente */}
      {showForm && (
        <ClienteForm
          open={showForm}
          onOpenChange={setShowForm}
          initialData={isEdit ? clienteSelecionado as Cliente : undefined}
          isEdit={isEdit}
        />
      )}
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o cliente {clienteSelecionado?.nome}?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleExcluir}
              disabled={deleteCliente.isPending}
            >
              {deleteCliente.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
