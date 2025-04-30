import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, Clock, BarChart } from "lucide-react";
import ServicosList from "@/components/servicos/ServicosList";
import { useQuery } from "@tanstack/react-query";
import { ServicoForm } from "@/components/servicos/ServicoForm";

export default function Servicos() {
  const [showForm, setShowForm] = useState(false);
  
  // Buscar categorias de serviços
  const { data: categorias } = useQuery({
    queryKey: ['/api/servicos/categorias'],
  });
  
  // Buscar estatísticas de serviços
  const { data: estatisticas } = useQuery({
    queryKey: ['/api/servicos/estatisticas'],
  });
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Serviços</h1>
      
      <Tabs defaultValue="todos">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="todos" className="flex items-center">
              <Scissors className="h-4 w-4 mr-2" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="populares" className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Mais Realizados
            </TabsTrigger>
            <TabsTrigger value="recentes" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Recém Adicionados
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <ServicosList onOpenForm={() => setShowForm(true)} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="populares">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <ServicosList onOpenForm={() => setShowForm(true)} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recentes">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Recém Adicionados</CardTitle>
            </CardHeader>
            <CardContent>
              <ServicosList onOpenForm={() => setShowForm(true)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ServicoForm 
        open={showForm} 
        onOpenChange={setShowForm}
      />
    </div>
  );
}
