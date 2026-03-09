import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, Plus, Router, Trash2, Unplug, CheckCircle2, Edit, AlertTriangle,
  PauseCircle, PlayCircle, Search, ArrowUpDown, ArrowUp, ArrowDown,
  ShieldCheck, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { mikrotikService } from "@/api/mikrotikService";
import type { Mikrotik } from "@/types/mikrotik";
import { MikrotikModal } from "@/components/mikrotik/MikrotikModal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { PaginationControl } from "@/components/shared/PaginationControl";
import { useDebounce } from "@/hooks/useDebounce";

const InterfaceBadge = ({ name, isDown, isActive }: { name: string; isDown: boolean, isActive: boolean }) => {
  const shortName = name.includes("-") ? name.split("-").pop()?.trim() : name;
  let colorClass = "bg-green-50 text-green-700 border-green-200";
  let dotClass = "bg-green-600";
  let statusText = "Online";

  if (!isActive) {
    colorClass = "bg-zinc-100 text-zinc-500 border-zinc-200";
    dotClass = "bg-zinc-400";
    statusText = "Monitoramento Pausado";
  } else if (isDown) {
    colorClass = "bg-red-50 text-red-700 border-red-200";
    dotClass = "bg-red-600 animate-pulse";
    statusText = "Offline";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border mb-1 mr-1 cursor-help ${colorClass}`}
      title={`${name} | Status: ${statusText}`}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {shortName}
    </div>
  );
};

export default function MikrotiksPage() {
  const [allMikrotiks, setAllMikrotiks] = useState<Mikrotik[]>([]);
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 15;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMikrotik, setSelectedMikrotik] = useState<Mikrotik | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Mikrotik | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusFilter = searchParams.get("status");

  // Carrega TODOS os dados de forma paginada
  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await mikrotikService.getAllDevices();
      setAllMikrotiks(items);
    } catch (error) {
      toast.error("Erro ao carregar dispositivos.");
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para Filtrar, Ordenar e Paginar
  useEffect(() => {
    let result = [...allMikrotiks];

    // 1. Filtro de Texto (Global)
    if (debouncedSearchTerm) {
      const lower = debouncedSearchTerm.toLowerCase();
      result = result.filter(mk =>
        mk.name.toLowerCase().includes(lower) ||
        mk.ip_address.toLowerCase().includes(lower)
      );
    }

    // 2. Filtro de Status
    if (statusFilter) {
      result = result.filter(mk => {
        if (statusFilter === 'paused') return !mk.is_active;
        return mk.is_active && mk.status === statusFilter;
      });
    }

    // 3. Ordenação
    if (sortConfig) {
      result.sort((a, b) => {
        const field = sortConfig.field;
        const direction = sortConfig.direction === 'asc' ? 1 : -1;

        if (field === 'status') {
          // Lógica específica: Online vem primeiro (menor peso), outros depois.
          const getWeight = (s: string) => s === 'online' ? 0 : 1;
          const weightA = getWeight(a.status);
          const weightB = getWeight(b.status);
          if (weightA !== weightB) return (weightA - weightB) * direction;
          return 0; // Se ambos forem online ou offline, mantém a ordem ou ordena por nome?
        }

        if (field === 'vpn_amount') {
          return (a.vpn_amount - b.vpn_amount) * direction;
        }

        // Default: Strings (Name, etc)
        const valA = String((a as any)[field] || '').toLowerCase();
        const valB = String((b as any)[field] || '').toLowerCase();
        return valA.localeCompare(valB) * direction;
      });
    }

    // 4. Paginação Calculada no Cliente
    const total = result.length;
    setTotalPages(Math.ceil(total / PAGE_SIZE));

    // Ajusta página se filtro reduzir muito os resultados
    const safePage = Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    if (safePage !== page && total > 0) {
      setPage(safePage);
      return;
    }

    const startIndex = (safePage - 1) * PAGE_SIZE;
    const sliced = result.slice(startIndex, startIndex + PAGE_SIZE);
    setMikrotiks(sliced);

  }, [allMikrotiks, debouncedSearchTerm, statusFilter, sortConfig, page]);

  useEffect(() => {
    loadData();
  }, []); // Roda apenas na montagem

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

  const confirmDelete = async () => {
    if (!deviceToDelete) return;
    setIsDeleting(true);
    try {
      await mikrotikService.delete(deviceToDelete.id);
      toast.success("Dispositivo removido.");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover dispositivo.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeviceToDelete(null);
    }
  };

  const getStatusBadge = (mk: Mikrotik) => {
    if (!mk.is_active) {
      return <Badge variant="outline" className="text-zinc-500 bg-zinc-50 border-zinc-200">Pausado</Badge>;
    }

    // LÓGICA ATUALIZADA:
    // Verifica se é "Online" mas com erro de API (indicando Telnet)
    // Agora verificamos isso mesmo se o status for 'online'
    const isTelnetFallback = (mk.status === 'online' || mk.status === 'warning') && mk.last_error && (
      mk.last_error.toLowerCase().includes('telnet') ||
      mk.last_error.includes('18291') ||
      mk.last_error.includes('TCP OK')
    );

    if (isTelnetFallback) {
      return (
        <div title={`Conectado via Telnet (18291). API Falhou: ${mk.last_error}`}>
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-help border-emerald-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Online (Telnet)
          </Badge>
        </div>
      );
    }

    switch (mk.status) {
      case 'online':
        return (
          <div title="Conectado via API (Porta 8728) - Monitoramento Completo">
            <Badge className="bg-green-600 text-white cursor-help"><CheckCircle2 className="mr-1 h-3 w-3" /> Online</Badge>
          </div>
        );
      case 'offline':
        return (
          <div title={`Dispositivo Inacessível. Erro: ${mk.last_error || 'Timeout'}`}>
            <Badge variant="destructive" className="cursor-help"><Unplug className="mr-1 h-3 w-3" /> Offline</Badge>
          </div>
        );
      case 'warning':
        return (
          <div title={`Alerta de Sistema: ${mk.last_error}`}>
            <Badge className="bg-amber-500 text-white cursor-help"><AlertTriangle className="mr-1 h-3 w-3" /> Alerta</Badge>
          </div>
        );
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const isValidInterface = (iface?: string) => iface && iface.trim().length > 0 && iface !== "--";


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispositivos</h1>
          <p className="text-muted-foreground">Gerencie seus concentradores Mikrotik.</p>
        </div>
        <Button onClick={() => { setSelectedMikrotik(null); setIsModalOpen(true); }} className="bg-blue-600 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Dispositivo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Pesquisar cliente ou IP..."
          className="pl-9 bg-white dark:bg-zinc-900 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : mikrotiks.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <Router className="mb-4 h-12 w-12 opacity-20" />
              <p>Nenhum dispositivo encontrado.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                    <TableHead className="w-[160px] text-center cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center justify-center">Status {getSortIcon('status')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center">Cliente / IP {getSortIcon('name')}</div>
                    </TableHead>
                    <TableHead>Links (WAN)</TableHead>
                    <TableHead className="text-center cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('vpn_amount')}>
                      <div className="flex items-center justify-center">VPN {getSortIcon('vpn_amount')}</div>
                    </TableHead>
                    <TableHead className="text-center cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('is_active')}>
                      <div className="flex items-center justify-center">Monitoramento {getSortIcon('is_active')}</div>
                    </TableHead>
                    <TableHead className="text-center cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('is_management_active')}>
                      <div className="flex items-center justify-center">Gestão {getSortIcon('is_management_active')}</div>
                    </TableHead>
                    <TableHead className="text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mikrotiks.map((mk) => (
                    <TableRow key={mk.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group">
                      <TableCell className="text-center">{getStatusBadge(mk)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{mk.name}</span>
                          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1" title={mk.ip_address}>
                            <Router className="h-3 w-3" />
                            {mk.ip_address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap">
                          {isValidInterface(mk.interface_1) && (
                            <InterfaceBadge
                              name={mk.interface_1!}
                              isDown={mk.status === 'offline' || (mk.last_error?.includes(mk.interface_1!) ?? false)}
                              isActive={mk.is_active}
                            />
                          )}
                          {isValidInterface(mk.interface_2) && (
                            <InterfaceBadge
                              name={mk.interface_2!}
                              isDown={mk.status === 'offline' || (mk.last_error?.includes(mk.interface_2!) ?? false)}
                              isActive={mk.is_active}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {mk.has_vpn ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">{mk.vpn_amount} Túneis</Badge>
                        ) : <span className="text-zinc-300">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {mk.is_active ? (
                          <PlayCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <PauseCircle className="h-5 w-5 text-zinc-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {mk.is_management_active ? (
                          <ShieldCheck className="h-5 w-5 text-blue-600 mx-auto" />
                        ) : (
                          <ShieldAlert className="h-5 w-5 text-zinc-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedMikrotik(mk); setIsModalOpen(true); }}
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDeviceToDelete(mk); setIsDeleteDialogOpen(true); }}
                            className="h-8 w-8 hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 border-t">
                <PaginationControl
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <MikrotikModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => loadData()}
        mikrotikToEdit={selectedMikrotik}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Remover Dispositivo"
        description={`Tem certeza que deseja excluir o dispositivo "${deviceToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}