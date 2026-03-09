import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Building2, Link } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { adminService } from "@/api/adminService";
import type { Company } from "@/types/admin";

const formSchema = z.object({
  name: z.string().min(3, "Nome da empresa obrigatório"),
  slug: z.string().min(3, "Identificador (slug) obrigatório")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens."),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyToEdit?: Company | null;
}

export function CompanyModal({ open, onOpenChange, onSuccess, companyToEdit }: CompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (companyToEdit) {
      form.reset({ name: companyToEdit.name, slug: companyToEdit.slug });
    } else {
      form.reset({ name: "", slug: "" });
    }
  }, [companyToEdit, open, form]);

  // Slugify automático simples
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    
    if (!companyToEdit) { // Apenas cria slug automático na criação
        const slug = name.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
        form.setValue("slug", slug);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (companyToEdit) {
        await adminService.updateCompany(companyToEdit.id, data);
        toast.success("Empresa atualizada!");
      } else {
        await adminService.createCompany(data);
        toast.success("Empresa criada com sucesso!");
        // O backend já cria os grupos "Administradores" e "Operadores" automaticamente
        toast.info("Grupos de acesso padrão configurados.");
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
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Building2 className="h-5 w-5 text-blue-500" />
            {companyToEdit ? "Editar Empresa" : "Nova Empresa"}
          </DialogTitle>
          <DialogDescription>
            Cadastre o cliente (Tenant). Perfis de acesso serão gerados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input placeholder="Ex: Cliente A" className="pl-9" {...field} onChange={handleNameChange} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificador (Slug)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Link className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input placeholder="cliente-a" className="pl-9 font-mono bg-zinc-50 dark:bg-zinc-800/50" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )} />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}