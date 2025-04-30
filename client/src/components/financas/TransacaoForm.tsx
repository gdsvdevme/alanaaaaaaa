import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  tipo: z.enum(["entrada", "saida"]),
  valor: z.string().min(1, "Valor é obrigatório").refine(val => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser positivo"),
  data_transacao: z.date({ required_error: "Data é obrigatória" }),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  metodo_pagamento: z.string().min(1, "Método de pagamento é obrigatório"),
  agendamento_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransacaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<FormValues> & { id?: string };
  isEdit?: boolean;
}

export function TransacaoForm({ 
  open, 
  onOpenChange,
  initialData,
  isEdit = false
}: TransacaoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar agendamentos pendentes para vincular à transação
  const { data: agendamentos } = useQuery({
    queryKey: ['/api/agendamentos/pendentes'],
    enabled: open,
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: initialData?.tipo || "entrada",
      valor: initialData?.valor || "",
      data_transacao: initialData?.data_transacao || new Date(),
      descricao: initialData?.descricao || "",
      categoria: initialData?.categoria || "",
      metodo_pagamento: initialData?.metodo_pagamento || "",
      agendamento_id: initialData?.agendamento_id || undefined,
    },
  });
  
  // Watch para o tipo de transação (entrada/saída)
  const tipoTransacao = form.watch("tipo");
  
  // Categorias baseadas no tipo de transação
  const getCategorias = () => {
    if (tipoTransacao === "entrada") {
      return [
        { value: "servico", label: "Serviço" },
        { value: "venda", label: "Venda de Produtos" },
        { value: "outro", label: "Outro" },
      ];
    } else {
      return [
        { value: "estoque", label: "Compra de Estoque" },
        { value: "equipamento", label: "Equipamentos" },
        { value: "aluguel", label: "Aluguel" },
        { value: "energia", label: "Energia Elétrica" },
        { value: "agua", label: "Água" },
        { value: "internet", label: "Internet/Telefone" },
        { value: "salario", label: "Salários" },
        { value: "marketing", label: "Marketing" },
        { value: "despesa_fixa", label: "Despesa Fixa" },
        { value: "outro", label: "Outro" },
      ];
    }
  };
  
  // Métodos de pagamento
  const metodosPagamento = [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "cartao_credito", label: "Cartão de Crédito" },
    { value: "cartao_debito", label: "Cartão de Débito" },
    { value: "pix", label: "PIX" },
    { value: "transferencia", label: "Transferência Bancária" },
    { value: "boleto", label: "Boleto" },
  ];
  
  // Mutação para criar transação
  const createTransacao = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/transacoes", {
        ...data,
        valor: Number(data.valor),
        data_transacao: data.data_transacao.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Transação registrada com sucesso",
        description: "A transação foi adicionada ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financas/resumo'] });
      onOpenChange(false);
      form.reset({
        tipo: "entrada",
        valor: "",
        data_transacao: new Date(),
        descricao: "",
        categoria: "",
        metodo_pagamento: "",
        agendamento_id: undefined,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar transação",
        description: error.message || "Ocorreu um erro ao tentar registrar a transação.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar transação
  const updateTransacao = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/transacoes/${data.id}`, {
        ...data,
        valor: Number(data.valor),
        data_transacao: data.data_transacao.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Transação atualizada com sucesso",
        description: "As informações da transação foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financas/resumo'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message || "Ocorreu um erro ao tentar atualizar a transação.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    if (isEdit && initialData?.id) {
      updateTransacao.mutate({ id: initialData.id, ...data });
    } else {
      createTransacao.mutate(data);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Transação" : "Nova Transação"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Atualize os dados da transação financeira." 
              : "Registre uma nova entrada ou saída no sistema financeiro."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo de Transação */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Transação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      disabled={isEdit}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entrada" id="entrada" />
                        <Label htmlFor="entrada" className="font-normal cursor-pointer">Entrada</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="saida" id="saida" />
                        <Label htmlFor="saida" className="font-normal cursor-pointer">Saída</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Valor e Data */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        placeholder="0,00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="data_transacao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descreva a transação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Categoria e Método de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCategorias().map((categoria) => (
                          <SelectItem key={categoria.value} value={categoria.value}>
                            {categoria.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="metodo_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metodosPagamento.map((metodo) => (
                          <SelectItem key={metodo.value} value={metodo.value}>
                            {metodo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Vincular a Agendamento (apenas para entradas) */}
            {tipoTransacao === "entrada" && agendamentos?.length > 0 && (
              <FormField
                control={form.control}
                name="agendamento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vincular a Agendamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um agendamento (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {agendamentos?.map((agendamento: any) => (
                          <SelectItem key={agendamento.id} value={agendamento.id}>
                            {agendamento.cliente.nome} - {format(new Date(agendamento.data_hora_inicio), "dd/MM/yyyy HH:mm")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createTransacao.isPending || updateTransacao.isPending}
              >
                {(createTransacao.isPending || updateTransacao.isPending) 
                  ? "Salvando..." 
                  : isEdit ? "Atualizar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
