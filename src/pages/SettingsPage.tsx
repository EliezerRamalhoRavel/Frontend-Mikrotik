import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Server, Activity, Database, Cpu } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch"; 
import { Separator } from "@/components/ui/separator";

import { settingsService, SettingsData } from "@/api/settingsService";

const emptyStringToUndefined = z.literal('').transform(() => undefined);
const optionalString = z.string().optional().nullable().or(emptyStringToUndefined);

const formSchema = z.object({
  ativar_monitoramento_mikrotiks: z.enum(['sim', 'nao']),
  intervalo_tentativas_mikrotiks: z.number().min(60),
  repetir_tentativa_mikrotiks: z.number().min(1),
  notificacoes_email_mikrotiks: z.enum(['sim', 'nao']),
  endereco_email_mikrotiks: optionalString,
  titulo_email_mikrotiks: optionalString,
  notificacoes_teams_mikrotiks: z.enum(['sim', 'nao']),
  url_webhook_mikrotiks: optionalString,
  url_webhook_mikrotiks_secundario: optionalString,

  ativar_monitoramento_ping: z.enum(['sim', 'nao']),
  intervalo_tentativas_ping: z.number().min(10),
  repetir_tentativa_ping: z.number().min(1),
  notificacoes_email_ping: z.enum(['sim', 'nao']),
  endereco_email_ping: optionalString,
  titulo_email_ping: optionalString,
  notificacoes_teams_ping: z.enum(['sim', 'nao']),
  url_webhook_ping: optionalString,

  ativar_monitoramento_backups: z.enum(['sim', 'nao']),
  tempo_saudavel_backup: z.number().min(1),
  tempo_nao_saudavel_backup: z.number().min(1),
  notificacoes_email_backups: z.enum(['sim', 'nao']),
  endereco_email_backups: optionalString,
  titulo_email_backups: optionalString,
  notificacoes_teams_backups: z.enum(['sim', 'nao']),
  url_webhook_backups: optionalString,

  ativar_monitoramento_firmware: z.enum(['sim', 'nao']),
  intervalo_tentativas_firmware: z.number().min(1),
  notificacoes_email_firmware: z.enum(['sim', 'nao']),
  endereco_email_firmware: optionalString,
  titulo_email_firmware: optionalString,
  notificacoes_teams_firmware: z.enum(['sim', 'nao']),
  url_webhook_firmware: optionalString,
});

type SettingsFormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ativar_monitoramento_mikrotiks: 'nao',
      intervalo_tentativas_mikrotiks: 300,
      repetir_tentativa_mikrotiks: 3,
      notificacoes_email_mikrotiks: 'nao',
      endereco_email_mikrotiks: '',
      titulo_email_mikrotiks: '',
      notificacoes_teams_mikrotiks: 'nao',
      url_webhook_mikrotiks: '',
      url_webhook_mikrotiks_secundario: '',
      ativar_monitoramento_ping: 'nao',
      intervalo_tentativas_ping: 60,
      repetir_tentativa_ping: 3,
      notificacoes_email_ping: 'nao',
      endereco_email_ping: '',
      titulo_email_ping: '',
      notificacoes_teams_ping: 'nao',
      url_webhook_ping: '',
      ativar_monitoramento_backups: 'nao',
      tempo_saudavel_backup: 1,
      tempo_nao_saudavel_backup: 3,
      notificacoes_email_backups: 'nao',
      endereco_email_backups: '',
      titulo_email_backups: '',
      notificacoes_teams_backups: 'nao',
      url_webhook_backups: '',
      ativar_monitoramento_firmware: 'nao',
      intervalo_tentativas_firmware: 24,
      notificacoes_email_firmware: 'nao',
      endereco_email_firmware: '',
      titulo_email_firmware: '',
      notificacoes_teams_firmware: 'nao',
      url_webhook_firmware: '',
    }
  });

  const loadSettings = async () => {
    try {
      const data = await settingsService.get();
      const defaults = form.control._defaultValues;
      const mergedData = { ...defaults, ...data };
      
      const sanitizedData = Object.fromEntries(
        Object.entries(mergedData).map(([key, value]) => [
          key, 
          value === null || value === undefined ? (typeof defaults[key as keyof typeof defaults] === 'number' ? 0 : '') : value
        ])
      );

      form.reset(sanitizedData as any);
    } catch (error) {
      toast.error("Erro ao carregar configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      await settingsService.update(data as unknown as SettingsData);
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar. Verifique o console.");
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.dir(errors);
    const firstErrorField = Object.keys(errors)[0];
    toast.error(`Erro de validação no campo: ${firstErrorField}`);
  };

  if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const renderNotificationFields = (type: string) => {
    const emailSwitch = `notificacoes_email_${type}` as keyof SettingsFormValues;
    const emailAddress = `endereco_email_${type}` as keyof SettingsFormValues;
    const emailTitle = `titulo_email_${type}` as keyof SettingsFormValues;
    const teamsSwitch = `notificacoes_teams_${type}` as keyof SettingsFormValues;
    const webhook = (type === 'mikrotiks' ? 'url_webhook_mikrotiks' : `url_webhook_${type}`) as keyof SettingsFormValues;

    return (
      <div className="grid gap-6 md:grid-cols-2 mt-4">
        <div className="space-y-4 border p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-900/50">
          <FormField
            control={form.control}
            name={emailSwitch}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-white dark:bg-zinc-900">
                <FormLabel>Notificações por E-mail</FormLabel>
                <FormControl>
                  <Switch checked={field.value === 'sim'} onCheckedChange={(val) => field.onChange(val ? 'sim' : 'nao')} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={emailAddress}
            render={({ field }) => (
              <FormItem className={form.watch(emailSwitch) === 'nao' ? 'opacity-50 pointer-events-none' : ''}>
                <FormLabel>Destinatários</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} placeholder="email@exemplo.com" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={emailTitle}
            render={({ field }) => (
              <FormItem className={form.watch(emailSwitch) === 'nao' ? 'opacity-50 pointer-events-none' : ''}>
                <FormLabel>Assunto do E-mail</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-900/50">
          <FormField
            control={form.control}
            name={teamsSwitch}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-white dark:bg-zinc-900">
                <FormLabel>Notificações Teams</FormLabel>
                <FormControl>
                  <Switch checked={field.value === 'sim'} onCheckedChange={(val) => field.onChange(val ? 'sim' : 'nao')} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={webhook}
            render={({ field }) => (
              <FormItem className={form.watch(teamsSwitch) === 'nao' ? 'opacity-50 pointer-events-none' : ''}>
                <FormLabel>Webhook URL Principal</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} placeholder="https://..." /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {type === 'mikrotiks' && (
            <FormField
              control={form.control}
              name="url_webhook_mikrotiks_secundario"
              render={({ field }) => (
                <FormItem className={form.watch(teamsSwitch) === 'nao' ? 'opacity-50 pointer-events-none' : ''}>
                  <FormLabel>Webhook URL Secundário (Links)</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie o comportamento dos bots e notificações.</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit, onInvalid)} disabled={isSaving} className="bg-purple-700 hover:bg-purple-800 text-white">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <Tabs defaultValue="mikrotik">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="mikrotik" className="gap-2"><Server className="h-4 w-4"/> Mikrotiks</TabsTrigger>
              <TabsTrigger value="ping" className="gap-2"><Activity className="h-4 w-4"/> Ping</TabsTrigger>
              <TabsTrigger value="backup" className="gap-2"><Database className="h-4 w-4"/> Backup</TabsTrigger>
              <TabsTrigger value="firmware" className="gap-2"><Cpu className="h-4 w-4"/> Firmware</TabsTrigger>
            </TabsList>

            <TabsContent value="mikrotik">
              <Card>
                <CardHeader>
                  <CardTitle>Monitoramento de Mikrotik</CardTitle>
                  <CardDescription>Verificação de conectividade e interfaces.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="ativar_monitoramento_mikrotiks" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-zinc-50 dark:bg-zinc-900 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativar Monitoramento</FormLabel>
                        <FormDescription>Habilita o ciclo de verificação dos roteadores.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value === 'sim'} onCheckedChange={(val) => field.onChange(val ? 'sim' : 'nao')} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="intervalo_tentativas_mikrotiks" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo (segundos)</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="repetir_tentativa_mikrotiks" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tentativas antes da falha</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <Separator />
                  {renderNotificationFields('mikrotiks')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ping">
              <Card>
                <CardHeader><CardTitle>Monitoramento de Ping</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="ativar_monitoramento_ping" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-zinc-50 dark:bg-zinc-900 space-y-0">
                      <FormLabel className="text-base">Ativar Monitoramento</FormLabel>
                      <FormControl><Switch checked={field.value === 'sim'} onCheckedChange={(val) => field.onChange(val ? 'sim' : 'nao')} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="intervalo_tentativas_ping" render={({ field }) => (
                      <FormItem><FormLabel>Intervalo (segundos)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="repetir_tentativa_ping" render={({ field }) => (
                      <FormItem><FormLabel>Retentativas</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                    )} />
                  </div>
                  <Separator />
                  {renderNotificationFields('ping')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup">
              <Card>
                <CardHeader><CardTitle>Monitoramento de Backup</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="ativar_monitoramento_backups" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-zinc-50 dark:bg-zinc-900 space-y-0">
                      <FormLabel className="text-base">Ativar Monitoramento</FormLabel>
                      <FormControl><Switch checked={field.value === 'sim'} onCheckedChange={(val) => field.onChange(val ? 'sim' : 'nao')} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="tempo_saudavel_backup" render={({ field }) => (
                      <FormItem><FormLabel>Dias Saudáveis</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="tempo_nao_saudavel_backup" render={({ field }) => (
                      <FormItem><FormLabel>Dias para Falha</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                    )} />
                  </div>
                  <Separator />
                  {renderNotificationFields('backups')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="firmware">
              <Card>
                <CardHeader><CardTitle>Gestão de Firmware</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="ativar_monitoramento_firmware" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-zinc-50 dark:bg-zinc-900 space-y-0">
                      <FormLabel className="text-base">Ativar Monitoramento</FormLabel>
                      <FormControl><Switch checked={field.value === 'sim'} onCheckedChange={(val) => field.onChange(val ? 'sim' : 'nao')} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="intervalo_tentativas_firmware" render={({ field }) => (
                    <FormItem className="max-w-[200px]"><FormLabel>Intervalo (horas)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                  )} />
                  <Separator />
                  {renderNotificationFields('firmware')}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}