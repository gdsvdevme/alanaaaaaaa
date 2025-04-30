import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList
} from "recharts";

interface ChartData {
  name: string;
  value: number;
  isCurrentMonth?: boolean;
}

interface PerformanceChartProps {
  data: ChartData[];
  title: string;
  formatValue?: (value: number) => string;
}

export default function PerformanceChart({ 
  data, 
  title,
  formatValue = (value) => `R$ ${value}` 
}: PerformanceChartProps) {
  const [selectedView, setSelectedView] = useState<'receita' | 'clientes' | 'servicos'>('receita');
  
  // Dados simulados para as visualizações
  const viewsData = {
    receita: data,
    clientes: data.map(item => ({ 
      ...item, 
      value: Math.floor(item.value / 85) // Simula número de clientes
    })),
    servicos: data.map(item => ({ 
      ...item, 
      value: Math.floor(item.value / 120) // Simula número de serviços
    })),
  };
  
  const currentViewData = viewsData[selectedView];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md">
          <p className="text-neutral-800 font-medium">{label}</p>
          <p className="text-primary">
            {selectedView === 'receita' 
              ? formatValue(value)
              : selectedView === 'clientes'
                ? `${value} clientes`
                : `${value} serviços`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h4 className="text-lg font-medium text-neutral-800 mb-2 md:mb-0">
            {title}
          </h4>
          <div className="flex items-center space-x-3">
            <Button 
              variant={selectedView === 'receita' ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedView('receita')}
            >
              Receita
            </Button>
            <Button 
              variant={selectedView === 'clientes' ? "secondary" : "outline"}
              size="sm" 
              onClick={() => setSelectedView('clientes')}
            >
              Clientes
            </Button>
            <Button 
              variant={selectedView === 'servicos' ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedView('servicos')}
            >
              Serviços
            </Button>
          </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentViewData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => selectedView === 'receita' ? `R$ ${value}` : `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                {currentViewData.map((entry, index) => (
                  <LabelList
                    key={`label-${index}`}
                    dataKey="value"
                    position="top"
                    style={{ fontSize: '10px', fill: 'hsl(var(--muted-foreground))' }}
                    formatter={(value: number) => 
                      selectedView === 'receita' 
                        ? `R$${value}` 
                        : value
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
