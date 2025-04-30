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
  quantidade: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Quantidade deve ser um valor positivo"),
  preco_custo: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Preço de custo deve ser um valor positivo"),
  preco_venda: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Preço de venda deve ser um valor positivo"),
  categoria: z.string().min(1, "Selecione uma categoria"),
});

type FormValues = z.infer<typeof formSchema>;

interface EstoqueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FormValues & { id: string };
  isEdit?: boolean;
}

export function EstoqueForm({ 
  open, 
  onOpenChange,
  initialData,
  isEdit = false
}: EstoqueFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: "",
      quantidade: "0",
      preco_custo: "",
      preco_venda: "",
      categoria: "",
    },
  });
  
  // Categorias disponíveis
  const categorias = [
    { value: "cabelo", label: "Produtos para Cabelo" },
    { value: "pele", label: "Produtos para Pele" },
    { value: "manicure", label: "Manicure e Pedicure" },
    { value: "maquiagem", label: "Maquiagem" },
    { value: "equipamentos", label: "Equipamentos" },
    { value: "descartaveis", label: "Descartáveis" },
    { value: "limpeza", label: "Limpeza" },
    { value: "outro", label: "Outros" },
  ];
  
  // Mutação para criar produto
  const createProduto = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/estoque", {
        ...data,
        quantidade: Number(data.quantidade),
        preco_custo: Number(data.preco_custo),
        preco_venda: Number(data.preco_venda),
      });
    },
    onSuccess: () => {
      toast({
        title: "Produto cadastrado com sucesso",
        description: "O produto foi adicionado ao inventário.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar produto",
        description: error.message || "Ocorreu um erro ao tentar cadastrar o produto.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar produto
  const updateProduto = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/estoque/${data.id}`, {
        ...data,
        quantidade: Number(data.quantidade),
        preco_custo: Number(data.preco_custo),
        preco_venda: Number(data.preco_venda),
      });
    },
    onSuccess: () => {
      toast({
        title: "Produto atualizado com sucesso",
        description: "As informações do produto foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/estoque'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message || "Ocorreu um erro ao tentar atualizar o produto.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    if (isEdit && initialData) {
      updateProduto.mutate({ id: initialData.id, ...data });
    } else {
      createProduto.mutate(data);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {isEdit ? "atualizar o" : "cadastrar um novo"} produto.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Shampoo Hidratante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preco_custo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
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
                name="preco_venda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venda (R$)</FormLabel>
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
            </div>
            
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
                disabled={createProduto.isPending || updateProduto.isPending}
              >
                {(createProduto.isPending || updateProduto.isPending) 
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
