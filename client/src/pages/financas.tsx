import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, CreditCard, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TransacaoForm } from "@/components/financas/TransacaoForm";
import TransacoesList from "@/components/financas/TransacoesList";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatMoney } from "@/lib/utils";

export default function Financas() {
  const [showForm, setShowForm] = useState(false);
  const [periodo, setPeriodo] = useState("mes");
  
  // Buscar resumo financeiro
  const { data: resumoFinanceiro } = useQuery({
    queryKey: ['/api/financas/resumo', periodo],
  });
  
  // Dados para o gráfico de receitas e despesas
  const dadosFinanceiros = [
    { name: "Jan", receita: 5800, despesa: 3200 },
    { name: "Fev", receita: 6300, despesa: 3500 },
    { name: "Mar", receita: 5400, despesa: 3100 },
    { name: "Abr", receita: 7100, despesa: 4200 },
    { name: "Mai", receita: 6700, despesa: 3900 },
    { name: "Jun", receita: 7800, despesa: 4500 },
    { name: "Jul", receita: 7200, despesa: 4300 },
    { name: "Ago", receita: 8400, despesa: 4900 },
    { name: "Set", receita: 7600, despesa: 4600 },
    { name: "Out", receita: 8100, despesa: 4800 },
    { name: "Nov", receita: 9200, despesa: 5100 },
    { name: "Dez", receita: 0, despesa: 0 }, // Mês futuro
  ];
  
  // Dados para o gráfico de categorias
  const dadosCategorias = [
    { name: "Cabelo", value: 45 },
    { name: "Pele", value: 25 },
    { name: "Manicure", value: 15 },
    { name: "Maquiagem", value: 10 },
    { name: "Outros", value: 5 },
  ];
  
  const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 shadow-sm rounded-md">
          <p className="text-neutral-800 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${formatMoney(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Gestão Financeira</h1>
        <Button onClick={() => setShowForm(true)}>
          <DollarSign className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>
      
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Receita Total ({periodo === "mes" ? "Mês" : "Ano"})</p>
                <h3 className="text-2xl font-semibold text-green-600 mt-1">
                  {formatMoney(resumoFinanceiro?.receita || 0)}
                </h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Despesas ({periodo === "mes" ? "Mês" : "Ano"})</p>
                <h3 className="text-2xl font-semibold text-red-600 mt-1">
                  {formatMoney(resumoFinanceiro?.despesas || 0)}
                </h3>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Lucro ({periodo === "mes" ? "Mês" : "Ano"})</p>
                <h3 className="text-2xl font-semibold text-primary mt-1">
                  {formatMoney((resumoFinanceiro?.receita || 0) - (resumoFinanceiro?.despesas || 0))}
                </h3>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Pendente a Receber</p>
                <h3 className="text-2xl font-semibold text-amber-600 mt-1">
                  {formatMoney(resumoFinanceiro?.pendente || 0)}
                </h3>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos e Listagem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Receitas x Despesas</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant={periodo === "mes" ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setPeriodo("mes")}
                >
                  Mês
                </Button>
                <Button 
                  variant={periodo === "ano" ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setPeriodo("ano")}
                >
                  Ano
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosFinanceiros}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${value}`} 
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    name="Receita"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesa"
                    name="Despesa"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Receita por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosCategorias}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosCategorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="todas">
        <TabsList className="mb-4">
          <TabsTrigger value="todas" className="flex items-center">
            Todas as Transações
          </TabsTrigger>
          <TabsTrigger value="receitas" className="flex items-center">
            Receitas
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center">
            Despesas
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="flex items-center">
            Pendentes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="todas">
          <TransacoesList 
            onOpenForm={() => setShowForm(true)} 
            filtro="todas"
          />
        </TabsContent>
        
        <TabsContent value="receitas">
          <TransacoesList 
            onOpenForm={() => setShowForm(true)} 
            filtro="receitas"
          />
        </TabsContent>
        
        <TabsContent value="despesas">
          <TransacoesList 
            onOpenForm={() => setShowForm(true)} 
            filtro="despesas"
          />
        </TabsContent>
        
        <TabsContent value="pendentes">
          <TransacoesList 
            onOpenForm={() => setShowForm(true)} 
            filtro="pendentes"
          />
        </TabsContent>
      </Tabs>
      
      <TransacaoForm 
        open={showForm} 
        onOpenChange={setShowForm}
      />
    </div>
  );
}
