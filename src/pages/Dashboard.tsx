import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HardDrive, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Loader2,
  PauseCircle,
  AlertTriangle,
  Router
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mikrotikService } from "@/api/mikrotikService";
import { backupService } from "@/api/backupService";
import type { Mikrotik } from "@/types/mikrotik";
import { toast } from "sonner";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Armazena todos os dispositivos para filtragem no modal
  const [allDevices, setAllDevices] = useState<Mikrotik[]>([]);
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'online' | 'offline' | 'warning' | 'paused' | null>(null);

  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    warningDevices: 0,
    pausedDevices: 0,
    totalBackups: 0,
    backupsOk: 0,
    backupsOverdue: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Busca 1000 itens para garantir estatísticas precisas
        const [devicesData, backupsData] = await Promise.all([
          mikrotikService.getAll(1, 1000), 
          backupService.getAll(1, 1000)
        ]);

        const devices = devicesData.items || [];
        setAllDevices(devices);

        const backups = backupsData.items || [];

        // Cálculos locais baseados nos dados recebidos
        const online = devices.filter(d => d.status === 'online' && d.is_active).length;
        const offline = devices.filter(d => d.status === 'offline' && d.is_active).length;
        const warning = devices.filter(d => d.status === 'warning' && d.is_active).length;
        const paused = devices.filter(d => !d.is_active).length;

        const bkpOk = backups.filter(b => b.status === 'ok').length;
        const bkpOverdue = backups.filter(b => b.status === 'overdue').length;

        setStats({
          totalDevices: devicesData.total || devices.length,
          onlineDevices: online,
          offlineDevices: offline,
          warningDevices: warning,
          pausedDevices: paused,
          totalBackups: backupsData.total || backups.length,
          backupsOk: bkpOk,
          backupsOverdue: bkpOverdue
        });

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        toast.error("Não foi possível carregar as métricas.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Abre o modal com o tipo selecionado
  const openModal = (type: 'online' | 'offline' | 'warning' | 'paused') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  // Filtra a lista para exibir no modal
  const getFilteredDevices = () => {
    if (!modalType) return [];
    if (modalType === 'paused') {
        return allDevices.filter(d => !d.is_active);
    }
    return allDevices.filter(d => d.status === modalType && d.is_active);
  };

  const getModalTitle = () => {
    switch(modalType) {
        case 'online': return "Dispositivos Online";
        case 'offline': return "Dispositivos Offline (Críticos)";
        case 'warning': return "Dispositivos com Alerta";
        case 'paused': return "Monitoramento Pausado";
        default: return "Detalhes";
    }
  };

  const getModalColor = () => {
    switch(modalType) {
        case 'online': return "text-green-600";
        case 'offline': return "text-red-600";
        case 'warning': return "text-amber-600";
        case 'paused': return "text-zinc-500";
        default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua infraestrutura de rede.</p>
      </div>

      {/* CARDS INTERATIVOS (CLICÁVEIS) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card 
            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
            onClick={() => openModal('online')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Mikrotiks Online</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.onlineDevices}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-500 flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Ativos
              </span>
            </p>
          </CardContent>
        </Card>

        <Card 
            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-500"
            onClick={() => openModal('offline')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Críticos Offline</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.offlineDevices}</div>
            <p className="text-xs text-muted-foreground mt-1 text-red-400 font-medium">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card 
            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
            onClick={() => openModal('warning')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Links Instáveis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.warningDevices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Links de backup ativos ou falhas parciais
            </p>
          </CardContent>
        </Card>

        <Card 
            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-zinc-400"
            onClick={() => openModal('paused')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Em Pausa</CardTitle>
            <PauseCircle className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.pausedDevices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monitoramento desativado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
         <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>Backups</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                     <HardDrive className="h-5 w-5 text-blue-500" />
                     <span className="text-sm font-medium">Total Monitorado</span>
                 </div>
                 <span className="text-xl font-bold">{stats.totalBackups}</span>
             </div>
             <div className="space-y-2">
                 <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-900">
                     <span className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> Atualizados</span>
                     <span className="font-bold text-green-700 dark:text-green-300">{stats.backupsOk}</span>
                 </div>
                 <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900">
                     <span className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Atrasados</span>
                     <span className="font-bold text-red-700 dark:text-red-300">{stats.backupsOverdue}</span>
                 </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Status da Infraestrutura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API Backend</span>
                    <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Worker de Monitoramento</span>
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Banco de Dados</span>
                    <span className="text-sm font-medium text-green-600">Conectado</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-sm text-muted-foreground">Dispositivos Totais</span>
                    <span className="text-sm font-bold text-blue-600">{stats.totalDevices}</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL DETALHADO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
                <DialogTitle className={`flex items-center gap-2 text-xl ${getModalColor()}`}>
                    {modalType === 'offline' && <AlertCircle className="h-6 w-6" />}
                    {modalType === 'warning' && <AlertTriangle className="h-6 w-6" />}
                    {modalType === 'online' && <CheckCircle2 className="h-6 w-6" />}
                    {modalType === 'paused' && <PauseCircle className="h-6 w-6" />}
                    {getModalTitle()}
                </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 mt-4 pr-4">
                {getFilteredDevices().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Nenhum dispositivo nesta categoria.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Dispositivo</TableHead>
                                <TableHead>IP</TableHead>
                                <TableHead>Status Detalhado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {getFilteredDevices().map(dev => (
                                <TableRow key={dev.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Router className="h-4 w-4 text-zinc-400" />
                                            {dev.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{dev.ip_address}</TableCell>
                                    <TableCell>
                                        {dev.last_error ? (
                                            <Badge variant="destructive" className="font-normal border-red-200">
                                                {dev.last_error}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                                                Operacional
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>
  );
}