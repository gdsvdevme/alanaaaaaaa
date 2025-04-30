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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  preco: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Preço deve ser um valor positivo"),
  duracao: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Duração deve ser em minutos"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ServicoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FormValues & { id: string };
  isEdit?: boolean;
}

export function ServicoForm({ 
  open, 
  onOpenChange,
  initialData,
  isEdit = false
}: ServicoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: "",
      preco: "",
      duracao: "",
      categoria: "",
      descricao: "",
    },
  });
  
  // Categorias disponíveis
  const categorias = [
    { value: "cabelo", label: "Cabelo" },
    { value: "pele", label: "Pele" },
    { value: "manicure", label: "Manicure/Pedicure" },
    { value: "maquiagem", label: "Maquiagem" },
    { value: "depilacao", label: "Depilação" },
    { value: "massagem", label: "Massagem" },
    { value: "outro", label: "Outro" },
  ];
  
  // Mutação para criar serviço
  const createServico = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/servicos", {
        ...data,
        preco: Number(data.preco),
        duracao: Number(data.duracao),
      });
    },
    onSuccess: () => {
      toast({
        title: "Serviço cadastrado com sucesso",
        description: "O serviço foi adicionado ao catálogo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/servicos'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar serviço",
        description: error.message || "Ocorreu um erro ao tentar cadastrar o serviço.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar serviço
  const updateServico = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/servicos/${data.id}`, {
        ...data,
        preco: Number(data.preco),
        duracao: Number(data.duracao),
      });
    },
    onSuccess: () => {
      toast({
        title: "Serviço atualizado com sucesso",
        description: "As informações do serviço foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/servicos'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message || "Ocorreu um erro ao tentar atualizar o serviço.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    if (isEdit && initialData) {
      updateServico.mutate({ id: initialData.id, ...data });
    } else {
      createServico.mutate(data);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {isEdit ? "atualizar o" : "cadastrar um novo"} serviço.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Corte Feminino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
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
                name="duracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="5" 
                        step="5" 
                        placeholder="60" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((categoria) => (
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o serviço detalhadamente..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                disabled={createServico.isPending || updateServico.isPending}
              >
                {(createServico.isPending || updateServico.isPending) 
                  ? "Salvando..." 
                  : isEdit ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
