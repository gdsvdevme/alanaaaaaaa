import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ServicoForm } from "./ServicoForm";
import { formatMoney } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Pencil, Trash, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ServicosListProps {
  onOpenForm?: () => void;
}

export default function ServicosList({ onOpenForm }: ServicosListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pesquisa, setPesquisa] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [servicoSelecionado, setServicoSelecionado] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Buscar serviços
  const { data: servicos, isLoading } = useQuery({
    queryKey: ['/api/servicos'],
  });
  
  // Buscar categorias
  const { data: categorias } = useQuery({
    queryKey: ['/api/servicos/categorias'],
  });
  
  // Mutação para excluir serviço
  const deleteServico = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/servicos/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Serviço excluído",
        description: "O serviço foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/servicos'] });
      setShowDeleteDialog(false);
      setServicoSelecionado(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir serviço",
        description: error.message || "Ocorreu um erro ao tentar excluir o serviço.",
        variant: "destructive",
      });
    },
  });
  
  const handleAbrirEdicao = (servico: any) => {
    setServicoSelecionado(servico);
    setIsEdit(true);
    setShowForm(true);
  };
  
  const handleAbrirExclusao = (servico: any) => {
    setServicoSelecionado(servico);
    setShowDeleteDialog(true);
  };
  
  const handleExcluir = () => {
    if (servicoSelecionado) {
      deleteServico.mutate(servicoSelecionado.id);
    }
  };
  
  const handleNovoServico = () => {
    if (onOpenForm) {
      onOpenForm();
    } else {
      setServicoSelecionado(null);
      setIsEdit(false);
      setShowForm(true);
    }
  };
  
  // Filtragem e paginação
  const servicosFiltrados = servicos
    ? servicos.filter((servico: any) => {
        const matchesSearch = servico.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
          servico.descricao?.toLowerCase().includes(pesquisa.toLowerCase());
          
        const matchesCategory = categoriaSelecionada === "todas" || 
          servico.categoria === categoriaSelecionada;
          
        return matchesSearch && matchesCategory;
      })
    : [];
  
  const totalPages = Math.ceil(servicosFiltrados.length / itemsPerPage);
  const servicosPaginados = servicosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar serviços..."
            className="pl-8"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Select 
            value={categoriaSelecionada} 
            onValueChange={setCategoriaSelecionada}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias?.map((categoria: any) => (
                <SelectItem key={categoria.value} value={categoria.value}>
                  {categoria.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleNovoServico}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Carregando serviços...
                </TableCell>
              </TableRow>
            ) : servicosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {pesquisa || categoriaSelecionada !== "todas"
                    ? "Nenhum serviço encontrado para esta pesquisa."
                    : "Nenhum serviço cadastrado."}
                </TableCell>
              </TableRow>
            ) : (
              servicosPaginados.map((servico: any) => (
                <TableRow key={servico.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{servico.nome}</p>
                      {servico.descricao && (
                        <p className="text-xs text-neutral-500 mt-1 truncate max-w-md">{servico.descricao}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {servico.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>{servico.duracao} min</TableCell>
                  <TableCell>{formatMoney(servico.preco)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleAbrirEdicao(servico)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleAbrirExclusao(servico)}
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
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-neutral-600">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, servicosFiltrados.length)} de{" "}
            {servicosFiltrados.length} serviços
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
      
      {/* Formulário de serviço */}
      {showForm && (
        <ServicoForm
          open={showForm}
          onOpenChange={setShowForm}
          initialData={isEdit ? servicoSelecionado : undefined}
          isEdit={isEdit}
        />
      )}
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o serviço {servicoSelecionado?.nome}?
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
              disabled={deleteServico.isPending}
            >
              {deleteServico.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
