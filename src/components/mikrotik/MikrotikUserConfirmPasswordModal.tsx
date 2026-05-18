import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LockKeyhole, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";

const confirmPasswordSchema = z.object({
  password: z.string().min(1, "Informe sua senha."),
});

type ConfirmPasswordFormData = z.infer<typeof confirmPasswordSchema>;

interface MikrotikUserConfirmPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  targetName?: string;
  isLoading?: boolean;
  onConfirm: (password: string) => Promise<void>;
}

export function MikrotikUserConfirmPasswordModal({
  open,
  onOpenChange,
  title,
  targetName,
  isLoading = false,
  onConfirm,
}: MikrotikUserConfirmPasswordModalProps) {
  const { user: currentUser } = useAuth();
  const form = useForm<ConfirmPasswordFormData>({
    resolver: zodResolver(confirmPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ password: "" });
    }
  }, [form, open]);

  const handleSubmit = async (data: ConfirmPasswordFormData) => {
    await onConfirm(data.password);
  };

  const operatorName = currentUser?.full_name || currentUser?.email || "Técnico logado";
  const operatorEmail = currentUser?.email && currentUser.email !== operatorName ? currentUser.email : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <LockKeyhole className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Para concluir esta alteração, confirme sua identidade digitando a senha do técnico logado.
          </p>

          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm dark:border-blue-900/60 dark:bg-blue-950/30">
            <span className="text-xs font-medium uppercase text-blue-700 dark:text-blue-300">Técnico</span>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">{operatorName}</div>
            {operatorEmail && <div className="text-xs text-zinc-500 dark:text-zinc-400">{operatorEmail}</div>}
          </div>

          {targetName && (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Alteração solicitada para</span>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{targetName}</div>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha do técnico</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      placeholder="Digite sua senha de acesso"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
