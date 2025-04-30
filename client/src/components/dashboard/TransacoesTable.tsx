import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatDate, formatMoney, getCategoriaClass } from "@/lib/utils";
import { TransacaoForm } from "../financas/TransacaoForm";
import { useState } from "react";

interface Transacao {
  id: string;
  data_transacao: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: string;
  metodo_pagamento: string;
}

interface TransacoesTableProps {
  transacoes: Transacao[];
  titulo?: string;
  paginacao?: {
    total: number;
    atual: number;
    anterior: () => void;
    proxima: () => void;
  };
}

export default function TransacoesTable({ 
  transacoes, 
  titulo = "Transações Recentes",
  paginacao
}: TransacoesTableProps) {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2 md:mb-0">
          {titulo}
        </h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>
      
      <Card className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                transacoes.map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell className="font-medium">
                      {formatDate(transacao.data_transacao)}
                    </TableCell>
                    <TableCell>{transacao.descricao}</TableCell>
                    <TableCell>
                      <Badge className={getCategoriaClass(transacao.categoria)}>
                        {transacao.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {transacao.tipo === 'entrada' ? '+ ' : '- '}
                      {formatMoney(transacao.valor)}
                    </TableCell>
                    <TableCell>{transacao.metodo_pagamento}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {paginacao && (
          <div className="bg-white px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-neutral-700">
              <p>
                Mostrando <span className="font-medium">{transacoes.length}</span> de{" "}
                <span className="font-medium">{paginacao.total}</span> transações
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={paginacao.anterior}
                disabled={paginacao.atual === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant={paginacao.atual === 1 ? "secondary" : "outline"}
                size="sm"
              >
                1
              </Button>
              {paginacao.total > 1 && (
                <Button
                  variant={paginacao.atual === 2 ? "secondary" : "outline"}
                  size="sm"
                >
                  2
                </Button>
              )}
              {paginacao.total > 2 && (
                <Button
                  variant={paginacao.atual === 3 ? "secondary" : "outline"}
                  size="sm"
                >
                  3
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={paginacao.proxima}
                disabled={paginacao.atual === Math.ceil(paginacao.total / 10)}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      <TransacaoForm 
        open={showForm} 
        onOpenChange={setShowForm} 
      />
    </>
  );
}
