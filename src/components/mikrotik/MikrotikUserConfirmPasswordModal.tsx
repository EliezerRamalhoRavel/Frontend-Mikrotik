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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <LockKeyhole className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {targetName && (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{targetName}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirma sua senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" disabled={isLoading} {...field} />
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
