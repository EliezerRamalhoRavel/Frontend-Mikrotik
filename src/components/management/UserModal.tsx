import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, User, Mail, Lock, Building2, Shield, KeyRound, Clock, RefreshCw, Calendar, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { managementService, type Company } from "@/api/managementService";
import type { User as IUser, Group } from "@/types/management";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  full_name: z.string().min(3, "Nome completo obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  company_id: z.string().optional(),
  role: z.enum(["admin", "user"]),
  mfa_setup_required: z.boolean(),
  mfa_expiration_hours: z.number().min(1, "Mínimo 1 hora"),
});

type FormValues = z.infer<typeof formSchema>;

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userToEdit?: IUser | null;
}

export function UserModal({ open, onOpenChange, onSuccess, userToEdit }: UserModalProps) {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingMfa, setIsResettingMfa] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]); 
  
  const isRoot = currentUser?.is_root || false;
  const isSelf = userToEdit?.id === currentUser?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      full_name: "", 
      email: "", 
      password: "", 
      role: "user", 
      company_id: "",
      mfa_setup_required: false,
      mfa_expiration_hours: 24,
    },
  });

  const selectedCompanyId = form.watch("company_id");

  useEffect(() => {
    if (open && isRoot && !userToEdit) {
        managementService.getAllCompanies()
            .then(data => setCompanies(data))
            .catch(err => console.error(err));
    }
  }, [open, isRoot, userToEdit]);

  useEffect(() => {
    if (!open) return;
    const fetchGroups = async () => {
      let targetCompanyId = undefined;
      if (isRoot) {
          if (userToEdit) targetCompanyId = userToEdit.company_id;
          else if (selectedCompanyId) targetCompanyId = selectedCompanyId;
          else { setAvailableGroups([]); return; }
      }
      try {
        const data = await managementService.getAllGroups(1, 100, targetCompanyId);
        setAvailableGroups(data.items);
      } catch (error) {
        console.error(error);
      }
    };
    fetchGroups();
  }, [open, selectedCompanyId, isRoot, userToEdit]);

  useEffect(() => {
    if (open) {
      if (userToEdit) {
          const userGroupName = userToEdit.groups[0]?.name || "";
          const role = userGroupName === "Administradores" ? "admin" : "user";
          form.reset({
              full_name: userToEdit.full_name,
              email: userToEdit.email,
              password: "",
              role: role as "admin" | "user",
              company_id: userToEdit.company_id,
              mfa_setup_required: userToEdit.mfa_setup_required,
              mfa_expiration_hours: userToEdit.mfa_expiration_hours,
          });
      } else {
          form.reset({ 
              full_name: "", 
              email: "", 
              password: "", 
              role: "user",
              company_id: isRoot ? "" : currentUser?.company_id,
              mfa_setup_required: false,
              mfa_expiration_hours: 24,
          });
      }
    }
  }, [userToEdit, open, form, isRoot, currentUser]);

  const handleResetMfa = async () => {
    if (!userToEdit) return;
    if (!confirm(`Deseja resetar o segundo fator (MFA) de ${userToEdit.full_name}? O usuário terá que configurar um novo dispositivo no próximo acesso.`)) return;

    setIsResettingMfa(true);
    try {
      await managementService.resetUserMfa(userToEdit.id);
      toast.success("MFA resetado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao resetar MFA.");
    } finally {
      setIsResettingMfa(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const targetGroupName = data.role === 'admin' ? 'Administradores' : 'Operadores';
    const targetGroup = availableGroups.find(g => g.name === targetGroupName);

    if (!targetGroup) {
        toast.error(`Erro: Grupo "${targetGroupName}" não encontrado.`);
        setIsLoading(false);
        return;
    }

    try {
      if (userToEdit) {
        await managementService.updateUser(userToEdit.id, {
          full_name: data.full_name,
          group_ids: [targetGroup.id],
          mfa_setup_required: data.mfa_setup_required,
          mfa_expiration_hours: data.mfa_expiration_hours,
          ...(data.password ? { password: data.password } : {})
        });
        toast.success("Usuário atualizado!");
      } else {
        if (!data.password) { toast.error("Senha obrigatória."); setIsLoading(false); return; }
        const targetCId = isRoot ? data.company_id : currentUser?.company_id;
        if (!targetCId) { toast.error("Selecione um Tenant."); setIsLoading(false); return; }

        await managementService.createUser({
          full_name: data.full_name,
          email: data.email,
          password: data.password,
          group_ids: [targetGroup.id],
          company_id: targetCId,
          mfa_setup_required: data.mfa_setup_required,
          mfa_expiration_hours: data.mfa_expiration_hours
        });
        toast.success("Usuário salvo com sucesso!");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail?.message || "Erro ao salvar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <User className="h-5 w-5 text-blue-500" />
            {userToEdit ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription>
            Configurações de acesso e segurança. Autofill desativado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="full_name" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input placeholder="Nome" className="pl-9" {...field} autoComplete="new-password" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input placeholder="E-mail" className="pl-9" {...field} disabled={!!userToEdit} autoComplete="new-password" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            {isRoot && !userToEdit && (
                <FormField control={form.control} name="company_id" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tenant (Empresa)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger className="pl-9 relative">
                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {companies.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Perfil de Acesso</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSelf}>
                        <FormControl>
                        <SelectTrigger className="pl-9 relative">
                            <Shield className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <SelectValue placeholder="Perfil" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="user">Usuário Comum</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Senha {userToEdit && "(Opcional)"}</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input type="password" placeholder="••••••" className="pl-9" {...field} autoComplete="new-password" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <KeyRound className="h-4 w-4 text-purple-500" /> Segurança MFA
                </h4>

                {userToEdit?.mfa_enabled_at ? (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-green-100 dark:border-green-900/30 rounded-md">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-green-600 uppercase">Configurado em:</span>
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                {new Date(userToEdit.mfa_enabled_at).toLocaleString('pt-BR')}
                            </div>
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleResetMfa}
                            disabled={isResettingMfa}
                            className="text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 h-8 text-xs shadow-sm"
                        >
                            {isResettingMfa ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                            Resetar MFA
                        </Button>
                    </div>
                ) : userToEdit && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-md">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                            Autenticação de dois fatores ainda não configurada.
                        </span>
                    </div>
                )}
                
                <FormField control={form.control} name="mfa_setup_required" render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                        <div className="space-y-0.5">
                            <FormLabel className="text-sm">Obrigar Configuração</FormLabel>
                            <FormDescription className="text-[10px]">QR Code no próximo login.</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )} />

                <FormField control={form.control} name="mfa_expiration_hours" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm">Expiração (Horas)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input type="number" className="pl-9" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                {userToEdit ? "Salvar Alterações" : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}