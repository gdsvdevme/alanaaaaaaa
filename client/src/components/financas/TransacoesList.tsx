import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TransacaoForm } from "./TransacaoForm";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash, 
  Filter, 
  Calendar,
  ArrowUpDown,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatMoney, getCategoriaClass } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { format, subDays } from "date-fns";

interface TransacoesListProps {
  onOpenForm?: () => void;
  filtro?: string;
}

export default function TransacoesList({ onOpenForm, filtro = "todas" }: TransacoesListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pesquisa, setPesquisa] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [metodoPagamento, setMetodoPagamento] = useState("todos");
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [periodoData, setPeriodoData] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const itemsPerPage = 10;
  
  // Buscar transações
  const { data: transacoes, isLoading } = useQuery({
    queryKey: ['/api/transacoes'],
  });
  
  // Buscar categorias
  const { data: categorias } = useQuery({
    queryKey: ['/api/transacoes/categorias'],
  });
  
  // Mutação para excluir transação
  const deleteTransacao = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/transacoes/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Transação excluída",
        description: "A transação foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financas/resumo'] });
      setShowDeleteDialog(false);
      setTransacaoSelecionada(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message || "Ocorreu um erro ao tentar excluir a transação.",
        variant: "destructive",
      });
    },
  });
  
  const handleAbrirEdicao = (transacao: any) => {
    setTransacaoSelecionada(transacao);
    setIsEdit(true);
    setShowForm(true);
  };
  
  const handleAbrirExclusao = (transacao: any) => {
    setTransacaoSelecionada(transacao);
    setShowDeleteDialog(true);
  };
  
  const handleExcluir = () => {
    if (transacaoSelecionada) {
      deleteTransacao.mutate(transacaoSelecionada.id);
    }
  };
  
  const handleNovaTransacao = () => {
    if (onOpenForm) {
      onOpenForm();
    } else {
      setTransacaoSelecionada(null);
      setIsEdit(false);
      setShowForm(true);
    }
  };
  
  // Filtragem e paginação
  const transacoesFiltradas = transacoes
    ? transacoes.filter((transacao: any) => {
        // Filtro de busca por descrição
        const matchesSearch = transacao.descricao.toLowerCase().includes(pesquisa.toLowerCase());
          
        // Filtro de categoria
        const matchesCategory = categoriaSelecionada === "todas" || 
          transacao.categoria === categoriaSelecionada;
          
        // Filtro de método de pagamento
        const matchesPaymentMethod = metodoPagamento === "todos" || 
          transacao.metodo_pagamento === metodoPagamento;
          
        // Filtro de data
        const transacaoData = new Date(transacao.data_transacao);
        const matchesDateRange = 
          (!periodoData?.from || transacaoData >= periodoData.from) && 
          (!periodoData?.to || transacaoData <= periodoData.to);
        
        // Filtro específico (entradas/saídas/pendentes)
        let matchesSpecificFilter = true;
        
        if (filtro === "receitas") {
          matchesSpecificFilter = transacao.tipo === "entrada";
        } else if (filtro === "despesas") {
          matchesSpecificFilter = transacao.tipo === "saida";
        } else if (filtro === "pendentes") {
          matchesSpecificFilter = transacao.status_pagamento === "pendente";
        }
          
        return matchesSearch && matchesCategory && matchesPaymentMethod && matchesDateRange && matchesSpecificFilter;
      })
    : [];
  
  const totalPages = Math.ceil(transacoesFiltradas.length / itemsPerPage);
  const transacoesPaginadas = transacoesFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Calcular totais
  const totalEntradas = transacoesFiltradas.reduce((total, t: any) => 
    t.tipo === "entrada" ? total + Number(t.valor) : total, 0);
    
  const totalSaidas = transacoesFiltradas.reduce((total, t: any) => 
    t.tipo === "saida" ? total + Number(t.valor) : total, 0);
  
  // Métodos de pagamento
  const metodosPagamento = [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "cartao_credito", label: "Cartão de Crédito" },
    { value: "cartao_debito", label: "Cartão de Débito" },
    { value: "pix", label: "PIX" },
    { value: "transferencia", label: "Transferência Bancária" },
    { value: "boleto", label: "Boleto" },
  ];
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <CardTitle>Transações Financeiras</CardTitle>
            <Button onClick={handleNovaTransacao}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 space-y-2">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Buscar por descrição..."
                  className="pl-8"
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {periodoData?.from ? (
                        periodoData.to ? (
                          <>
                            {format(periodoData.from, "dd/MM/yyyy")} -{" "}
                            {format(periodoData.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(periodoData.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={periodoData?.from}
                      selected={periodoData}
                      onSelect={setPeriodoData}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                    <div className="flex justify-end gap-2 p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPeriodoData(undefined)}
                      >
                        Limpar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setPeriodoData({
                            from: subDays(today, 30),
                            to: today
                          });
                        }}
                      >
                        Últimos 30 dias
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Select 
                  value={categoriaSelecionada} 
                  onValueChange={setCategoriaSelecionada}
                >
                  <SelectTrigger className="w-[160px]">
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
                
                <Select 
                  value={metodoPagamento} 
                  onValueChange={setMetodoPagamento}
                >
                  <SelectTrigger className="w-[160px]">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os métodos</SelectItem>
                    {metodosPagamento.map((metodo) => (
                      <SelectItem key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Resumo dos valores filtrados */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Entradas: {formatMoney(totalEntradas)}
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Saídas: {formatMoney(totalSaidas)}
              </Badge>
              <Badge variant="outline" className={`${totalEntradas - totalSaidas >= 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                Saldo: {formatMoney(totalEntradas - totalSaidas)}
              </Badge>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Carregando transações...
                    </TableCell>
                  </TableRow>
                ) : transacoesPaginadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Nenhuma transação encontrada com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  transacoesPaginadas.map((transacao: any) => (
                    <TableRow key={transacao.id}>
                      <TableCell className="font-medium">
                        {formatDate(transacao.data_transacao)}
                      </TableCell>
                      <TableCell>{transacao.descricao}</TableCell>
                      <TableCell>
                        <Badge className={getCategoriaClass(transacao.categoria)}>
                          {transacao.categoria_nome || transacao.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {transacao.tipo === 'entrada' ? '+ ' : '- '}
                        {formatMoney(transacao.valor)}
                      </TableCell>
                      <TableCell>{transacao.metodo_pagamento_nome || transacao.metodo_pagamento}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAbrirEdicao(transacao)}
                            title="Editar transação"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAbrirExclusao(transacao)}
                            title="Excluir transação"
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
                {Math.min(currentPage * itemsPerPage, transacoesFiltradas.length)} de{" "}
                {transacoesFiltradas.length} transações
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
        </CardContent>
      </Card>
      
      {/* Formulário de transação */}
      {showForm && (
        <TransacaoForm
          open={showForm}
          onOpenChange={setShowForm}
          initialData={isEdit ? transacaoSelecionada : undefined}
          isEdit={isEdit}
        />
      )}
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta transação? 
              Esta ação não pode ser desfeita e pode afetar relatórios financeiros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTransacao.isPending}
            >
              {deleteTransacao.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Componente de ícone que deve estar na função acima mas foi esquecido
const CreditCard = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);
