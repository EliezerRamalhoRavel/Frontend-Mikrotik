import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users, Trash2, Edit, UserCheck, Shield, Crown, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { managementService } from "@/api/managementService";
import type { User } from "@/types/management";
import { UserModal } from "@/components/management/UserModal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isRoot = currentUser?.is_root;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await managementService.getAllUsers(1, 100);
      setUsers(data.items);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar usuários.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser?.id) {
        toast.error("Você não pode se auto-excluir.");
        return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await managementService.deleteUser(userToDelete.id);
      toast.success("Usuário removido.");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover usuário.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleCreate = () => { setSelectedUser(null); setIsModalOpen(true); };
  const handleEdit = (user: User) => { setSelectedUser(user); setIsModalOpen(true); };

  const getUserRoleLabel = (user: User) => {
      if (user.is_root) return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Crown className="h-3 w-3 mr-1" /> Super Admin</Badge>;
      
      const groupName = user.groups[0]?.name;
      if (groupName === 'Administradores') return <Badge className="bg-purple-100 text-purple-700 border-purple-200"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>;
      return <Badge variant="secondary" className="text-zinc-500">Usuário</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Usuários</h1>
          <p className="text-muted-foreground">Gerencie o acesso à plataforma.</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg">Equipe Cadastrada {isRoot && "(Global)"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : users.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground"><Users className="mb-2 h-10 w-10 opacity-20" /><p>Nenhum usuário encontrado.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-center">MFA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                            {u.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                            <span>{u.full_name}</span>
                            {isRoot && <span className="text-[10px] text-zinc-400 font-mono">{u.company_id}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500">{u.email}</TableCell>
                    <TableCell>
                        {getUserRoleLabel(u)}
                    </TableCell>
                    <TableCell className="text-center">
                        {u.mfa_enabled_at ? (
                            <div className="flex flex-col items-center gap-0.5 text-green-600" title={`Ativado em: ${new Date(u.mfa_enabled_at).toLocaleString()}`}>
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-[9px] font-bold">ATIVO</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-0.5 text-zinc-300">
                                <ShieldAlert className="h-4 w-4" />
                                <span className="text-[9px] font-bold">PENDENTE</span>
                            </div>
                        )}
                    </TableCell>
                    <TableCell>
                        {u.is_active ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none"><UserCheck className="h-3 w-3 mr-1" /> Ativo</Badge>
                        ) : (
                            <Badge variant="destructive">Inativo</Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(u)} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(u)} className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" disabled={u.is_root}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={loadData} userToEdit={selectedUser} />
      
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Usuário"
        description={`Tem certeza que deseja remover "${userToDelete?.full_name}"?`}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}