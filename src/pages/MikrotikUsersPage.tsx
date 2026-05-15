import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Router,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { authService } from "@/api/authService";
import { mikrotikService } from "@/api/mikrotikService";
import { mikrotikUsersService } from "@/api/mikrotikUsersService";
import { MikrotikUserConfirmPasswordModal } from "@/components/mikrotik/MikrotikUserConfirmPasswordModal";
import { MikrotikUserPasswordModal } from "@/components/mikrotik/MikrotikUserPasswordModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/useDebounce";
import type { Mikrotik } from "@/types/mikrotik";
import type { MikrotikUser } from "@/types/mikrotikUsers";

type PendingAction =
  | { kind: "toggle"; user: MikrotikUser }
  | { kind: "password"; user: MikrotikUser; password: string };

export default function MikrotikUsersPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<Mikrotik | null>(null);
  const [users, setUsers] = useState<MikrotikUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [passwordUser, setPasswordUser] = useState<MikrotikUser | null>(null);
  const [actionUser, setActionUser] = useState<MikrotikUser | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isConfirmingPassword, setIsConfirmingPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ field: "name" | "group" | "address" | "last_logged_in" | "status"; direction: "asc" | "desc" } | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const hasUsers = useMemo(() => users.length > 0, [users.length]);

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (debouncedSearchTerm) {
      const lower = debouncedSearchTerm.toLowerCase();
      result = result.filter((user) => user.name.toLowerCase().includes(lower));
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;
        const getValue = (user: MikrotikUser) => {
          if (sortConfig.field === "status") return user.disabled ? "desativado" : "ativo";
          return String(user[sortConfig.field] || "").toLowerCase();
        };
        return getValue(a).localeCompare(getValue(b)) * direction;
      });
    }

    return result;
  }, [users, debouncedSearchTerm, sortConfig]);

  const hasFilteredUsers = filteredUsers.length > 0;

  const setLoadingFor = (userId: string, value: boolean) => {
    setRowLoading((current) => ({ ...current, [userId]: value }));
  };

  const loadData = async () => {
    if (!deviceId) return;
    setIsLoading(true);
    try {
      const [deviceData, userData] = await Promise.all([
        mikrotikService.getById(deviceId),
        mikrotikUsersService.listRouterUsers(deviceId),
      ]);
      setDevice(deviceData);
      setUsers(userData);
    } catch (error) {
      toast.error("Erro ao carregar usuários do roteador.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const handleToggleUser = async (user: MikrotikUser) => {
    if (!deviceId || rowLoading[user.id]) return;

    setPendingAction({ kind: "toggle", user });
    setActionUser(null);
  };

  const handlePasswordChange = async (password: string) => {
    if (!deviceId || !passwordUser) return;

    setPendingAction({ kind: "password", user: passwordUser, password });
    setPasswordUser(null);
  };

  const handleSort = (field: "name" | "group" | "address" | "last_logged_in" | "status") => {
    setSortConfig((current) => {
      if (current?.field === field) {
        if (current.direction === "asc") return { field, direction: "desc" };
        return null;
      }
      return { field, direction: "asc" };
    });
  };

  const getSortIcon = (field: "name" | "group" | "address" | "last_logged_in" | "status") => {
    if (sortConfig?.field !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === "asc"
      ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" />
      : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />;
  };

  const handleProtectedAction = async (systemPassword: string) => {
    if (!deviceId || !pendingAction) return;

    const currentAction = pendingAction;
    setIsConfirmingPassword(true);
    setLoadingFor(currentAction.user.id, true);

    try {
      const { step_up_token } = await authService.confirmPassword(systemPassword);

      if (currentAction.kind === "toggle") {
        await mikrotikUsersService.updateRouterUser(
          deviceId,
          currentAction.user.id,
          { disabled: !currentAction.user.disabled },
          step_up_token,
        );
        setUsers((current) => current.map((item) => (
          item.id === currentAction.user.id ? { ...item, disabled: !currentAction.user.disabled } : item
        )));
        toast.success(currentAction.user.disabled ? "Usuário habilitado." : "Usuário desabilitado.");
      } else {
        await mikrotikUsersService.updateRouterUser(
          deviceId,
          currentAction.user.id,
          { password: currentAction.password },
          step_up_token,
        );
        toast.success("Senha alterada com sucesso.");
      }

      setPendingAction(null);
    } catch (error) {
      toast.error("Confirmação inválida ou ação não concluída.");
    } finally {
      setLoadingFor(currentAction.user.id, false);
      setIsConfirmingPassword(false);
    }
  };

  const getConfirmTitle = () => {
    if (pendingAction?.kind === "password") return "Confirmar alteração de senha";
    return pendingAction?.user.disabled ? "Confirmar habilitação" : "Confirmar desabilitação";
  };

  const getStatusBadge = (user: MikrotikUser) => {
    if (user.disabled) {
      return (
        <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-500">
          <EyeOff className="mr-1 h-3 w-3" />
          Desativado
        </Badge>
      );
    }

    return (
      <Badge className="border-green-700 bg-green-600 text-white hover:bg-green-700">
        <Eye className="mr-1 h-3 w-3" />
        Ativo
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm font-medium space-x-2">
        <button
          onClick={() => navigate("/mikrotiks")}
          className="flex items-center text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Dispositivos
        </button>

        <ChevronRight className="h-4 w-4 text-zinc-400" />
        <span className="text-zinc-900 dark:text-zinc-100 font-bold flex min-w-0 items-center gap-2">
          <Router className="h-4 w-4 text-blue-600" />
          <span className="truncate">{device?.name || "MikroTik"}</span>
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Usuários - {device?.name || "MikroTik"}
          </h1>
          <p className="text-sm text-muted-foreground">{device?.ip_address || "Carregando dispositivo..."}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardContent className="p-0">
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Pesquisar usuário..."
                className="pl-9 bg-white dark:bg-zinc-950"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !hasUsers || !hasFilteredUsers ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <UserRound className="mb-4 h-12 w-12 opacity-20" />
              <p>{hasUsers ? "Nenhum usuário do roteador encontrado com os filtros atuais." : "Nenhum usuário do roteador encontrado."}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort("name")}>
                    <div className="flex items-center">Usuário {getSortIcon("name")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort("group")}>
                    <div className="flex items-center">Grupo {getSortIcon("group")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort("address")}>
                    <div className="flex items-center">Endereço permitido {getSortIcon("address")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort("last_logged_in")}>
                    <div className="flex items-center">Último login {getSortIcon("last_logged_in")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort("status")}>
                    <div className="flex items-center">Status {getSortIcon("status")}</div>
                  </TableHead>
                  <TableHead className="w-[110px] text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isRowLoading = !!rowLoading[user.id];

                  return (
                    <TableRow key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</span>
                          {user.id && (
                            <span className="max-w-[420px] truncate text-xs text-zinc-500" title={user.id}>
                              ID RouterOS: {user.id}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.group || <span className="text-zinc-300">-</span>}</TableCell>
                      <TableCell>{user.address || <span className="text-zinc-300">-</span>}</TableCell>
                      <TableCell>{user.last_logged_in || <span className="text-zinc-300">-</span>}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isRowLoading}
                            onClick={() => setActionUser(user)}
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                            title="Editar ações"
                          >
                            {isRowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MikrotikUserPasswordModal
        open={!!passwordUser}
        onOpenChange={(open) => !open && setPasswordUser(null)}
        user={passwordUser}
        isLoading={passwordUser ? !!rowLoading[passwordUser.id] : false}
        onConfirm={handlePasswordChange}
      />

      <Dialog open={!!actionUser} onOpenChange={(open) => !open && setActionUser(null)}>
        <DialogContent className="sm:max-w-[460px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Edit className="h-5 w-5 text-blue-600" />
              Ações do usuário
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{actionUser?.name}</span>
          </div>

          <div className="grid gap-2">
            {actionUser?.disabled ? (
              <Button
                variant="outline"
                className="justify-start"
                disabled={actionUser ? !!rowLoading[actionUser.id] : false}
                onClick={() => actionUser && handleToggleUser(actionUser)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Habilitar usuário
              </Button>
            ) : (
              <Button
                variant="outline"
                className="justify-start"
                disabled={actionUser ? !!rowLoading[actionUser.id] : false}
                onClick={() => actionUser && handleToggleUser(actionUser)}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Desabilitar usuário
              </Button>
            )}

            <Button
              variant="outline"
              className="justify-start"
              disabled={actionUser ? !!rowLoading[actionUser.id] : false}
              onClick={() => {
                setPasswordUser(actionUser);
                setActionUser(null);
              }}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Mudar senha
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActionUser(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MikrotikUserConfirmPasswordModal
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open && !isConfirmingPassword) setPendingAction(null);
        }}
        title={getConfirmTitle()}
        targetName={pendingAction?.user.name}
        isLoading={isConfirmingPassword}
        onConfirm={handleProtectedAction}
      />
    </div>
  );
}
