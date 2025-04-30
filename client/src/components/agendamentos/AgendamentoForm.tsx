import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { formatMoney, formatTimeRange, addMinutesToDate, calculateDuration } from "@/lib/utils";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  cliente_id: z.string({ required_error: "Selecione um cliente" }),
  servicos: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  data: z.date({ required_error: "Selecione uma data" }),
  hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AgendamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FormValues;
  isEdit?: boolean;
}

export function AgendamentoForm({ 
  open, 
  onOpenChange,
  initialData,
  isEdit = false
}: AgendamentoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Consultas
  const { data: clientes, isLoading: isLoadingClientes } = useQuery({
    queryKey: ['/api/clientes'],
    enabled: open,
  });
  
  const { data: servicos, isLoading: isLoadingServicos } = useQuery({
    queryKey: ['/api/servicos'],
    enabled: open,
  });
  
  // Estado para armazenar duração e preço total
  const [resumo, setResumo] = useState({
    duracao: 0,
    preco: 0,
    horaFim: "",
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      cliente_id: "",
      servicos: [],
      data: new Date(),
      hora: "10:00",
      observacoes: "",
    },
  });
  
  // Mutação para criar agendamento
  const createAgendamento = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/agendamentos", data);
    },
    onSuccess: () => {
      toast({
        title: "Agendamento criado com sucesso",
        description: "O agendamento foi adicionado à agenda.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agendamentos'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Ocorreu um erro ao tentar criar o agendamento.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar agendamento
  const updateAgendamento = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/agendamentos/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Agendamento atualizado com sucesso",
        description: "As informações do agendamento foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agendamentos'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message || "Ocorreu um erro ao tentar atualizar o agendamento.",
        variant: "destructive",
      });
    },
  });
  
  // Efeito para calcular duração e preço total quando serviços mudam
  useEffect(() => {
    const selectedServicos = form.watch("servicos") || [];
    const hora = form.watch("hora") || "10:00";
    
    if (!servicos || selectedServicos.length === 0) {
      setResumo({
        duracao: 0,
        preco: 0,
        horaFim: "",
      });
      return;
    }
    
    const servicosSelecionados = servicos.filter((s: any) => 
      selectedServicos.includes(s.id)
    );
    
    const duracaoTotal = servicosSelecionados.reduce(
      (total: number, servico: any) => total + servico.duracao, 0
    );
    
    const precoTotal = servicosSelecionados.reduce(
      (total: number, servico: any) => total + Number(servico.preco), 0
    );
    
    // Calcula hora de término
    const [hours, minutes] = hora.split(":").map(Number);
    const dataInicio = new Date();
    dataInicio.setHours(hours, minutes, 0, 0);
    const dataFim = new Date(dataInicio.getTime() + duracaoTotal * 60000);
    const horaFim = `${dataFim.getHours().toString().padStart(2, "0")}:${dataFim.getMinutes().toString().padStart(2, "0")}`;
    
    setResumo({
      duracao: duracaoTotal,
      preco: precoTotal,
      horaFim,
    });
  }, [form.watch("servicos"), form.watch("hora"), servicos]);
  
  const onSubmit = (data: FormValues) => {
    const dataHoraInicio = new Date(data.data);
    const [hours, minutes] = data.hora.split(":").map(Number);
    dataHoraInicio.setHours(hours, minutes, 0, 0);
    
    const dataHoraFim = addMinutesToDate(dataHoraInicio, resumo.duracao);
    
    const agendamentoData = {
      cliente_id: data.cliente_id,
      data_hora_inicio: dataHoraInicio.toISOString(),
      data_hora_fim: dataHoraFim.toISOString(),
      status: "agendado",
      observacoes: data.observacoes,
      preco_final: resumo.preco,
      servicos: data.servicos.map(id => ({
        servico_id: id,
        preco: servicos.find((s: any) => s.id === id)?.preco || 0,
      })),
    };
    
    if (isEdit && initialData) {
      updateAgendamento.mutate({ id: (initialData as any).id, ...agendamentoData });
    } else {
      createAgendamento.mutate(agendamentoData);
    }
  };
  
  // Componente para seletor de data
  const DatePicker = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {form.watch("data") ? (
            format(form.watch("data"), "PPP", { locale: ptBR })
          ) : (
            <span>Selecione uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={form.watch("data")}
          onSelect={(date) => form.setValue("data", date!)}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {isEdit ? "atualizar o" : "criar um novo"} agendamento.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Cliente */}
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoadingClientes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientes?.map((cliente: any) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <div className="flex justify-end mt-1">
                    <Button 
                      type="button" 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-primary"
                    >
                      + Novo Cliente
                    </Button>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Serviços */}
            <FormField
              control={form.control}
              name="servicos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange([value])} 
                    defaultValue={field.value?.[0]}
                    disabled={isLoadingServicos}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servicos?.map((servico: any) => (
                        <SelectItem key={servico.id} value={servico.id}>
                          {servico.nome} ({servico.duracao} min) - {formatMoney(servico.preco)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={() => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <DatePicker />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Resumo */}
            {resumo.duracao > 0 && (
              <div className="bg-neutral-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Resumo</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Duração:</span>
                    <span className="font-medium">{resumo.duracao} minutos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Horário:</span>
                    <span className="font-medium">{form.watch("hora")} - {resumo.horaFim}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Valor:</span>
                    <span className="font-medium">{formatMoney(resumo.preco)}</span>
                  </div>
                </div>
              </div>
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
                disabled={createAgendamento.isPending || updateAgendamento.isPending}
              >
                {(createAgendamento.isPending || updateAgendamento.isPending) 
                  ? "Salvando..." 
                  : isEdit ? "Atualizar" : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
