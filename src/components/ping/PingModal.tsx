import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Activity } from "lucide-react"; // Troquei Plus por Save/Activity
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { pingService } from "@/api/pingService";
import type { PingTarget, PingTargetCreate, PingTargetUpdate } from "@/types/ping";

const formSchema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  target: z.string().min(1, "IP obrigatório"),
  packet_count: z.preprocess((val) => Number(val), z.number().min(1).default(30)),
  is_active: z.string().default("true"),
});

type FormValues = {
    name: string;
    target: string;
    packet_count: string | number;
    is_active: string;
};

interface PingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  targetToEdit?: PingTarget | null;
}

export function PingModal({ open, onOpenChange, onSuccess, targetToEdit }: PingModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { 
      name: "", 
      target: "", 
      packet_count: 30, 
      is_active: "true"
    },
  });

  useEffect(() => {
    if (open) {
        if (targetToEdit) {
            form.reset({
                name: targetToEdit.name,
                target: targetToEdit.target,
                packet_count: targetToEdit.packet_count,
                is_active: targetToEdit.is_active ? "true" : "false"
            });
        } else {
            form.reset({ 
                name: "", 
                target: "", 
                packet_count: 30, 
                is_active: "true" 
            });
        }
    }
  }, [targetToEdit, open, form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        target: data.target,
        is_active: data.is_active === "true", 
        packet_count: Number(data.packet_count)
      };

      if (targetToEdit) {
        await pingService.update(targetToEdit.id, payload as PingTargetUpdate);
        toast.success("Alvo atualizado!");
      } else {
        await pingService.create(payload as PingTargetCreate);
        toast.success("Alvo adicionado!");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro API:", error); 
      const msg = error.response?.data?.detail || "Erro ao salvar.";
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        
        {/* Cabeçalho Padrão */}
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Activity className="h-5 w-5 text-blue-600" />
            {targetToEdit ? "Editar Monitoramento" : "Novo Monitoramento"}
          </DialogTitle>
          <DialogDescription>
            Configure o host e os parâmetros de verificação de latência.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
            {/* @ts-ignore */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Cliente / Host</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Servidor Google" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="target" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endereço IP</FormLabel>
                            <FormControl>
                                <Input placeholder="8.8.8.8" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="is_active" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
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

                    <FormField control={form.control} name="packet_count" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantidade de tentativas de ping</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(e.target.value)} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[100px]">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}