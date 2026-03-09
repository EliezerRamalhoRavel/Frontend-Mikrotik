import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Shield, CheckSquare, Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { managementService } from "@/api/managementService";
import type { Group, Permission } from "@/types/management";

const formSchema = z.object({
  name: z.string().min(3, "Nome do grupo é obrigatório"),
  permission_ids: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface GroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  groupToEdit?: Group | null;
}

export function GroupModal({ open, onOpenChange, onSuccess, groupToEdit }: GroupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: "", 
      permission_ids: [] 
    },
  });

  useEffect(() => {
    const fetchPerms = async () => {
        try {
            const data = await managementService.getAllPermissions();
            setPermissions(data);
        } catch (error) {
            console.error("Erro ao carregar permissões", error);
        }
    };
    if (open) fetchPerms();
  }, [open]);

  useEffect(() => {
    if (groupToEdit) {
      form.reset({
        name: groupToEdit.name,
        permission_ids: groupToEdit.permissions.map(p => p.id),
      });
    } else {
      form.reset({ name: "", permission_ids: [] });
    }
  }, [groupToEdit, open, form]);

  // Agrupamento de Permissões por Recurso (ex: 'user', 'group', 'audit')
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach(perm => {
        // Assume padrão "recurso:acao"
        const [resource] = perm.name.split(':');
        if (!groups[resource]) groups[resource] = [];
        groups[resource].push(perm);
    });
    return groups;
  }, [permissions]);

  // Funções de Preset
  const applyPreset = (type: 'admin' | 'readonly' | 'none') => {
    if (type === 'none') {
        form.setValue('permission_ids', []);
        return;
    }

    if (type === 'admin') {
        const allIds = permissions.map(p => p.id);
        form.setValue('permission_ids', allIds);
        return;
    }

    if (type === 'readonly') {
        // Seleciona tudo que termina com :read ou :view
        const readIds = permissions
            .filter(p => p.name.endsWith(':read') || p.name.endsWith(':view') || p.name.endsWith(':list'))
            .map(p => p.id);
        form.setValue('permission_ids', readIds);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (groupToEdit) {
        await managementService.updateGroup(groupToEdit.id, data);
        toast.success("Grupo atualizado com sucesso!");
      } else {
        await managementService.createGroup(data);
        toast.success("Grupo criado com sucesso!");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Erro ao salvar.";
      const errorDetail = Array.isArray(msg) ? msg[0].msg : msg;
      toast.error(errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Shield className="h-5 w-5 text-purple-500" />
            {groupToEdit ? "Editar Grupo" : "Novo Grupo"}
          </DialogTitle>
          <DialogDescription>
            Configure as permissões de acesso para este grupo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col overflow-hidden">
            
            {/* Nome do Grupo */}
            <div className="px-1">
                <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Nome do Grupo</FormLabel>
                    <FormControl>
                    <div className="relative">
                        <CheckSquare className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input placeholder="Ex: Financeiro" className="pl-9" {...field} />
                    </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )} />
            </div>

            {/* Área de Seleção de Permissões */}
            <div className="flex flex-col flex-1 overflow-hidden border rounded-md border-zinc-200 dark:border-zinc-800">
                
                {/* Toolbar de Presets */}
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Definição Rápida</span>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('none')} className="h-7 text-xs">
                            <XCircle className="mr-1 h-3 w-3" /> Limpar
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('readonly')} className="h-7 text-xs">
                            <Eye className="mr-1 h-3 w-3" /> Apenas Leitura
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('admin')} className="h-7 text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/40">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Acesso Total
                        </Button>
                    </div>
                </div>

                {/* Lista Agrupada */}
                <ScrollArea className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(groupedPermissions).map(([resource, perms]) => (
                            <div key={resource} className="space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                                    <Badge variant="secondary" className="capitalize">{resource}</Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {perms.map((perm) => (
                                        <FormField
                                            key={perm.id}
                                            control={form.control}
                                            name="permission_ids"
                                            render={({ field }) => {
                                                const isChecked = field.value?.includes(perm.id);
                                                // Tenta extrair a ação do nome (ex: user:write -> write)
                                                const actionLabel = perm.name.split(':')[1] || perm.name;
                                                
                                                return (
                                                    <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border border-transparent p-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, perm.id])
                                                                        : field.onChange(field.value?.filter((value) => value !== perm.id))
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="text-sm font-normal cursor-pointer capitalize">
                                                                {actionLabel}
                                                            </FormLabel>
                                                            {perm.description && (
                                                                <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                                                            )}
                                                        </div>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 text-white">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Grupo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}