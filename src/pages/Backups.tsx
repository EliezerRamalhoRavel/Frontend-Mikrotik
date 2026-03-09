import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Folder, 
  FileText, 
  Search, 
  Download, 
  ChevronRight,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { backupService } from "@/api/backupService";
import type { Backup, BackupFile } from "@/types/backup";
import { PaginationControl } from "@/components/shared/PaginationControl";

export default function BackupsPage() {
  const [view, setView] = useState<'clients' | 'files'>('clients');
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>({ field: 'days_since_last', direction: 'desc' });

  const [clients, setClients] = useState<Backup[]>([]);
  const [files, setFiles] = useState<BackupFile[]>([]);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const loadClients = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const sortByString = sortConfig ? `${sortConfig.field}:${sortConfig.direction}` : undefined;
      const data = await backupService.getAll(currentPage, PAGE_SIZE, sortByString);
      setClients(data.items);
      setTotalPages(data.pages);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lista de clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'clients') {
      loadClients(page);
    }
  }, [page, view, sortConfig]);

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

  const openClientFolder = async (clientName: string) => {
    setIsLoading(true);
    setSelectedClientName(clientName);
    setView('files');
    setSelectedFiles([]);
    setSearchTerm("");
    
    try {
      const fileList = await backupService.getClientFiles(clientName);
      setFiles(fileList);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao listar arquivos do backup.");
      setView('clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToClients = () => {
    setView('clients');
    setSelectedClientName(null);
    setFiles([]);
    setSelectedFiles([]);
    setSearchTerm("");
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.name));
    }
  };

  const toggleSelectFile = (fileName: string) => {
    if (selectedFiles.includes(fileName)) {
      setSelectedFiles(prev => prev.filter(f => f !== fileName));
    } else {
      setSelectedFiles(prev => [...prev, fileName]);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedFiles.length === 0) {
        toast.warning("Selecione pelo menos um arquivo.");
        return;
    }
    
    if (!selectedClientName) return;

    toast.info(`Iniciando download de ${selectedFiles.length} arquivo(s)...`);
    
    const baseUrl = "/api/v1"; 
    
    const filesParam = selectedFiles.join(",");
    const downloadUrl = `${baseUrl}/backups/${selectedClientName}/download?files=${encodeURIComponent(filesParam)}`;
    
    window.open(downloadUrl, "_blank");
  };

  const filteredClients = clients.filter(c => 
    c.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok': return <Badge className="bg-green-600 hover:bg-green-700">Recente</Badge>;
      case 'overdue': return <Badge className="bg-red-500 hover:bg-red-600">Antigo</Badge>;
      case 'empty': return <Badge variant="outline" className="text-zinc-400 border-zinc-300">Vazio</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Backups de Mikrotik</h1>
        <p className="text-muted-foreground">Visualize e gerencie os backups dos dispositivos Mikrotik.</p>
      </div>

      <div className="bg-cyan-50 border border-cyan-100 rounded-md p-4 text-cyan-900 text-sm">
        Para baixar os arquivos de backup, navegue até a pasta do cliente desejado, selecione os arquivos e clique em "Baixar Selecionados".
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder={view === 'clients' ? "Pesquisar cliente..." : "Pesquisar arquivo..."}
            className="pl-10 bg-white dark:bg-zinc-900" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {view === 'files' && (
          <Button 
            onClick={handleDownloadSelected}
            className="bg-blue-600 hover:bg-blue-500 text-white w-full md:w-auto"
            disabled={selectedFiles.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Selecionados {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        )}
      </div>

      <div className="flex items-center text-sm font-medium space-x-2">
        <button 
          onClick={handleBackToClients} 
          className={`flex items-center hover:underline ${view === 'files' ? 'text-blue-600' : 'text-zinc-900 dark:text-zinc-100 font-bold'}`}
        >
          {view === 'files' && <ArrowLeft className="h-4 w-4 mr-1" />}
          Clientes
        </button>
        
        {view === 'files' && (
          <>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-900 dark:text-zinc-100 font-bold flex items-center gap-2">
              <Folder className="h-4 w-4 fill-blue-100 text-blue-600" />
              {selectedClientName}
            </span>
          </>
        )}
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          
          {view === 'clients' && (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('client_name')}>
                      <div className="flex items-center">Nome {getSortIcon('client_name')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('last_backup_date')}>
                      <div className="flex items-center">Último Backup {getSortIcon('last_backup_date')}</div>
                    </TableHead>
                    <TableHead className="w-[150px] text-right cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('days_since_last')}>
                      <div className="flex items-center justify-end">Status {getSortIcon('days_since_last')}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     <TableRow>
                       <TableCell colSpan={3} className="h-32 text-center">
                         <div className="flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                       </TableCell>
                     </TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group">
                        <TableCell>
                          <button 
                            onClick={() => openClientFolder(client.client_name)}
                            className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
                          >
                            <Folder className="h-4 w-4 fill-blue-50 text-blue-500" />
                            {client.client_name}
                          </button>
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                          {client.last_backup_date ? new Date(client.last_backup_date).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(client.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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

          {view === 'files' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={files.length > 0 && selectedFiles.length === files.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Alteração</TableHead>
                  <TableHead className="w-[100px] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={4} className="h-32 text-center">
                       <div className="flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                     </TableCell>
                   </TableRow>
                ) : filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Esta pasta está vazia.</TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.map((file, idx) => (
                    <TableRow key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedFiles.includes(file.name)}
                          onCheckedChange={() => toggleSelectFile(file.name)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        {file.name}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                        {new Date(file.date).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {file.is_recent ? (
                          <Badge className="bg-green-600 hover:bg-green-700">Recente</Badge>
                        ) : (
                          <Badge className="bg-red-500 hover:bg-red-600">Antigo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>
    </div>
  );
}