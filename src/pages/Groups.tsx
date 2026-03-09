import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Shield, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { managementService } from "@/api/managementService";
import type { Group } from "@/types/management";
import { GroupModal } from "@/components/management/GroupModal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { PaginationControl } from "@/components/shared/PaginationControl";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const data = await managementService.getAllGroups(currentPage, PAGE_SIZE);
      setGroups(data.items);
      setTotalPages(data.pages);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar grupos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(page); }, [page]);

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      await managementService.deleteGroup(groupToDelete.id);
      toast.success("Grupo removido.");
      loadData(page);
    } catch (error) {
      toast.error("Erro ao remover grupo. Verifique se há usuários vinculados.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleCreate = () => { setSelectedGroup(null); setIsModalOpen(true); };
  const handleEdit = (group: Group) => { setSelectedGroup(group); setIsModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Grupos de Acesso</h1>
          <p className="text-muted-foreground">Defina papéis e permissões do sistema.</p>
        </div>
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Grupo
        </Button>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg">Perfis Ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
          ) : groups.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground"><Shield className="mb-2 h-10 w-10 opacity-20" /><p>Nenhum grupo cadastrado.</p></div>
          ) : (
            <div className="border-b border-zinc-100 dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                    <TableHead>Nome</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-500" />
                          {g.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[500px]">
                            {g.permissions && g.permissions.length > 0 ? (
                                g.permissions.slice(0, 5).map(p => (
                                    <Badge key={p.id} variant="secondary" className="text-[10px] bg-zinc-100 text-zinc-600 border-zinc-200">
                                        {p.name}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-zinc-400 text-xs italic">Sem permissões</span>
                            )}
                            {g.permissions && g.permissions.length > 5 && (
                                <Badge variant="outline" className="text-[10px]">+ {g.permissions.length - 5}</Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(g)} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(g)} className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
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

      <GroupModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={() => loadData(page)} groupToEdit={selectedGroup} />
      
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Grupo"
        description={`Tem certeza que deseja remover o grupo "${groupToDelete?.name}"?`}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}