import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/StatsCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import AgendamentosTable from "@/components/dashboard/AgendamentosTable";
import TransacoesTable from "@/components/dashboard/TransacoesTable";
import { ptBR } from "date-fns/locale";
import { format, subMonths } from "date-fns";
import { formatMoney } from "@/lib/utils";

export default function Dashboard() {
  const [filtroData, setFiltroData] = useState("hoje");
  
  // Buscar dados do dashboard
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/dashboard'],
  });
  
  // Buscar agendamentos
  const { data: agendamentosHoje, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ['/api/agendamentos/hoje'],
  });
  
  // Buscar transações recentes
  const { data: transacoesRecentes, isLoading: isLoadingTransacoes } = useQuery({
    queryKey: ['/api/transacoes/recentes'],
  });
  
  // Dados para o gráfico de desempenho
  const dadosDesempenho = [
    { name: "Jan", value: 3500 },
    { name: "Fev", value: 4200 },
    { name: "Mar", value: 3100 },
    { name: "Abr", value: 4500 },
    { name: "Mai", value: 3800 },
    { name: "Jun", value: 5200 },
    { name: "Jul", value: 4800 },
    { name: "Ago", value: 5500 },
    { name: "Set", value: 4300 },
    { name: "Out", value: 4900 },
    { name: "Nov", value: 5300, isCurrentMonth: true },
    { name: "Dez", value: 3000 },
  ];
  
  // Dados estatísticos do dashboard
  const statsData = {
    agendamentosHoje: {
      total: dashboardData?.agendamentosHoje.total || 0,
      finalizados: dashboardData?.agendamentosHoje.finalizados || 0,
      agendados: dashboardData?.agendamentosHoje.agendados || 0,
      indicador: dashboardData?.agendamentosHoje.indicador || { value: 12, type: "positive" },
    },
    clientesNovos: {
      total: dashboardData?.clientesNovos.total || 0,
      totalGeral: dashboardData?.clientesNovos.totalGeral || 0,
      indicador: dashboardData?.clientesNovos.indicador || { value: 5, type: "positive" },
    },
    receitaHoje: {
      valor: dashboardData?.receitaHoje.valor || 0,
      meta: dashboardData?.receitaHoje.meta || 0,
      indicador: dashboardData?.receitaHoje.indicador || { value: 8, type: "negative" },
    },
    pagamentosPendentes: {
      valor: dashboardData?.pagamentosPendentes.valor || 0,
      clientes: dashboardData?.pagamentosPendentes.clientes || 0,
      indicador: { value: 3, text: "novos", type: "neutral" },
    },
  };
  
  return (
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-2 md:mb-0">
            Visão Geral
          </h3>
          <div className="flex items-center space-x-3">
            <select 
              className="appearance-none bg-white border border-neutral-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
            >
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
              <option value="30dias">Últimos 30 dias</option>
            </select>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Agendamentos Hoje */}
          <StatsCard 
            title="Agendamentos Hoje" 
            value={statsData.agendamentosHoje.total}
            indicator={statsData.agendamentosHoje.indicador}
            details={
              <>
                <span className="text-neutral-500">{statsData.agendamentosHoje.finalizados} finalizados</span>
                <span className="mx-2 text-neutral-300">•</span>
                <span className="text-neutral-500">{statsData.agendamentosHoje.agendados} agendados</span>
              </>
            }
          />
          
          {/* Clientes Novos */}
          <StatsCard 
            title="Clientes Novos (Mês)" 
            value={statsData.clientesNovos.total}
            indicator={statsData.clientesNovos.indicador}
            details={
              <span className="text-neutral-500">Total: {statsData.clientesNovos.totalGeral} clientes</span>
            }
          />
          
          {/* Receita Diária */}
          <StatsCard 
            title="Receita Hoje" 
            value={statsData.receitaHoje.valor}
            variant="money"
            indicator={statsData.receitaHoje.indicador}
            details={
              <span className="text-neutral-500">Meta: {formatMoney(statsData.receitaHoje.meta)}</span>
            }
          />
          
          {/* Pagamentos Pendentes */}
          <StatsCard 
            title="Pagamentos Pendentes" 
            value={statsData.pagamentosPendentes.valor}
            variant="money"
            indicator={statsData.pagamentosPendentes.indicador}
            details={
              <span className="text-neutral-500">{statsData.pagamentosPendentes.clientes} clientes</span>
            }
          />
        </div>
        
        {/* Performance Chart */}
        <PerformanceChart 
          data={dadosDesempenho} 
          title="Desempenho Mensal"
        />
      </div>
      
      {/* Agendamentos do Dia */}
      <AgendamentosTable 
        agendamentos={agendamentosHoje || []} 
        titulo="Agendamentos de Hoje"
        paginacao={{
          total: agendamentosHoje?.length || 0,
          atual: 1,
          anterior: () => {},
          proxima: () => {},
        }}
      />
      
      {/* Transações Recentes */}
      <TransacoesTable 
        transacoes={transacoesRecentes || []} 
        titulo="Transações Recentes"
        paginacao={{
          total: transacoesRecentes?.length || 0,
          atual: 1,
          anterior: () => {},
          proxima: () => {},
        }}
      />
    </div>
  );
}
