import { pgTable, text, uuid, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Clientes
export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  telefone: text("telefone"),
  email: text("email"),
  observacoes: text("observacoes"),
  data_cadastro: timestamp("data_cadastro").defaultNow()
});

export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  data_cadastro: true
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;

// Serviços
export const servicos = pgTable("servicos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  duracao: integer("duracao").notNull(), // em minutos
  descricao: text("descricao"),
  categoria: text("categoria"),
  data_cadastro: timestamp("data_cadastro").defaultNow()
});

export const insertServicoSchema = createInsertSchema(servicos).omit({
  id: true,
  data_cadastro: true
});

export type Servico = typeof servicos.$inferSelect;
export type InsertServico = z.infer<typeof insertServicoSchema>;

// Agendamentos
export const agendamentos = pgTable("agendamentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  cliente_id: uuid("cliente_id").references(() => clientes.id),
  data_hora_inicio: timestamp("data_hora_inicio").notNull(),
  data_hora_fim: timestamp("data_hora_fim").notNull(),
  status: text("status").notNull().default("agendado"), // agendado, cancelado, finalizado, pagamento_pendente
  observacoes: text("observacoes"),
  preco_final: decimal("preco_final", { precision: 10, scale: 2 }),
  data_pagamento: timestamp("data_pagamento"),
  status_pagamento: text("status_pagamento"), // pago, pendente
  metodo_pagamento: text("metodo_pagamento"),
  data_cadastro: timestamp("data_cadastro").defaultNow()
});

export const insertAgendamentoSchema = createInsertSchema(agendamentos).omit({
  id: true,
  data_cadastro: true
});

export type Agendamento = typeof agendamentos.$inferSelect;
export type InsertAgendamento = z.infer<typeof insertAgendamentoSchema>;

// Agendamento Serviços (relação muitos para muitos)
export const agendamento_servicos = pgTable("agendamento_servicos", {
  id: uuid("id").primaryKey().defaultRandom(),
  agendamento_id: uuid("agendamento_id").references(() => agendamentos.id).notNull(),
  servico_id: uuid("servico_id").references(() => servicos.id).notNull(),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  preco_final: decimal("preco_final", { precision: 10, scale: 2 })
});

export const insertAgendamentoServicoSchema = createInsertSchema(agendamento_servicos).omit({
  id: true
});

export type AgendamentoServico = typeof agendamento_servicos.$inferSelect;
export type InsertAgendamentoServico = z.infer<typeof insertAgendamentoServicoSchema>;

// Estoque
export const estoque = pgTable("estoque", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  quantidade: integer("quantidade").default(0),
  preco_custo: decimal("preco_custo", { precision: 10, scale: 2 }),
  preco_venda: decimal("preco_venda", { precision: 10, scale: 2 }),
  categoria: text("categoria"),
  data_cadastro: timestamp("data_cadastro").defaultNow()
});

export const insertEstoqueSchema = createInsertSchema(estoque).omit({
  id: true,
  data_cadastro: true
});

export type Estoque = typeof estoque.$inferSelect;
export type InsertEstoque = z.infer<typeof insertEstoqueSchema>;

// Transações Financeiras
export const transacoes_financeiras = pgTable("transacoes_financeiras", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: text("tipo").notNull(), // entrada, saida
  data_transacao: timestamp("data_transacao").notNull(),
  descricao: text("descricao").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  categoria: text("categoria"),
  metodo_pagamento: text("metodo_pagamento"),
  agendamento_id: uuid("agendamento_id").references(() => agendamentos.id),
  data_cadastro: timestamp("data_cadastro").defaultNow()
});

export const insertTransacaoFinanceiraSchema = createInsertSchema(transacoes_financeiras).omit({
  id: true,
  data_cadastro: true
});

export type TransacaoFinanceira = typeof transacoes_financeiras.$inferSelect;
export type InsertTransacaoFinanceira = z.infer<typeof insertTransacaoFinanceiraSchema>;

// Usuários
export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha_hash: text("senha_hash").notNull(),
  perfil: text("perfil").notNull(), // admin, atendente
  ativo: boolean("ativo").default(true),
  data_cadastro: timestamp("data_cadastro").defaultNow()
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({
  id: true,
  senha_hash: true,
  data_cadastro: true
}).extend({
  senha: z.string().min(6)
});

export type Usuario = typeof usuarios.$inferSelect;
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
