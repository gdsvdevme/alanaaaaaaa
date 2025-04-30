import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Bell, Clock, Shield } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const salonFormSchema = z.object({
  nome: z.string().min(3, "Nome do salão é obrigatório"),
  telefone: z.string().min(8, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido"),
  endereco: z.string().min(5, "Endereço é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório"),
  cep: z.string().min(8, "CEP é obrigatório"),
  logo: z.string().optional(),
  cores: z.object({
    primaria: z.string(),
    secundaria: z.string(),
  }),
});

const horarioFormSchema = z.object({
  domingo: z.object({
    aberto: z.boolean().default(false),
    abertura: z.string().optional(),
    fechamento: z.string().optional(),
  }),
  segunda: z.object({
    aberto: z.boolean().default(true),
    abertura: z.string(),
    fechamento: z.string(),
  }),
  terca: z.object({
    aberto: z.boolean().default(true),
    abertura: z.string(),
    fechamento: z.string(),
  }),
  quarta: z.object({
    aberto: z.boolean().default(true),
    abertura: z.string(),
    fechamento: z.string(),
  }),
  quinta: z.object({
    aberto: z.boolean().default(true),
    abertura: z.string(),
    fechamento: z.string(),
  }),
  sexta: z.object({
    aberto: z.boolean().default(true),
    abertura: z.string(),
    fechamento: z.string(),
  }),
  sabado: z.object({
    aberto: z.boolean().default(true),
    abertura: z.string(),
    fechamento: z.string(),
  }),
});

const usuarioFormSchema = z.object({
  nome: z.string().min(3, "Nome do usuário é obrigatório"),
  email: z.string().email("E-mail inválido"),
  perfil: z.enum(["admin", "atendente"]),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  confirmarSenha: z.string().optional(),
}).refine((data) => !data.senha || data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type SalonFormValues = z.infer<typeof salonFormSchema>;
type HorarioFormValues = z.infer<typeof horarioFormSchema>;
type UsuarioFormValues = z.infer<typeof usuarioFormSchema>;

export default function Configuracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("salao");
  
  // Buscar informações do salão
  const { data: dadosSalao, isLoading: isLoadingSalao } = useQuery({
    queryKey: ['/api/configuracoes/salao'],
  });
  
  // Buscar horários de funcionamento
  const { data: dadosHorario, isLoading: isLoadingHorario } = useQuery({
    queryKey: ['/api/configuracoes/horario'],
  });
  
  // Buscar usuários
  const { data: usuarios, isLoading: isLoadingUsuarios } = useQuery({
    queryKey: ['/api/usuarios'],
  });
  
  // Formulário para dados do salão
  const salonForm = useForm<SalonFormValues>({
    resolver: zodResolver(salonFormSchema),
    defaultValues: dadosSalao || {
      nome: "Dellas - Cabelo & Pele",
      telefone: "(11) 99999-9999",
      email: "contato@dellas.com.br",
      endereco: "Rua Exemplo, 123",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01234-567",
      cores: {
        primaria: "#ec4899",
        secundaria: "#8b5cf6",
      },
    },
  });
  
  // Formulário para horários de funcionamento
  const horarioForm = useForm<HorarioFormValues>({
    resolver: zodResolver(horarioFormSchema),
    defaultValues: dadosHorario || {
      domingo: { aberto: false, abertura: "", fechamento: "" },
      segunda: { aberto: true, abertura: "09:00", fechamento: "19:00" },
      terca: { aberto: true, abertura: "09:00", fechamento: "19:00" },
      quarta: { aberto: true, abertura: "09:00", fechamento: "19:00" },
      quinta: { aberto: true, abertura: "09:00", fechamento: "19:00" },
      sexta: { aberto: true, abertura: "09:00", fechamento: "19:00" },
      sabado: { aberto: true, abertura: "09:00", fechamento: "17:00" },
    },
  });
  
  // Formulário para novo usuário
  const usuarioForm = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      perfil: "atendente",
      senha: "",
      confirmarSenha: "",
    },
  });
  
  // Mutação para atualizar dados do salão
  const updateSalon = useMutation({
    mutationFn: async (data: SalonFormValues) => {
      return await apiRequest("PATCH", "/api/configuracoes/salao", data);
    },
    onSuccess: () => {
      toast({
        title: "Dados do salão atualizados",
        description: "As informações do salão foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/configuracoes/salao'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar dados",
        description: error.message || "Ocorreu um erro ao salvar as informações.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar horários
  const updateHorario = useMutation({
    mutationFn: async (data: HorarioFormValues) => {
      return await apiRequest("PATCH", "/api/configuracoes/horario", data);
    },
    onSuccess: () => {
      toast({
        title: "Horários atualizados",
        description: "Os horários de funcionamento foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/configuracoes/horario'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar horários",
        description: error.message || "Ocorreu um erro ao salvar os horários.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para criar novo usuário
  const createUsuario = useMutation({
    mutationFn: async (data: UsuarioFormValues) => {
      return await apiRequest("POST", "/api/usuarios", data);
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O novo usuário foi adicionado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/usuarios'] });
      usuarioForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao adicionar o usuário.",
        variant: "destructive",
      });
    },
  });
  
  // Handler para salvar dados do salão
  const onSalonSubmit = (data: SalonFormValues) => {
    updateSalon.mutate(data);
  };
  
  // Handler para salvar horários
  const onHorarioSubmit = (data: HorarioFormValues) => {
    updateHorario.mutate(data);
  };
  
  // Handler para criar novo usuário
  const onUsuarioSubmit = (data: UsuarioFormValues) => {
    createUsuario.mutate(data);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="salao" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Dados do Salão
          </TabsTrigger>
          <TabsTrigger value="horarios" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="salao">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Estabelecimento</CardTitle>
              <CardDescription>
                Configure as informações básicas do seu salão de beleza.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...salonForm}>
                <form onSubmit={salonForm.handleSubmit(onSalonSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={salonForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Salão</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={salonForm.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={salonForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={salonForm.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={salonForm.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={salonForm.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={salonForm.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={salonForm.control}
                      name="cores.primaria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor Primária</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="w-10 h-10 rounded-md border" 
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={salonForm.control}
                      name="cores.secundaria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor Secundária</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <div 
                              className="w-10 h-10 rounded-md border" 
                              style={{ backgroundColor: field.value }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateSalon.isPending}>
                      {updateSalon.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="horarios">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
              <CardDescription>
                Configure os horários em que seu salão estará aberto para atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...horarioForm}>
                <form onSubmit={horarioForm.handleSubmit(onHorarioSubmit)} className="space-y-6">
                  {['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].map((dia) => (
                    <div key={dia} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 sm:col-span-2">
                        <p className="font-medium capitalize">{dia}</p>
                      </div>
                      
                      <div className="col-span-4 sm:col-span-2">
                        <FormField
                          control={horarioForm.control}
                          name={`${dia}.aberto` as any}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {field.value ? "Aberto" : "Fechado"}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-5 sm:col-span-8">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={horarioForm.control}
                            name={`${dia}.abertura` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Abertura</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="time" 
                                    {...field} 
                                    disabled={!horarioForm.watch(`${dia}.aberto` as any)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={horarioForm.control}
                            name={`${dia}.fechamento` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fechamento</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="time" 
                                    {...field} 
                                    disabled={!horarioForm.watch(`${dia}.aberto` as any)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateHorario.isPending}>
                      {updateHorario.isPending ? "Salvando..." : "Salvar Horários"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usuarios">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Usuário</CardTitle>
                <CardDescription>
                  Crie novas contas para funcionários que irão acessar o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...usuarioForm}>
                  <form onSubmit={usuarioForm.handleSubmit(onUsuarioSubmit)} className="space-y-4">
                    <FormField
                      control={usuarioForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={usuarioForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={usuarioForm.control}
                      name="perfil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perfil de Acesso</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um perfil" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="atendente">Atendente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Administradores têm acesso completo ao sistema.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={usuarioForm.control}
                      name="senha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={usuarioForm.control}
                      name="confirmarSenha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={createUsuario.isPending}>
                        {createUsuario.isPending ? "Criando..." : "Criar Usuário"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usuários do Sistema</CardTitle>
                <CardDescription>
                  Gerenciar usuários existentes e seus perfis de acesso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">E-mail</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Perfil</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {isLoadingUsuarios ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                            Carregando usuários...
                          </td>
                        </tr>
                      ) : usuarios?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                            Nenhum usuário encontrado.
                          </td>
                        </tr>
                      ) : (
                        usuarios?.map((usuario: any) => (
                          <tr key={usuario.id}>
                            <td className="px-4 py-3 text-sm font-medium">{usuario.nome}</td>
                            <td className="px-4 py-3 text-sm">{usuario.email}</td>
                            <td className="px-4 py-3 text-sm capitalize">
                              {usuario.perfil === "admin" ? "Administrador" : "Atendente"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Editar</Button>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  Desativar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure como e quando o sistema deve enviar notificações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Lembretes de agendamento</h4>
                    <p className="text-sm text-neutral-500">Notificar clientes sobre seus agendamentos</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Alertas de baixo estoque</h4>
                    <p className="text-sm text-neutral-500">Receber alertas quando produtos estiverem com estoque baixo</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Relatórios semanais</h4>
                    <p className="text-sm text-neutral-500">Receber relatórios semanais por e-mail</p>
                  </div>
                  <Switch checked={false} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Notificações de pagamentos pendentes</h4>
                    <p className="text-sm text-neutral-500">Receber alertas sobre pagamentos não realizados</p>
                  </div>
                  <Switch checked={true} />
                </div>
                
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-medium mb-4">Canais de Comunicação</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <h4 className="text-sm font-medium">E-mail</h4>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <h4 className="text-sm font-medium">WhatsApp</h4>
                      </div>
                      <Switch checked={false} />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <h4 className="text-sm font-medium">SMS</h4>
                      </div>
                      <Switch checked={false} />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Salvar Configurações</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure opções relacionadas à segurança e privacidade do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Autenticação em dois fatores</h4>
                    <p className="text-sm text-neutral-500">Aumenta a segurança das contas de usuários</p>
                  </div>
                  <Switch checked={false} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Log de atividades</h4>
                    <p className="text-sm text-neutral-500">Registrar todas as ações realizadas no sistema</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Tempo de expiração da sessão</h4>
                    <p className="text-sm text-neutral-500">Sessões expiram após período de inatividade</p>
                  </div>
                  <Select defaultValue="60">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="480">8 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-medium mb-4">Política de Senha</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <h4 className="text-sm font-medium">Tamanho mínimo de senha</h4>
                      </div>
                      <Select defaultValue="8">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <h4 className="text-sm font-medium">Exigir caracteres especiais</h4>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <h4 className="text-sm font-medium">Exigir números</h4>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <h4 className="text-sm font-medium">Exigir letras maiúsculas</h4>
                      </div>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Salvar Configurações</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
