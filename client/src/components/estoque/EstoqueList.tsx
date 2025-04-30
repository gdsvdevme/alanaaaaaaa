import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { EstoqueForm } from "./EstoqueForm";
import { formatMoney } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Pencil, Trash, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface EstoqueListProps {
  onOpenForm?: () => void;
  filtro?: string;
}

export default function EstoqueList({ onOpenForm, filtro }: EstoqueListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pesquisa, setPesquisa] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [produtoSelecionado, setProdutoSelecionado] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAjusteQuantidadeDialog, setShowAjusteQuantidadeDialog] = useState(false);
  const [quantidadeAjuste, setQuantidadeAjuste] = useState(1);
  const [tipoAjuste, setTipoAjuste] = useState<'entrada' | 'saida'>('entrada');
  const [isEdit, setIsEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Buscar produtos
  const { data: produtos, isLoading } = useQuery({
    queryKey: ['/api/estoque'],
  });
  
  // Buscar categorias
  const { data: categorias } = useQuery({
    queryKey: ['/api/estoque/categorias'],
  });
  
  // Mutação para excluir produto
  const deleteProduto = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/estoque/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque'] });
      setShowDeleteDialog(false);
      setProdutoSelecionado(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message || "Ocorreu um erro ao tentar excluir o produto.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para ajustar quantidade
  const ajustarQuantidade = useMutation({
    mutationFn: async ({ id, quantidade, tipo }: { id: string, quantidade: number, tipo: 'entrada' | 'saida' }) => {
      return await apiRequest("PATCH", `/api/estoque/${id}/ajustar`, { quantidade, tipo });
    },
    onSuccess: () => {
      toast({
        title: "Quantidade ajustada",
        description: `Foi registrada ${tipoAjuste === 'entrada' ? 'a entrada' : 'a saída'} de ${quantidadeAjuste} unidades no estoque.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque'] });
      setShowAjusteQuantidadeDialog(false);
      setProdutoSelecionado(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao ajustar quantidade",
        description: error.message || "Ocorreu um erro ao tentar ajustar a quantidade do produto.",
        variant: "destructive",
      });
    },
  });
  
  const handleAbrirEdicao = (produto: any) => {
    setProdutoSelecionado(produto);
    setIsEdit(true);
    setShowForm(true);
  };
  
  const handleAbrirExclusao = (produto: any) => {
    setProdutoSelecionado(produto);
    setShowDeleteDialog(true);
  };
  
  const handleAbrirAjusteQuantidade = (produto: any, tipo: 'entrada' | 'saida') => {
    setProdutoSelecionado(produto);
    setTipoAjuste(tipo);
    setQuantidadeAjuste(1);
    setShowAjusteQuantidadeDialog(true);
  };
  
  const handleExcluir = () => {
    if (produtoSelecionado) {
      deleteProduto.mutate(produtoSelecionado.id);
    }
  };
  
  const handleAjustarQuantidade = () => {
    if (produtoSelecionado) {
      ajustarQuantidade.mutate({
        id: produtoSelecionado.id,
        quantidade: quantidadeAjuste,
        tipo: tipoAjuste
      });
    }
  };
  
  const handleNovoProduto = () => {
    if (onOpenForm) {
      onOpenForm();
    } else {
      setProdutoSelecionado(null);
      setIsEdit(false);
      setShowForm(true);
    }
  };
  
  // Filtragem e paginação
  const produtosFiltrados = produtos
    ? produtos.filter((produto: any) => {
        // Filtro de busca
        const matchesSearch = produto.nome.toLowerCase().includes(pesquisa.toLowerCase());
          
        // Filtro de categoria
        const matchesCategory = categoriaSelecionada === "todas" || 
          produto.categoria === categoriaSelecionada;
        
        // Filtro específico (baixo estoque)
        const matchesSpecificFilter = filtro === "baixo-estoque" 
          ? produto.quantidade <= 5 
          : true;
          
        return matchesSearch && matchesCategory && matchesSpecificFilter;
      })
    : [];
  
  const totalPages = Math.ceil(produtosFiltrados.length / itemsPerPage);
  const produtosPaginados = produtosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar produtos..."
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
          
          <Button onClick={handleNovoProduto}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>
      
      {filtro === "baixo-estoque" && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Os produtos abaixo estão com estoque baixo (5 unidades ou menos) e podem precisar de reposição.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Preço de Custo</TableHead>
              <TableHead>Preço de Venda</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Carregando produtos...
                </TableCell>
              </TableRow>
            ) : produtosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  {pesquisa || categoriaSelecionada !== "todas" || filtro === "baixo-estoque"
                    ? "Nenhum produto encontrado para esta pesquisa."
                    : "Nenhum produto cadastrado."}
                </TableCell>
              </TableRow>
            ) : (
              produtosPaginados.map((produto: any) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {produto.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className={`font-medium ${produto.quantidade <= 5 ? 'text-red-600' : ''}`}>
                        {produto.quantidade}
                      </span>
                      {produto.quantidade <= 5 && (
                        <Badge variant="destructive" className="ml-2">Baixo</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatMoney(produto.preco_custo)}</TableCell>
                  <TableCell>{formatMoney(produto.preco_venda)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleAbrirAjusteQuantidade(produto, 'entrada')}
                        title="Adicionar ao estoque"
                      >
                        <ArrowUp className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleAbrirAjusteQuantidade(produto, 'saida')}
                        title="Remover do estoque"
                        disabled={produto.quantidade <= 0}
                      >
                        <ArrowDown className="h-4 w-4 text-red-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleAbrirEdicao(produto)}
                        title="Editar produto"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleAbrirExclusao(produto)}
                        title="Excluir produto"
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
            {Math.min(currentPage * itemsPerPage, produtosFiltrados.length)} de{" "}
            {produtosFiltrados.length} produtos
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
      
      {/* Formulário de produto */}
      {showForm && (
        <EstoqueForm
          open={showForm}
          onOpenChange={setShowForm}
          initialData={isEdit ? produtoSelecionado : undefined}
          isEdit={isEdit}
        />
      )}
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o produto {produtoSelecionado?.nome}?
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
              disabled={deleteProduto.isPending}
            >
              {deleteProduto.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de ajuste de quantidade */}
      <Dialog open={showAjusteQuantidadeDialog} onOpenChange={setShowAjusteQuantidadeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tipoAjuste === 'entrada' ? 'Adicionar ao Estoque' : 'Remover do Estoque'}
            </DialogTitle>
            <DialogDescription>
              {tipoAjuste === 'entrada'
                ? `Informe a quantidade a ser adicionada ao estoque de ${produtoSelecionado?.nome}.`
                : `Informe a quantidade a ser removida do estoque de ${produtoSelecionado?.nome}.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Produto:</p>
                  <p className="text-sm">{produtoSelecionado?.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Estoque Atual:</p>
                  <p className="text-sm">{produtoSelecionado?.quantidade} unidades</p>
                </div>
              </div>
              
              <div>
                <label htmlFor="quantidade" className="block text-sm font-medium mb-1">
                  Quantidade:
                </label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  max={tipoAjuste === 'saida' ? produtoSelecionado?.quantidade : undefined}
                  value={quantidadeAjuste}
                  onChange={(e) => setQuantidadeAjuste(Number(e.target.value))}
                />
                {tipoAjuste === 'saida' && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Quantidade máxima disponível: {produtoSelecionado?.quantidade} unidades
                  </p>
                )}
              </div>
              
              {tipoAjuste === 'entrada' && (
                <div className="bg-neutral-50 p-3 rounded-md text-sm">
                  <p>
                    Após a operação, o estoque será de {(produtoSelecionado?.quantidade || 0) + quantidadeAjuste} unidades.
                  </p>
                </div>
              )}
              
              {tipoAjuste === 'saida' && (
                <div className="bg-neutral-50 p-3 rounded-md text-sm">
                  <p>
                    Após a operação, o estoque será de {Math.max(0, (produtoSelecionado?.quantidade || 0) - quantidadeAjuste)} unidades.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAjusteQuantidadeDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAjustarQuantidade}
              disabled={ajustarQuantidade.isPending || quantidadeAjuste <= 0 || 
                (tipoAjuste === 'saida' && quantidadeAjuste > (produtoSelecionado?.quantidade || 0))}
            >
              {ajustarQuantidade.isPending 
                ? "Processando..." 
                : tipoAjuste === 'entrada' 
                  ? "Adicionar" 
                  : "Remover"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
