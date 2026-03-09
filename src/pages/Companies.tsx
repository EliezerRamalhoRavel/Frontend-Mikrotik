import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2, Trash2, Edit, CheckCircle2, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/api/adminService";
import type { Company } from "@/types/admin";
import { CompanyModal } from "@/components/admin/CompanyModal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { PaginationControl } from "@/components/shared/PaginationControl";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const sortByString = sortConfig ? `${sortConfig.field}:${sortConfig.direction}` : undefined;
      const data = await adminService.getAllCompanies(currentPage, PAGE_SIZE, "", sortByString);
      setCompanies(data.items);
      setTotalPages(data.pages);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar empresas.");
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

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteCompany(companyToDelete.id);
      toast.success("Empresa removida.");
      loadData(page);
    } catch (error) {
      toast.error("Erro ao remover empresa. Verifique se há usuários vinculados.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleCreate = () => { setSelectedCompany(null); setIsModalOpen(true); };
  const handleEdit = (c: Company) => { setSelectedCompany(c); setIsModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Empresas (Tenants)</h1>
          <p className="text-muted-foreground">Gerencie os clientes do sistema.</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nova Empresa
        </Button>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg">Clientes Ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : companies.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground"><Building2 className="mb-2 h-10 w-10 opacity-20" /><p>Nenhuma empresa cadastrada.</p></div>
          ) : (
            <div className="border-b border-zinc-100 dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center">Nome {getSortIcon('name')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('slug')}>
                      <div className="flex items-center">Slug (ID) {getSortIcon('slug')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('is_active')}>
                      <div className="flex items-center">Status {getSortIcon('is_active')}</div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          {c.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-500 font-mono text-xs">{c.slug}</TableCell>
                      <TableCell>
                        {c.is_active ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none"><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</Badge>
                        ) : (
                            <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)} className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
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

      <CompanyModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={() => loadData(page)} companyToEdit={selectedCompany} />
      
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Empresa"
        description={`ATENÇÃO: Isso excluirá TODOS os dados (usuários, dispositivos, logs) da empresa "${companyToDelete?.name}".`}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Excluir Definitivamente"
        variant="destructive"
      />
    </div>
  );
}