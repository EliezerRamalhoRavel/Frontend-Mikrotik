import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Loader2, Plus, Trash2, Edit, 
  CheckCircle2, XCircle, HelpCircle, RefreshCw, Search, Filter,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

import { firmwareService } from "@/api/firmwareService";
import type { FirmwareRule, FirmwareDashboardItem } from "@/types/firmware";

const formSchema = z.object({
  model: z.string().min(2, "Modelo obrigatório (Ex: RB750Gr3)"),
  version: z.string().min(2, "Versão obrigatória (Ex: 7.12)"),
});

export default function FirmwarePage() {
  const [rules, setRules] = useState<FirmwareRule[]>([]);
  const [dashboard, setDashboard] = useState<FirmwareDashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [rulesSort, setRulesSort] = useState<{ field: keyof FirmwareRule; direction: 'asc' | 'desc' } | null>(null);
  const [dashSort, setDashSort] = useState<{ field: keyof FirmwareDashboardItem; direction: 'asc' | 'desc' } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { model: "", version: "" },
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rulesData, dashData] = await Promise.all([
        firmwareService.getRules(),
        firmwareService.getDashboard()
      ]);
      setRules(rulesData);
      setDashboard(dashData);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dashSort]);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({ model: "", version: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: FirmwareRule) => {
    setEditingId(rule.id);
    form.reset({ model: rule.model, version: rule.version });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      if (editingId) {
        await firmwareService.updateRule(editingId, { version: data.version });
        toast.success("Regra atualizada com sucesso!");
      } else {
        await firmwareService.createRule(data);
        toast.success("Regra criada com sucesso!");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar. Verifique se o modelo já existe.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Deseja excluir esta regra?")) return;
    try {
      await firmwareService.deleteRule(id);
      toast.success("Regra removida.");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover regra.");
    }
  };

  const handleRulesSort = (field: keyof FirmwareRule) => {
    setRulesSort(current => {
      if (current?.field === field) {
        if (current.direction === 'asc') return { field, direction: 'desc' };
        return null;
      }
      return { field, direction: 'asc' };
    });
  };

  const handleDashSort = (field: keyof FirmwareDashboardItem) => {
    setDashSort(current => {
      if (current?.field === field) {
        if (current.direction === 'asc') return { field, direction: 'desc' };
        return null;
      }
      return { field, direction: 'asc' };
    });
  };

  const getSortIcon = (currentSort: any, field: string) => {
    if (currentSort?.field !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return currentSort.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-purple-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-purple-600" />;
  };

  const sortedRules = [...rules].sort((a, b) => {
    if (!rulesSort) return 0;
    const { field, direction } = rulesSort;
    const valA = a[field] ?? "";
    const valB = b[field] ?? "";
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredDashboard = dashboard.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.device_name.toLowerCase().includes(searchLower) ||
      item.device_ip.includes(searchLower) ||
      item.model.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedDashboard = [...filteredDashboard].sort((a, b) => {
    if (!dashSort) return 0;
    const { field, direction } = dashSort;
    const valA = a[field] ?? "";
    const valB = b[field] ?? "";
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedDashboard.length / itemsPerPage);
  const paginatedItems = sortedDashboard.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "updated": return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</Badge>;
      case "outdated": return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Antigo</Badge>;
      case "no_rule": return <Badge variant="secondary" className="text-zinc-500 bg-zinc-100 hover:bg-zinc-200"><HelpCircle className="w-3 h-3 mr-1"/> S/ Regra</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Gestão de Firmware</h1>
          <p className="text-muted-foreground">Homologação de versões e conformidade.</p>
        </div>
        <Button variant="outline" onClick={loadData} className="shrink-0">
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <CardTitle className="text-lg font-medium">Versões Homologadas</CardTitle>
            <CardDescription>Defina qual versão cada modelo deve utilizar.</CardDescription>
          </div>
          <Button size="sm" onClick={handleOpenCreate} className="bg-purple-700 hover:bg-purple-800 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Nova Regra
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-zinc-50/50">
                <TableHead className="pl-6 w-[40%] cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleRulesSort('model')}>
                  <div className="flex items-center">Modelo {getSortIcon(rulesSort, 'model')}</div>
                </TableHead>
                <TableHead className="w-[40%] cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleRulesSort('version')}>
                  <div className="flex items-center">Versão {getSortIcon(rulesSort, 'version')}</div>
                </TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhuma regra definida.</TableCell>
                </TableRow>
              ) : (
                sortedRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium pl-6">{rule.model}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono bg-zinc-50">v{rule.version}</Badge></TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(rule)} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <CardTitle className="text-lg">Status dos Dispositivos</CardTitle>
              <CardDescription>Visão geral da conformidade da rede.</CardDescription>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded border border-green-200 font-medium">
                {dashboard.filter(i => i.status === 'updated').length} OK
              </span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded border border-red-200 font-medium">
                {dashboard.filter(i => i.status === 'outdated').length} Antigos
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome, IP ou modelo..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[200px]">
                <div className="relative">
                    <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos os Status</option>
                      <option value="updated">✅ Atualizados</option>
                      <option value="outdated">❌ Desatualizados</option>
                      <option value="no_rule">❓ Sem Regra</option>
                    </select>
                </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                <TableHead className="pl-6 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleDashSort('device_name')}>
                  <div className="flex items-center">Dispositivo {getSortIcon(dashSort, 'device_name')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleDashSort('model')}>
                  <div className="flex items-center">Modelo {getSortIcon(dashSort, 'model')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleDashSort('current_version')}>
                  <div className="flex items-center">Atual {getSortIcon(dashSort, 'current_version')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleDashSort('target_version')}>
                  <div className="flex items-center">Meta {getSortIcon(dashSort, 'target_version')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleDashSort('status')}>
                  <div className="flex items-center">Status {getSortIcon(dashSort, 'status')}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="pl-6">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.device_name}</div>
                    <div className="text-xs text-muted-foreground">{item.device_ip}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono text-xs">{item.model}</Badge></TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{item.current_version}</TableCell>
                  <TableCell className="font-medium font-mono text-sm">{item.target_version || "-"}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
              {paginatedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum dispositivo encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {sortedDashboard.length > 0 && (
            <div className="flex items-center justify-end p-4 border-t border-zinc-100 dark:border-zinc-800 gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4"/>
                </Button>
                <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4"/>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Regra" : "Nova Regra"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo do Mikrotik</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Ex: RB750Gr3" 
                        {...field} 
                        disabled={!!editingId} 
                        className={editingId ? "bg-muted text-muted-foreground" : ""}
                    />
                  </FormControl>
                  {editingId && <p className="text-xs text-muted-foreground">O modelo não pode ser alterado na edição.</p>}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="version" render={({ field }) => (
                <FormItem>
                  <FormLabel>Versão Homologada</FormLabel>
                  <FormControl><Input placeholder="Ex: 7.12.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="bg-purple-700 hover:bg-purple-800 text-white">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}