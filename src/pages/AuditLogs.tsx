import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScrollText, RefreshCw, User, Laptop, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { auditService } from "@/api/auditService";
import type { AuditLog } from "@/types/audit";
import { PaginationControl } from "@/components/shared/PaginationControl";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 15;

  const loadData = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const sortByString = sortConfig ? `${sortConfig.field}:${sortConfig.direction}` : undefined;
      const data = await auditService.getAll(currentPage, PAGE_SIZE, sortByString);
      setLogs(data.items);
      setTotalPages(data.pages);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    loadData(page); 
  }, [page, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig((current) => {
      if (current?.field === field) {
        if (current.direction === 'asc') return { field, direction: 'desc' };
        return null;
      }
      return { field, direction: 'asc' };
    });
  };

  const getSortIcon = (field: string) => {
    if (sortConfig?.field !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Criação</Badge>;
    if (action.includes("UPDATE")) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Edição</Badge>;
    if (action.includes("DELETE")) return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Exclusão</Badge>;
    if (action.includes("LOGIN")) return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">Acesso</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  const formatChanges = (changes?: Record<string, any>) => {
    if (!changes) return <span className="text-zinc-400 italic">Sem detalhes</span>;
    const { password, ...safeChanges } = changes; 
    return (
      <code className="text-xs bg-zinc-100 dark:bg-zinc-800 p-1 rounded text-zinc-600 dark:text-zinc-300 break-all">
        {JSON.stringify(safeChanges).substring(0, 50)}
        {JSON.stringify(safeChanges).length > 50 && "..."}
      </code>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Logs de Atividade</h1>
          <p className="text-muted-foreground">Histórico de ações realizadas no sistema.</p>
        </div>
        <Button variant="outline" onClick={() => loadData(page)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-zinc-500" />
            Registro de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
          ) : logs.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground"><ScrollText className="mb-2 h-10 w-10 opacity-20" /><p>Nenhum log encontrado.</p></div>
          ) : (
            <div className="border-b border-zinc-100 dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('action')}>
                      <div className="flex items-center">Ação {getSortIcon('action')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('resource')}>
                      <div className="flex items-center">Recurso {getSortIcon('resource')}</div>
                    </TableHead>
                    <TableHead>Detalhes (JSON)</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center justify-end">Data {getSortIcon('created_at')}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-medium text-sm text-zinc-700 dark:text-zinc-300 capitalize">{log.resource}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{formatChanges(log.changes)}</TableCell>
                      <TableCell>
                          <div className="flex flex-col text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Laptop className="h-3 w-3" /> {log.ip_address || 'N/A'}</span>
                              <span className="flex items-center gap-1" title={log.user_id}><User className="h-3 w-3" /> {log.user_id ? 'Usuário' : 'Sistema'}</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-zinc-500">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="px-4">
            <PaginationControl 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
              isLoading={isLoading} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}