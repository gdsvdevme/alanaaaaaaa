import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, Activity } from "lucide-react";
import EstoqueList from "@/components/estoque/EstoqueList";
import { useQuery } from "@tanstack/react-query";
import { EstoqueForm } from "@/components/estoque/EstoqueForm";
import { Badge } from "@/components/ui/badge";

export default function Estoque() {
  const [showForm, setShowForm] = useState(false);
  
  // Buscar produtos com estoque baixo
  const { data: produtosBaixoEstoque } = useQuery({
    queryKey: ['/api/estoque/baixo'],
  });
  
  // Buscar movimentação de estoque
  const { data: movimentacaoEstoque } = useQuery({
    queryKey: ['/api/estoque/movimentacao'],
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Controle de Estoque</h1>
        <div className="flex items-center">
          {produtosBaixoEstoque?.length > 0 && (
            <Badge variant="destructive" className="mr-2">
              {produtosBaixoEstoque.length} produtos com estoque baixo
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="todos">
        <TabsList className="mb-4">
          <TabsTrigger value="todos" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Todos os Produtos
          </TabsTrigger>
          <TabsTrigger value="baixo-estoque" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Baixo Estoque
          </TabsTrigger>
          <TabsTrigger value="movimentacao" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Movimentação
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle>Inventário Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <EstoqueList onOpenForm={() => setShowForm(true)} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="baixo-estoque">
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <EstoqueList 
                onOpenForm={() => setShowForm(true)} 
                filtro="baixo-estoque"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="movimentacao">
          <Card>
            <CardHeader>
              <CardTitle>Movimentação de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-500 mb-4">Histórico de entradas e saídas de produtos do estoque</p>
              
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Produto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Quantidade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {movimentacaoEstoque?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                          Nenhuma movimentação de estoque registrada recentemente.
                        </td>
                      </tr>
                    ) : (
                      movimentacaoEstoque?.map((movimento: any) => (
                        <tr key={movimento.id}>
                          <td className="px-4 py-3 text-sm">{movimento.data}</td>
                          <td className="px-4 py-3 text-sm font-medium">{movimento.produto}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={movimento.tipo === "entrada" ? "success" : "destructive"}>
                              {movimento.tipo === "entrada" ? "Entrada" : "Saída"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{movimento.quantidade}</td>
                          <td className="px-4 py-3 text-sm">{movimento.responsavel}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <EstoqueForm 
        open={showForm} 
        onOpenChange={setShowForm}
      />
    </div>
  );
}
