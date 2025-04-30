import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { z } from "zod";
import { 
  insertClienteSchema, 
  insertServicoSchema, 
  insertAgendamentoSchema,
  insertAgendamentoServicoSchema,
  insertEstoqueSchema,
  insertTransacaoFinanceiraSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return res.status(401).json({ message: error.message });
      }
      
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('nome, perfil')
        .eq('email', email)
        .single();
        
      if (userError) {
        return res.status(500).json({ message: userError.message });
      }
      
      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          nome: userData.nome,
          perfil: userData.perfil,
        },
        session: data.session,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.json({ message: 'Logout efetuado com sucesso' });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Clientes routes
  app.get('/api/clientes', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/clientes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/clientes/detalhes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar cliente base
      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      // Buscar agendamentos do cliente
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('id, data_hora_inicio, data_hora_fim, status, preco_final')
        .eq('cliente_id', id)
        .order('data_hora_inicio', { ascending: false });
        
      if (agendamentosError) {
        return res.status(500).json({ message: agendamentosError.message });
      }
      
      // Calcular total gasto
      const valorGasto = agendamentos
        .filter(a => a.status === 'finalizado')
        .reduce((sum, a) => sum + (a.preco_final || 0), 0);
      
      // Serviços mais utilizados
      const { data: servicosFrequentes, error: servicosError } = await supabase.rpc(
        'servicos_mais_utilizados_por_cliente',
        { cliente_id_param: id, limite: 5 }
      );
      
      const detalhes = {
        ...cliente,
        agendamentos_total: agendamentos.length,
        valor_gasto: valorGasto,
        ultima_visita: agendamentos.length > 0 ? agendamentos[0].data_hora_inicio : null,
        servicos_frequentes: servicosFrequentes || []
      };
      
      res.json(detalhes);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post('/api/clientes', async (req, res) => {
    try {
      const clienteData = insertClienteSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('clientes')
        .insert(clienteData)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(201).json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/clientes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const clienteData = insertClienteSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.delete('/api/clientes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se existem agendamentos para este cliente
      const { data: agendamentos, error: checkError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('cliente_id', id);
        
      if (checkError) {
        return res.status(500).json({ message: checkError.message });
      }
      
      if (agendamentos && agendamentos.length > 0) {
        return res.status(400).json({ 
          message: 'Não é possível excluir o cliente pois existem agendamentos vinculados' 
        });
      }
      
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Serviços routes
  app.get('/api/servicos', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome');
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/servicos/categorias', async (req, res) => {
    try {
      // Return static categories list
      const categorias = [
        { value: "cabelo", label: "Cabelo" },
        { value: "pele", label: "Pele" },
        { value: "manicure", label: "Manicure/Pedicure" },
        { value: "maquiagem", label: "Maquiagem" },
        { value: "depilacao", label: "Depilação" },
        { value: "massagem", label: "Massagem" },
        { value: "outro", label: "Outro" },
      ];
      
      res.json(categorias);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/servicos/estatisticas', async (req, res) => {
    try {
      // TODO: Implement real statistics
      const estatisticas = {
        servicos_populares: [
          { nome: "Corte Feminino", quantidade: 120 },
          { nome: "Coloração", quantidade: 95 },
          { nome: "Manicure", quantidade: 85 },
          { nome: "Escova", quantidade: 75 },
          { nome: "Design de Sobrancelhas", quantidade: 65 },
        ],
        total_servicos: 530,
        crescimento_mes: 8.5
      };
      
      res.json(estatisticas);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post('/api/servicos', async (req, res) => {
    try {
      const servicoData = insertServicoSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('servicos')
        .insert(servicoData)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(201).json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/servicos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const servicoData = insertServicoSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('servicos')
        .update(servicoData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.delete('/api/servicos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se existem agendamentos para este serviço
      const { data: agendamentos, error: checkError } = await supabase
        .from('agendamento_servicos')
        .select('id')
        .eq('servico_id', id);
        
      if (checkError) {
        return res.status(500).json({ message: checkError.message });
      }
      
      if (agendamentos && agendamentos.length > 0) {
        return res.status(400).json({ 
          message: 'Não é possível excluir o serviço pois existem agendamentos vinculados' 
        });
      }
      
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Agendamentos routes
  app.get('/api/agendamentos', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:cliente_id (id, nome, telefone),
          servicos:agendamento_servicos (
            servico:servico_id (id, nome, duracao)
          )
        `)
        .order('data_hora_inicio', { ascending: false });
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      // Format data for client
      const formattedData = data.map(a => ({
        ...a,
        servicos: a.servicos.map((s: any) => s.servico)
      }));
      
      res.json(formattedData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/agendamentos/hoje', async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:cliente_id (id, nome, telefone),
          servicos:agendamento_servicos (
            servico:servico_id (id, nome, duracao)
          )
        `)
        .gte('data_hora_inicio', startOfDay)
        .lte('data_hora_inicio', endOfDay)
        .order('data_hora_inicio');
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      // Format data for client
      const formattedData = data.map(a => ({
        ...a,
        servicos: a.servicos.map((s: any) => s.servico)
      }));
      
      res.json(formattedData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/agendamentos/pendentes', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:cliente_id (id, nome, telefone)
        `)
        .eq('status', 'pagamento_pendente')
        .order('data_hora_inicio', { ascending: false });
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post('/api/agendamentos', async (req, res) => {
    try {
      const { servicos, ...agendamentoData } = req.body;
      
      // Validar dados do agendamento
      const validatedAgendamento = insertAgendamentoSchema.parse(agendamentoData);
      
      // Iniciar uma transação para garantir a integridade dos dados
      const { data: agendamento, error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert(validatedAgendamento)
        .select()
        .single();
        
      if (agendamentoError) {
        return res.status(400).json({ message: agendamentoError.message });
      }
      
      // Vincular serviços ao agendamento
      if (servicos && servicos.length > 0) {
        const agendamentoServicos = servicos.map((s: any) => ({
          agendamento_id: agendamento.id,
          servico_id: s.servico_id,
          preco: s.preco,
          preco_final: s.preco // Usar o mesmo valor inicialmente
        }));
        
        const { error: servicosError } = await supabase
          .from('agendamento_servicos')
          .insert(agendamentoServicos);
          
        if (servicosError) {
          return res.status(400).json({ message: servicosError.message });
        }
      }
      
      res.status(201).json(agendamento);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/agendamentos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { servicos, ...agendamentoData } = req.body;
      
      // Validar dados do agendamento
      const validatedAgendamento = insertAgendamentoSchema.partial().parse(agendamentoData);
      
      // Atualizar agendamento
      const { data: agendamento, error: agendamentoError } = await supabase
        .from('agendamentos')
        .update(validatedAgendamento)
        .eq('id', id)
        .select()
        .single();
        
      if (agendamentoError) {
        return res.status(400).json({ message: agendamentoError.message });
      }
      
      // Se existirem serviços, atualizar
      if (servicos && servicos.length > 0) {
        // Remover serviços atuais
        const { error: deleteError } = await supabase
          .from('agendamento_servicos')
          .delete()
          .eq('agendamento_id', id);
          
        if (deleteError) {
          return res.status(400).json({ message: deleteError.message });
        }
        
        // Adicionar novos serviços
        const agendamentoServicos = servicos.map((s: any) => ({
          agendamento_id: id,
          servico_id: s.servico_id,
          preco: s.preco,
          preco_final: s.preco // Usar o mesmo valor inicialmente
        }));
        
        const { error: servicosError } = await supabase
          .from('agendamento_servicos')
          .insert(agendamentoServicos);
          
        if (servicosError) {
          return res.status(400).json({ message: servicosError.message });
        }
      }
      
      res.json(agendamento);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/agendamentos/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['agendado', 'cancelado', 'finalizado', 'pagamento_pendente'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido' });
      }
      
      const { data, error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/agendamentos/:id/pagamento', async (req, res) => {
    try {
      const { id } = req.params;
      const { metodo_pagamento, data_pagamento } = req.body;
      
      const agendamentoData = {
        status: 'finalizado',
        status_pagamento: 'pago',
        metodo_pagamento,
        data_pagamento: data_pagamento || new Date().toISOString()
      };
      
      // Atualizar agendamento
      const { data: agendamento, error: agendamentoError } = await supabase
        .from('agendamentos')
        .update(agendamentoData)
        .eq('id', id)
        .select()
        .single();
        
      if (agendamentoError) {
        return res.status(400).json({ message: agendamentoError.message });
      }
      
      // Criar transação financeira
      const transacaoData = {
        tipo: 'entrada',
        data_transacao: data_pagamento || new Date().toISOString(),
        descricao: `Pagamento do agendamento #${id}`,
        valor: agendamento.preco_final,
        categoria: 'servico',
        metodo_pagamento,
        agendamento_id: id
      };
      
      const { error: transacaoError } = await supabase
        .from('transacoes_financeiras')
        .insert(transacaoData);
        
      if (transacaoError) {
        return res.status(400).json({ message: transacaoError.message });
      }
      
      res.json(agendamento);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.delete('/api/agendamentos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Remover serviços vinculados
      const { error: servicosError } = await supabase
        .from('agendamento_servicos')
        .delete()
        .eq('agendamento_id', id);
        
      if (servicosError) {
        return res.status(400).json({ message: servicosError.message });
      }
      
      // Remover transações vinculadas
      const { error: transacoesError } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('agendamento_id', id);
        
      if (transacoesError) {
        return res.status(400).json({ message: transacoesError.message });
      }
      
      // Remover agendamento
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Estoque routes
  app.get('/api/estoque', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('nome');
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/estoque/baixo', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .lte('quantidade', 5)
        .order('quantidade');
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/estoque/categorias', async (req, res) => {
    try {
      // Return static categories list
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
      
      res.json(categorias);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/estoque/movimentacao', async (req, res) => {
    try {
      // TODO: implement real movimentação estoque
      const movimentacao = [
        {
          id: '1',
          data: '10/12/2023 14:30',
          produto: 'Shampoo Hidratante',
          tipo: 'entrada',
          quantidade: 10,
          responsavel: 'Maria Lima'
        },
        {
          id: '2',
          data: '09/12/2023 10:15',
          produto: 'Esmalte Vermelho',
          tipo: 'saida',
          quantidade: 2,
          responsavel: 'Ana Silva'
        },
        {
          id: '3',
          data: '08/12/2023 16:45',
          produto: 'Condicionador Reparador',
          tipo: 'entrada',
          quantidade: 5,
          responsavel: 'Maria Lima'
        }
      ];
      
      res.json(movimentacao);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post('/api/estoque', async (req, res) => {
    try {
      const produtoData = insertEstoqueSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('estoque')
        .insert(produtoData)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(201).json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/estoque/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const produtoData = insertEstoqueSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('estoque')
        .update(produtoData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/estoque/:id/ajustar', async (req, res) => {
    try {
      const { id } = req.params;
      const { quantidade, tipo } = req.body;
      
      if (!['entrada', 'saida'].includes(tipo)) {
        return res.status(400).json({ message: 'Tipo de movimentação inválido' });
      }
      
      if (quantidade <= 0) {
        return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
      }
      
      // Buscar produto atual
      const { data: produto, error: findError } = await supabase
        .from('estoque')
        .select('quantidade')
        .eq('id', id)
        .single();
        
      if (findError) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      
      // Calcular nova quantidade
      let novaQuantidade = produto.quantidade;
      
      if (tipo === 'entrada') {
        novaQuantidade += quantidade;
      } else {
        novaQuantidade = Math.max(0, novaQuantidade - quantidade);
      }
      
      // Atualizar estoque
      const { data, error } = await supabase
        .from('estoque')
        .update({ quantidade: novaQuantidade })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.delete('/api/estoque/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('estoque')
        .delete()
        .eq('id', id);
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Finanças routes
  app.get('/api/transacoes', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          agendamento:agendamento_id (
            cliente_id (id, nome)
          )
        `)
        .order('data_transacao', { ascending: false });
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      // Mapear métodos de pagamento e categorias
      const formattedData = data.map(t => {
        let metodo_pagamento_nome = t.metodo_pagamento;
        let categoria_nome = t.categoria;
        
        // Mapear método de pagamento
        switch (t.metodo_pagamento) {
          case 'dinheiro':
            metodo_pagamento_nome = 'Dinheiro';
            break;
          case 'cartao_credito':
            metodo_pagamento_nome = 'Cartão de Crédito';
            break;
          case 'cartao_debito':
            metodo_pagamento_nome = 'Cartão de Débito';
            break;
          case 'pix':
            metodo_pagamento_nome = 'PIX';
            break;
          case 'transferencia':
            metodo_pagamento_nome = 'Transferência';
            break;
          case 'boleto':
            metodo_pagamento_nome = 'Boleto';
            break;
        }
        
        // Mapear categoria
        switch (t.categoria) {
          case 'servico':
            categoria_nome = 'Serviço';
            break;
          case 'venda':
            categoria_nome = 'Venda de Produtos';
            break;
          case 'estoque':
            categoria_nome = 'Compra de Estoque';
            break;
          case 'equipamento':
            categoria_nome = 'Equipamentos';
            break;
          case 'aluguel':
            categoria_nome = 'Aluguel';
            break;
          case 'energia':
            categoria_nome = 'Energia Elétrica';
            break;
          case 'agua':
            categoria_nome = 'Água';
            break;
          case 'internet':
            categoria_nome = 'Internet/Telefone';
            break;
          case 'salario':
            categoria_nome = 'Salários';
            break;
          case 'marketing':
            categoria_nome = 'Marketing';
            break;
          case 'despesa_fixa':
            categoria_nome = 'Despesa Fixa';
            break;
          case 'outro':
            categoria_nome = 'Outro';
            break;
        }
        
        return {
          ...t,
          metodo_pagamento_nome,
          categoria_nome
        };
      });
      
      res.json(formattedData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/transacoes/recentes', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          agendamento:agendamento_id (
            cliente_id (id, nome)
          )
        `)
        .order('data_transacao', { ascending: false })
        .limit(5);
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      // Mapear métodos de pagamento e categorias
      const formattedData = data.map(t => {
        let metodo_pagamento_nome = t.metodo_pagamento;
        let categoria_nome = t.categoria;
        
        // Mapear método de pagamento
        switch (t.metodo_pagamento) {
          case 'dinheiro':
            metodo_pagamento_nome = 'Dinheiro';
            break;
          case 'cartao_credito':
            metodo_pagamento_nome = 'Cartão de Crédito';
            break;
          case 'cartao_debito':
            metodo_pagamento_nome = 'Cartão de Débito';
            break;
          case 'pix':
            metodo_pagamento_nome = 'PIX';
            break;
          case 'transferencia':
            metodo_pagamento_nome = 'Transferência';
            break;
          case 'boleto':
            metodo_pagamento_nome = 'Boleto';
            break;
        }
        
        // Mapear categoria
        switch (t.categoria) {
          case 'servico':
            categoria_nome = 'Serviço';
            break;
          case 'venda':
            categoria_nome = 'Venda de Produtos';
            break;
          case 'estoque':
            categoria_nome = 'Compra de Estoque';
            break;
          case 'equipamento':
            categoria_nome = 'Equipamentos';
            break;
          case 'aluguel':
            categoria_nome = 'Aluguel';
            break;
          case 'energia':
            categoria_nome = 'Energia Elétrica';
            break;
          case 'agua':
            categoria_nome = 'Água';
            break;
          case 'internet':
            categoria_nome = 'Internet/Telefone';
            break;
          case 'salario':
            categoria_nome = 'Salários';
            break;
          case 'marketing':
            categoria_nome = 'Marketing';
            break;
          case 'despesa_fixa':
            categoria_nome = 'Despesa Fixa';
            break;
          case 'outro':
            categoria_nome = 'Outro';
            break;
        }
        
        return {
          ...t,
          metodo_pagamento_nome,
          categoria_nome
        };
      });
      
      res.json(formattedData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/transacoes/categorias', async (req, res) => {
    try {
      // Retornar categorias estáticas
      const categorias = [
        { value: "servico", label: "Serviço" },
        { value: "venda", label: "Venda de Produtos" },
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
      
      res.json(categorias);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post('/api/transacoes', async (req, res) => {
    try {
      const transacaoData = insertTransacaoFinanceiraSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .insert(transacaoData)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      // Se a transação estiver vinculada a um agendamento, atualizar status
      if (transacaoData.agendamento_id && transacaoData.tipo === 'entrada') {
        const { error: updateError } = await supabase
          .from('agendamentos')
          .update({
            status: 'finalizado',
            status_pagamento: 'pago',
            metodo_pagamento: transacaoData.metodo_pagamento,
            data_pagamento: transacaoData.data_transacao
          })
          .eq('id', transacaoData.agendamento_id);
          
        if (updateError) {
          return res.status(400).json({ message: updateError.message });
        }
      }
      
      res.status(201).json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.patch('/api/transacoes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const transacaoData = insertTransacaoFinanceiraSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .update(transacaoData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: err.message });
    }
  });
  
  app.delete('/api/transacoes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('id', id);
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/financas/resumo', async (req, res) => {
    try {
      const periodo = req.query.periodo || 'mes';
      
      // TODO: implement real resumo based on period
      const resumo = {
        receita: 8500,
        despesas: 3200,
        pendente: 620,
      };
      
      res.json(resumo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Dashboard data
  app.get('/api/dashboard', async (req, res) => {
    try {
      // TODO: implement real dashboard data
      const dashboardData = {
        agendamentosHoje: {
          total: 8,
          finalizados: 2,
          agendados: 6,
          indicador: { value: 12, type: "positive" }
        },
        clientesNovos: {
          total: 14,
          totalGeral: 189,
          indicador: { value: 5, type: "positive" }
        },
        receitaHoje: {
          valor: 380,
          meta: 500,
          indicador: { value: 8, type: "negative" }
        },
        pagamentosPendentes: {
          valor: 620,
          clientes: 5,
          indicador: { value: 3, text: "novos", type: "neutral" }
        }
      };
      
      res.json(dashboardData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Relatórios routes
  app.get('/api/relatorios', async (req, res) => {
    try {
      const { tipo, periodo, dataInicio, dataFim } = req.query;
      
      // TODO: implement real reports based on parameters
      const data = {
        tipo,
        periodo,
        dataInicio,
        dataFim,
        resultado: {
          // Dados fictícios para o relatório
        }
      };
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Configurações routes
  app.get('/api/configuracoes/salao', async (req, res) => {
    try {
      // TODO: implement real salon settings
      const configuracoes = {
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
      };
      
      res.json(configuracoes);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get('/api/configuracoes/horario', async (req, res) => {
    try {
      // TODO: implement real working hours settings
      const horarios = {
        domingo: { aberto: false, abertura: "", fechamento: "" },
        segunda: { aberto: true, abertura: "09:00", fechamento: "19:00" },
        terca: { aberto: true, abertura: "09:00", fechamento: "19:00" },
        quarta: { aberto: true, abertura: "09:00", fechamento: "19:00" },
        quinta: { aberto: true, abertura: "09:00", fechamento: "19:00" },
        sexta: { aberto: true, abertura: "09:00", fechamento: "19:00" },
        sabado: { aberto: true, abertura: "09:00", fechamento: "17:00" },
      };
      
      res.json(horarios);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Usuários routes
  app.get('/api/usuarios', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, perfil, ativo')
        .order('nome');
        
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post('/api/usuarios', async (req, res) => {
    try {
      const { nome, email, perfil, senha } = req.body;
      
      // Criar usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
      });
      
      if (authError) {
        return res.status(400).json({ message: authError.message });
      }
      
      // Criar usuário na tabela personalizada
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user!.id,
          nome,
          email,
          perfil,
          senha_hash: 'não armazenada', // Não armazenamos a senha em texto puro
        })
        .select()
        .single();
        
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
