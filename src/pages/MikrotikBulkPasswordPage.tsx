import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, KeyRound, Loader2, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import { authService } from "@/api/authService";
import { mikrotikUsersService } from "@/api/mikrotikUsersService";
import { MikrotikUserConfirmPasswordModal } from "@/components/mikrotik/MikrotikUserConfirmPasswordModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { setRouterUserPasswordProgress } from "@/lib/routerUserPasswordProgress";
import type { MikrotikRouterUserInventory } from "@/types/mikrotikUsers";

const bulkPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

type BulkPasswordFormData = z.infer<typeof bulkPasswordSchema>;

interface DeviceGroup {
  deviceId: string;
  deviceName: string;
  users: MikrotikRouterUserInventory[];
}

const getSelectionKey = (user: MikrotikRouterUserInventory) => `${user.device_id}:${user.id}`;
const RUNNING_JOB_STATUSES = ["pending", "processing", "retrying"];

const getJobRequesterLabel = (user: MikrotikRouterUserInventory) => {
  return user.job_requested_by_user_name || user.job_requested_by_user_email || null;
};

export default function MikrotikBulkPasswordPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<MikrotikRouterUserInventory[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isConfirmingSystemPassword, setIsConfirmingSystemPassword] = useState(false);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const form = useForm<BulkPasswordFormData>({
    resolver: zodResolver(bulkPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const filteredUsers = useMemo(() => {
    const lower = debouncedSearchTerm.trim().toLowerCase();
    const result = lower
      ? users.filter((user) => {
          return (
            user.device_name.toLowerCase().includes(lower) ||
            user.name.toLowerCase().includes(lower) ||
            String(user.group || "").toLowerCase().includes(lower)
          );
        })
      : users;

    return [...result].sort((a, b) => {
      const deviceCompare = a.device_name.localeCompare(b.device_name);
      if (deviceCompare !== 0) return deviceCompare;
      return a.name.localeCompare(b.name);
    });
  }, [users, debouncedSearchTerm]);

  const groups = useMemo<DeviceGroup[]>(() => {
    const grouped = new Map<string, DeviceGroup>();
    for (const user of filteredUsers) {
      if (!grouped.has(user.device_id)) {
        grouped.set(user.device_id, {
          deviceId: user.device_id,
          deviceName: user.device_name,
          users: [],
        });
      }
      grouped.get(user.device_id)?.users.push(user);
    }
    return Array.from(grouped.values());
  }, [filteredUsers]);

  const selectedUsers = useMemo(() => {
    const selected = new Set(selectedKeys);
    return users.filter((user) => selected.has(getSelectionKey(user))).sort((a, b) => {
      const deviceCompare = a.device_name.localeCompare(b.device_name);
      if (deviceCompare !== 0) return deviceCompare;
      return a.name.localeCompare(b.name);
    });
  }, [selectedKeys, users]);

  const hasRunningJobs = useMemo(() => {
    return users.some((user) => RUNNING_JOB_STATUSES.includes(user.job_status || ""));
  }, [users]);

  const selectedDeviceCount = useMemo(() => {
    return new Set(selectedUsers.map((user) => user.device_id)).size;
  }, [selectedUsers]);

  const visibleKeys = useMemo(() => filteredUsers.map(getSelectionKey), [filteredUsers]);
  const visibleSelectedCount = visibleKeys.filter((key) => selectedKeys.includes(key)).length;
  const allVisibleSelected = visibleKeys.length > 0 && visibleSelectedCount === visibleKeys.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const loadInventory = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true);
    try {
      const data = await mikrotikUsersService.listRouterUsersInventory();
      setUsers(data);
      setSelectedKeys((current) => {
        const availableKeys = new Set(data.map(getSelectionKey));
        return current.filter((key) => availableKeys.has(key));
      });
      setExpandedDeviceIds((current) => {
        const availableDeviceIds = new Set(data.map((user) => user.device_id));
        return current.filter((deviceId) => availableDeviceIds.has(deviceId));
      });
    } catch {
      toast.error("Erro ao carregar inventário de usuários dos roteadores.");
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    if (!hasRunningJobs) return;
    const interval = window.setInterval(() => {
      loadInventory({ silent: true });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [hasRunningJobs]);

  useEffect(() => {
    const runningPasswordUsers = users.filter((user) => (
      user.job_action !== "status" && RUNNING_JOB_STATUSES.includes(user.job_status || "")
    ));
    const activeUser = runningPasswordUsers[0];

    if (!activeUser) return;

    setRouterUserPasswordProgress({
      id: "bulk:running-password-jobs",
      current: 1,
      total: runningPasswordUsers.length,
      deviceName: activeUser.device_name,
      username: activeUser.name,
      items: runningPasswordUsers.map((user) => ({
        device_id: user.device_id,
        routeros_user_id: user.id,
        device_name: user.device_name,
        username: user.name,
      })),
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }, [users]);

  if (!currentUser?.is_root) {
    return <Navigate to="/dashboard" replace />;
  }

  const setUserChecked = (user: MikrotikRouterUserInventory, checked: boolean) => {
    const key = getSelectionKey(user);
    setSelectedKeys((current) => {
      if (checked) return current.includes(key) ? current : [...current, key];
      return current.filter((item) => item !== key);
    });
  };

  const setKeysChecked = (keys: string[], checked: boolean) => {
    setSelectedKeys((current) => {
      if (checked) return Array.from(new Set([...current, ...keys]));
      return current.filter((key) => !keys.includes(key));
    });
  };

  const toggleGroupExpanded = (deviceId: string) => {
    setExpandedDeviceIds((current) => {
      if (current.includes(deviceId)) return current.filter((item) => item !== deviceId);
      return [...current, deviceId];
    });
  };

  const getGroupCheckedState = (group: DeviceGroup) => {
    const groupKeys = group.users.map(getSelectionKey);
    const selectedCount = groupKeys.filter((key) => selectedKeys.includes(key)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === groupKeys.length) return true;
    return "indeterminate";
  };

  const handleChangePasswordClick = () => {
    if (selectedUsers.length === 0) {
      toast.error("Selecione pelo menos um usuário.");
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const handlePasswordSubmit = async (data: BulkPasswordFormData) => {
    setPendingPassword(data.password);
    setIsPasswordDialogOpen(false);
  };

  const handleProtectedAction = async (systemPassword: string) => {
    if (!pendingPassword || selectedUsers.length === 0) return;

    setIsConfirmingSystemPassword(true);
    setIsSubmitting(true);
    try {
      const { step_up_token } = await authService.confirmPassword(systemPassword);
      const startedAt = Date.now();
      const progressItems = selectedUsers.map((selectedUser) => ({
        device_id: selectedUser.device_id,
        routeros_user_id: selectedUser.id,
        device_name: selectedUser.device_name,
        username: selectedUser.name,
      }));

      for (let index = 0; index < selectedUsers.length; index += 1) {
        const selectedUser = selectedUsers[index];
        setRouterUserPasswordProgress({
          id: `bulk:${startedAt}`,
          current: index + 1,
          total: selectedUsers.length,
          deviceName: selectedUser.device_name,
          username: selectedUser.name,
          items: progressItems,
          startedAt,
          updatedAt: Date.now(),
        });
        await mikrotikUsersService.bulkUpdateRouterUserPasswords(
          [{ device_id: selectedUser.device_id, routeros_user_id: selectedUser.id }],
          pendingPassword,
          step_up_token,
        );
      }

      toast.success(`${selectedUsers.length} solicitação(ões) de troca enviada(s).`);
      form.reset({ password: "", confirmPassword: "" });
      setSelectedKeys([]);
      setPendingPassword(null);
      await loadInventory();
    } catch {
      toast.error("Confirmação inválida ou ação não concluída.");
    } finally {
      setIsSubmitting(false);
      setIsConfirmingSystemPassword(false);
    }
  };

  const getJobLabel = (user: MikrotikRouterUserInventory) => {
    if (!user.job_status) return null;
    const action = user.job_action === "status" ? "status" : "senha";
    if (user.job_status === "pending") return action === "senha" ? "Atualizando senha..." : "Atualizando status...";
    if (user.job_status === "processing") return action === "senha" ? "Atualizando senha..." : "Atualizando status...";
    if (user.job_status === "retrying") return action === "senha" ? "Atualizando senha... nova tentativa" : "Atualizando status... nova tentativa";
    if (user.job_status === "completed") {
      const requesterLabel = getJobRequesterLabel(user);
      const requesterText = requesterLabel ? ` por ${requesterLabel}` : "";
      return action === "senha" ? `Senha atualizada${requesterText}` : `Status atualizado${requesterText}`;
    }
    if (user.job_status === "failed") return action === "senha" ? "Não foi possível atualizar a senha" : "Não foi possível atualizar o status";
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <ShieldCheck className="h-4 w-4" />
            Função root
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Troca de senha em massa
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecione clientes e usuários RouterOS para atualizar a senha em segundo plano.
          </p>
        </div>

        <Button variant="outline" onClick={() => loadInventory()} disabled={isLoading || isSubmitting}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Atualizar inventário
        </Button>
      </div>

      <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Pesquisar cliente, usuário ou grupo..."
                className="bg-white pl-9 dark:bg-zinc-950"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{users.length} usuário(s) no inventário</Badge>
              <Badge className="border-blue-700 bg-blue-600 text-white hover:bg-blue-700">
                {selectedDeviceCount} cliente(s), {selectedUsers.length} usuário(s)
              </Badge>
              <Button
                type="button"
                disabled={isSubmitting || selectedUsers.length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleChangePasswordClick}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Mudar senha
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                disabled={isSubmitting || filteredUsers.length === 0}
                onCheckedChange={(checked) => setKeysChecked(visibleKeys, checked === true)}
              />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Selecionar todos</span>
              <span className="text-sm text-zinc-500">({filteredUsers.length} usuário(s) visível(is))</span>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : groups.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                <UserRound className="mb-4 h-12 w-12 opacity-20" />
                <p>Nenhum usuário RouterOS encontrado no inventário atual.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {groups.map((group) => {
                  const groupKeys = group.users.map(getSelectionKey);
                  const groupCheckedState = getGroupCheckedState(group);
                  const isExpanded = expandedDeviceIds.includes(group.deviceId);

                  return (
                    <div key={group.deviceId} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={groupCheckedState}
                          disabled={isSubmitting}
                          onCheckedChange={(checked) => setKeysChecked(groupKeys, checked === true)}
                        />
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
                          onClick={() => toggleGroupExpanded(group.deviceId)}
                          disabled={isSubmitting}
                        >
                          <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{group.deviceName}</div>
                            <div className="truncate text-xs text-zinc-500">{group.users.length} usuário(s)</div>
                          </div>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="ml-10 mt-2 grid gap-2">
                          {group.users.map((routerUser) => (
                            <label
                              key={getSelectionKey(routerUser)}
                              className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            >
                              <Checkbox
                                checked={selectedKeys.includes(getSelectionKey(routerUser))}
                                disabled={isSubmitting}
                                onCheckedChange={(checked) => setUserChecked(routerUser, checked === true)}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{routerUser.name}</span>
                                  {routerUser.is_connection_user && (
                                    <Badge className="border-blue-700 bg-blue-600 text-white hover:bg-blue-700">
                                      conexão
                                    </Badge>
                                  )}
                                </div>
                              <div className="truncate text-xs text-zinc-500">
                                Grupo: {routerUser.group || "-"} · ID RouterOS: {routerUser.id}
                              </div>
                              {getJobLabel(routerUser) && (
                                <div className={`mt-1 flex items-center text-xs font-medium ${routerUser.job_status === "failed" ? "text-red-600" : routerUser.job_status === "completed" ? "text-green-600" : "text-blue-600"}`}>
                                  {RUNNING_JOB_STATUSES.includes(routerUser.job_status || "") && (
                                    <Spinner className="mr-1 h-3 w-3" />
                                  )}
                                  {getJobLabel(routerUser)}
                                </div>
                              )}
                            </div>
                          </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar troca em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja mudar a senha de {selectedDeviceCount} cliente(s) e {selectedUsers.length} usuário(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Não</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                setIsConfirmDialogOpen(false);
                setIsPasswordDialogOpen(true);
              }}
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => !isSubmitting && setIsPasswordDialogOpen(open)}>
        <DialogContent className="sm:max-w-[460px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Definir nova senha
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Confirmar senha
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <MikrotikUserConfirmPasswordModal
        open={!!pendingPassword}
        onOpenChange={(open) => {
          if (!open && !isConfirmingSystemPassword) setPendingPassword(null);
        }}
        title="Confirmar credenciais root"
        targetName={`${selectedDeviceCount} cliente(s), ${selectedUsers.length} usuário(s)`}
        isLoading={isConfirmingSystemPassword}
        onConfirm={handleProtectedAction}
      />
    </div>
  );
}
