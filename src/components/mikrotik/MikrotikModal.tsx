import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Router } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { mikrotikService } from "@/api/mikrotikService";
import type { Mikrotik, MikrotikCreate, MikrotikUpdate } from "@/types/mikrotik";

const formSchema = z.object({
  name: z.string().min(3, "Nome do Cliente é obrigatório"),
  ip_address: z.string().min(1, "IP ou DDNS é obrigatório"),
  port: z.coerce.number().min(1).max(65535),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().optional(),
  
  is_active: z.boolean(),
  is_management_active: z.boolean(),
  
  model: z.string().optional(),
  firmware_version: z.string().optional(),
  interface_1: z.string().optional(),
  interface_2: z.string().optional(),
  
  has_vpn: z.boolean(),
  vpn_amount: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface MikrotikModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mikrotikToEdit?: Mikrotik | null;
}

export function MikrotikModal({ 
  open, 
  onOpenChange, 
  onSuccess, 
  mikrotikToEdit 
}: MikrotikModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, 
    defaultValues: {
      name: "",
      ip_address: "",
      port: 8728,
      username: "admin",
      password: "",
      is_active: true,
      is_management_active: true,
      model: "",
      firmware_version: "",
      interface_1: "",
      interface_2: "",
      has_vpn: false,
      vpn_amount: 0,
    },
  });

  useEffect(() => {
    if (open) {
        if (mikrotikToEdit) {
            form.reset({
                name: mikrotikToEdit.name,
                ip_address: mikrotikToEdit.ip_address,
                port: mikrotikToEdit.port,
                username: mikrotikToEdit.username,
                password: "", 
                is_active: mikrotikToEdit.is_active,
                is_management_active: mikrotikToEdit.is_management_active,
                model: mikrotikToEdit.model || "",
                firmware_version: mikrotikToEdit.firmware_version || "",
                interface_1: mikrotikToEdit.interface_1 || "",
                interface_2: mikrotikToEdit.interface_2 || "",
                has_vpn: mikrotikToEdit.has_vpn,
                vpn_amount: mikrotikToEdit.vpn_amount || 0,
            });
        } else {
            form.reset({
                name: "",
                ip_address: "",
                port: 8728,
                username: "admin",
                password: "",
                is_active: true,
                is_management_active: true,
                model: "",
                firmware_version: "",
                interface_1: "",
                interface_2: "",
                has_vpn: false,
                vpn_amount: 0,
            });
        }
    }
  }, [mikrotikToEdit, open, form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const cleanData = {
          ...data,
          password: data.password || undefined,
          model: data.model || undefined,
          firmware_version: data.firmware_version || undefined,
          interface_1: data.interface_1 || undefined,
          interface_2: data.interface_2 || undefined,
      };

      if (mikrotikToEdit) {
        await mikrotikService.update(mikrotikToEdit.id, cleanData as MikrotikUpdate);
        toast.success("Dispositivo atualizado com sucesso!");
      } else {
        if (!data.password) {
            toast.error("A senha é obrigatória para novos dispositivos.");
            setIsLoading(false);
            return;
        }
        await mikrotikService.create(cleanData as MikrotikCreate);
        toast.success("Dispositivo criado com sucesso!");
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erro ao salvar.";
      const errorDetail = Array.isArray(msg) ? msg[0].msg : msg;
      toast.error(errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Removido bordas roxas e backgrounds escuros */}
      <DialogContent className="sm:max-w-[900px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho Padrão (Sem fundo roxo) */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            <Router className="h-5 w-5 text-blue-600" />
            {mikrotikToEdit ? "Editar Dispositivo" : "Novo Dispositivo"}
          </DialogTitle>
          <DialogDescription>
            Configure os dados de conexão e monitoramento do equipamento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            
            {/* LINHA 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome do Cliente</FormLabel>
                        <FormControl><Input {...field} placeholder="Ex: Cliente A" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="ip_address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Endereço IP / DDNS</FormLabel>
                        <FormControl><Input {...field} placeholder="192.168.88.1" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Monitoramento</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val === 'true')} value={field.value ? 'true' : 'false'}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="true">Ativo</SelectItem>
                                <SelectItem value="false">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            {/* LINHA 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Modelo (Opcional)</FormLabel>
                        <FormControl><Input {...field} placeholder="RB750Gr3" value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="firmware_version" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Firmware</FormLabel>
                        <FormControl><Input {...field} placeholder="7.12" value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="is_management_active" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gestão</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val === 'true')} value={field.value ? 'true' : 'false'}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="true">Ativo</SelectItem>
                                <SelectItem value="false">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            {/* LINHA 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Usuário</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Senha API</FormLabel>
                        <FormControl><Input type="password" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="interface_1" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Interface WAN 1</FormLabel>
                        <FormControl><Input {...field} placeholder="ether1 - Link Principal" value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            {/* LINHA 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="interface_2" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Interface WAN 2</FormLabel>
                        <FormControl><Input {...field} placeholder="ether2 - Link Backup" value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="has_vpn" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Possui VPN?</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val === 'true')} value={field.value ? 'true' : 'false'}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="true">Sim</SelectItem>
                                <SelectItem value="false">Não</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="vpn_amount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Qtd. Túneis</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                {...field} 
                                onChange={e => field.onChange(e.target.valueAsNumber)} 
                                value={field.value} 
                                disabled={!form.watch("has_vpn")}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            {/* Oculto: Porta (Padrão 8728) */}
            <FormField control={form.control} name="port" render={({ field }) => (
                <input type="hidden" {...field} />
            )} />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                {mikrotikToEdit ? "Salvar Alterações" : "Adicionar Dispositivo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}