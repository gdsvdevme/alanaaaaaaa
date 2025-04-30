import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, LineChart, Calendar, UserCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/lib/utils";

export default function Relatorios() {
  const [filtroRelatorio, setFiltroRelatorio] = useState("mensal");
  const [filtroData, setFiltroData] = useState<Date>(new Date());
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("30dias");
  
  // Buscar dados dos relatórios
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['/api/relatorios', filtroRelatorio, format(filtroData, 'yyyy-MM-dd'), filtroPeriodo],
  });
  
  // Dados para os gráficos
  const dadosFinanceiro = [
    { name: "Jan", receita: 5800, despesa: 3200, lucro: 2600 },
    { name: "Fev", receita: 6300, despesa: 3500, lucro: 2800 },
    { name: "Mar", receita: 5400, despesa: 3100, lucro: 2300 },
    { name: "Abr", receita: 7100, despesa: 4200, lucro: 2900 },
    { name: "Mai", receita: 6700, despesa: 3900, lucro: 2800 },
    { name: "Jun", receita: 7800, despesa: 4500, lucro: 3300 },
    { name: "Jul", receita: 7200, despesa: 4300, lucro: 2900 },
    { name: "Ago", receita: 8400, despesa: 4900, lucro: 3500 },
    { name: "Set", receita: 7600, despesa: 4600, lucro: 3000 },
    { name: "Out", receita: 8100, despesa: 4800, lucro: 3300 },
    { name: "Nov", receita: 9200, despesa: 5100, lucro: 4100 },
    { name: "Dez", receita: 0, despesa: 0, lucro: 0 },
  ];
  
  const dadosServicos = [
    { name: "Corte Feminino", value: 32 },
    { name: "Coloração", value: 24 },
    { name: "Hidratação", value: 18 },
    { name: "Manicure", value: 14 },
    { name: "Pedicure", value: 12 },
  ];
  
  const dadosClientes = [
    { name: "Jan", novos: 12, recorrentes: 45 },
    { name: "Fev", novos: 15, recorrentes: 48 },
    { name: "Mar", novos: 10, recorrentes: 50 },
    { name: "Abr", novos: 18, recorrentes: 52 },
    { name: "Mai", novos: 14, recorrentes: 55 },
    { name: "Jun", novos: 20, recorrentes: 58 },
    { name: "Jul", novos: 16, recorrentes: 60 },
    { name: "Ago", novos: 24, recorrentes: 62 },
    { name: "Set", novos: 18, recorrentes: 64 },
    { name: "Out", novos: 22, recorrentes: 65 },
    { name: "Nov", novos: 26, recorrentes: 68 },
    { name: "Dez", novos: 0, recorrentes: 0 },
  ];
  
  const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 shadow-sm rounded-md">
          <p className="text-neutral-800 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.dataKey === 'value' 
                ? `${entry.value}%` 
                : formatMoney(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const handleExportarRelatorio = () => {
    // Implementar exportação do relatório para CSV ou PDF
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <Button onClick={handleExportarRelatorio}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="tipoRelatorio" className="text-sm font-medium">
                Tipo de Relatório
              </label>
              <Select
                value={filtroRelatorio}
                onValueChange={setFiltroRelatorio}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="periodo" className="text-sm font-medium">
                Período
              </label>
              <Select
                value={filtroPeriodo}
                onValueChange={setFiltroPeriodo}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                  <SelectItem value="ano">Este ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label className="text-sm font-medium">
                Data de Referência
              </label>
              <DatePicker
                date={filtroData}
                setDate={setFiltroData}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="financeiro">
        <TabsList className="mb-4">
          <TabsTrigger value="financeiro" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="servicos" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center">
            <UserCheck className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Agendamentos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Receita Total</p>
                  <p className="text-2xl font-semibold text-green-600">{formatMoney(65800)}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Despesas Totais</p>
                  <p className="text-2xl font-semibold text-red-600">{formatMoney(38500)}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Lucro</p>
                  <p className="text-2xl font-semibold text-primary">{formatMoney(27300)}</p>
                </div>
              </div>
              
              <div className="h-80 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={dadosFinanceiro}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis 
                      width={80}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" />
                    <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" />
                    <Bar dataKey="lucro" name="Lucro" fill="hsl(var(--chart-3))" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Período</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Receita</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Despesa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Lucro</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {dadosFinanceiro.slice(0, 11).map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{formatMoney(item.receita)}</td>
                        <td className="px-4 py-3 text-sm text-red-600">{formatMoney(item.despesa)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatMoney(item.lucro)}</td>
                        <td className="px-4 py-3 text-sm">
                          {((item.lucro / item.receita) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="servicos">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={dadosServicos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dadosServicos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Serviços Mais Realizados</h3>
                  <div className="space-y-2">
                    {dadosServicos.map((servico, index) => (
                      <div key={index} className="bg-neutral-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{servico.name}</span>
                          <span className="text-primary">{servico.value}%</span>
                        </div>
                        <div className="mt-2 w-full bg-neutral-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${servico.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Total de Clientes</p>
                  <p className="text-2xl font-semibold text-neutral-900">189</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Novos Clientes (Mês)</p>
                  <p className="text-2xl font-semibold text-primary">26</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Taxa de Retenção</p>
                  <p className="text-2xl font-semibold text-green-600">78%</p>
                </div>
              </div>
              
              <div className="h-80 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={dadosClientes}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis 
                      width={40}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="novos" 
                      name="Novos Clientes" 
                      stroke="hsl(var(--primary))" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recorrentes" 
                      name="Clientes Recorrentes" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Clientes mais frequentes</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Visitas</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Valor Gasto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Última Visita</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium">Carolina Santos</td>
                        <td className="px-4 py-3 text-sm">18</td>
                        <td className="px-4 py-3 text-sm">{formatMoney(2450)}</td>
                        <td className="px-4 py-3 text-sm">12/11/2023</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium">Juliana Almeida</td>
                        <td className="px-4 py-3 text-sm">15</td>
                        <td className="px-4 py-3 text-sm">{formatMoney(1980)}</td>
                        <td className="px-4 py-3 text-sm">18/11/2023</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium">Renata Ferreira</td>
                        <td className="px-4 py-3 text-sm">12</td>
                        <td className="px-4 py-3 text-sm">{formatMoney(1740)}</td>
                        <td className="px-4 py-3 text-sm">15/11/2023</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium">Amanda Barros</td>
                        <td className="px-4 py-3 text-sm">10</td>
                        <td className="px-4 py-3 text-sm">{formatMoney(1320)}</td>
                        <td className="px-4 py-3 text-sm">05/11/2023</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium">Márcia Silva</td>
                        <td className="px-4 py-3 text-sm">8</td>
                        <td className="px-4 py-3 text-sm">{formatMoney(980)}</td>
                        <td className="px-4 py-3 text-sm">20/11/2023</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agendamentos">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Total de Agendamentos</p>
                  <p className="text-2xl font-semibold text-neutral-900">245</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Finalizados</p>
                  <p className="text-2xl font-semibold text-green-600">220</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Cancelados</p>
                  <p className="text-2xl font-semibold text-red-600">15</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-500">Taxa de Conversão</p>
                  <p className="text-2xl font-semibold text-primary">89.8%</p>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Finalizados</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cancelados</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Taxa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium">Novembro/2023</td>
                      <td className="px-4 py-3 text-sm">85</td>
                      <td className="px-4 py-3 text-sm text-green-600">78</td>
                      <td className="px-4 py-3 text-sm text-red-600">5</td>
                      <td className="px-4 py-3 text-sm">91.8%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium">Outubro/2023</td>
                      <td className="px-4 py-3 text-sm">76</td>
                      <td className="px-4 py-3 text-sm text-green-600">70</td>
                      <td className="px-4 py-3 text-sm text-red-600">4</td>
                      <td className="px-4 py-3 text-sm">92.1%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium">Setembro/2023</td>
                      <td className="px-4 py-3 text-sm">72</td>
                      <td className="px-4 py-3 text-sm text-green-600">65</td>
                      <td className="px-4 py-3 text-sm text-red-600">6</td>
                      <td className="px-4 py-3 text-sm">90.3%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
