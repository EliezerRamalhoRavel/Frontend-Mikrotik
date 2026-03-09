import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Plus, Activity, Trash2, Edit, 
  Search, CheckCircle2, XCircle, Signal,
  ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { pingService } from "@/api/pingService";
import type { PingTarget } from "@/types/ping";
import { PingModal } from "@/components/ping/PingModal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { PaginationControl } from "@/components/shared/PaginationControl";

export default function PingTargetsPage() {
  const [targets, setTargets] = useState<PingTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<PingTarget | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<PingTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const sortByString = sortConfig ? `${sortConfig.field}:${sortConfig.direction}` : undefined;
      const data = await pingService.getAll(currentPage, PAGE_SIZE, sortByString);
      setTargets(data.items);
      setTotalPages(data.pages);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar monitoramentos.");
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

  const handleDeleteClick = (target: PingTarget) => {
    setTargetToDelete(target);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetToDelete) return;
    setIsDeleting(true);
    try {
      await pingService.delete(targetToDelete.id);
      toast.success("Alvo removido com sucesso.");
      loadData(page);
    } catch (error) {
      toast.error("Erro ao remover alvo.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTargetToDelete(null);
    }
  };

  const handleCreate = () => { setSelectedTarget(null); setIsModalOpen(true); };
  const handleEdit = (target: PingTarget) => { setSelectedTarget(target); setIsModalOpen(true); };
  
  const refreshPage = () => loadData(page);

  const filteredTargets = targets.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, latency?: number) => {
    switch(status) {
        case 'online': 
            return <Badge className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle2 className="mr-1 h-3 w-3" /> Online {latency ? `(${latency.toFixed(0)}ms)` : ''}</Badge>;
        case 'offline':
            return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Offline</Badge>;
        case 'high_latency':
            return <Badge className="bg-amber-500 hover:bg-amber-600 text-white"><Signal className="mr-1 h-3 w-3" /> Latência Alta {latency ? `(${latency.toFixed(0)}ms)` : ''}</Badge>;
        default:
            return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Monitoramento de Pings</h1>
        <p className="text-muted-foreground">Cadastre clientes e endereços para monitoramento contínuo de latência.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Pesquisar..." 
            className="pl-10 bg-white dark:bg-zinc-900" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} className="bg-purple-900 hover:bg-purple-800 text-white">
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
          ) : filteredTargets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground"><Activity className="mb-2 h-10 w-10 opacity-20" /><p>Nenhum alvo cadastrado.</p></div>
          ) : (
            <div className="border-b border-zinc-100 dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-zinc-50/50 dark:bg-zinc-900/50">
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center">Nome de Host {getSortIcon('name')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('target')}>
                      <div className="flex items-center">IP {getSortIcon('target')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('is_active')}>
                      <div className="flex items-center">Status {getSortIcon('is_active')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center">Status do Ping {getSortIcon('status')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('packet_count')}>
                      <div className="flex items-center">Intervalo (s) {getSortIcon('packet_count')}</div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTargets.map((t) => (
                    <TableRow key={t.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                          {t.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">{t.target}</TableCell>
                      <TableCell>
                          {t.is_active ? (
                              <Badge className="bg-green-600 hover:bg-green-700 text-white text-[10px]">Ativo</Badge>
                          ) : (
                              <Badge variant="secondary" className="text-zinc-500 text-[10px]">Inativo</Badge>
                          )}
                      </TableCell>
                      <TableCell>{getStatusBadge(t.status, t.last_latency_ms)}</TableCell>
                      <TableCell className="text-zinc-500 text-sm">{t.packet_count || 3}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(t)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      <PingModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={refreshPage} targetToEdit={selectedTarget} />
      
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Alvo"
        description={`Deseja realmente excluir "${targetToDelete?.name}"?`}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Deletar"
        variant="destructive"
      />
    </div>
  );
}