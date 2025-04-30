import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatPhone } from "@/lib/utils";

const formSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FormValues & { id: string };
  isEdit?: boolean;
}

export function ClienteForm({ 
  open, 
  onOpenChange,
  initialData,
  isEdit = false
}: ClienteFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: "",
      telefone: "",
      email: "",
      observacoes: "",
    },
  });
  
  // Formatação de telefone enquanto digita
  const [telefone, setTelefone] = useState(initialData?.telefone || "");
  
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const formattedValue = formatPhone(rawValue);
    setTelefone(formattedValue);
    form.setValue("telefone", formattedValue);
  };
  
  // Mutação para criar cliente
  const createCliente = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/clientes", data);
    },
    onSuccess: () => {
      toast({
        title: "Cliente cadastrado com sucesso",
        description: "O cliente foi adicionado ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      onOpenChange(false);
      form.reset();
      setTelefone("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message || "Ocorreu um erro ao tentar cadastrar o cliente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar cliente
  const updateCliente = useMutation({
    mutationFn: async (data: FormValues & { id: string }) => {
      return await apiRequest("PATCH", `/api/clientes/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Cliente atualizado com sucesso",
        description: "As informações do cliente foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Ocorreu um erro ao tentar atualizar o cliente.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    if (isEdit && initialData) {
      updateCliente.mutate({ id: initialData.id, ...data });
    } else {
      createCliente.mutate(data);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {isEdit ? "atualizar o" : "cadastrar um novo"} cliente.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      value={telefone}
                      onChange={handleTelefoneChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o cliente..."
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
                disabled={createCliente.isPending || updateCliente.isPending}
              >
                {(createCliente.isPending || updateCliente.isPending) 
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
