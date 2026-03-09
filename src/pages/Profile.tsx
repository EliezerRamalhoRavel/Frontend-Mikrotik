import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, QrCode, Lock, RefreshCw, Calendar, ShieldAlert } from "lucide-react";
import { authService } from "@/api/authService";
import { QRCodeSVG } from "qrcode.react";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [is2faSetupOpen, setIs2faSetupOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const updatedUser = await authService.updateProfile({ full_name: fullName });
        const token = localStorage.getItem('@mikrotik_web:token') || "";
        login(token, updatedUser);
        toast.success("Perfil atualizado!");
    } catch (error) {
        toast.error("Erro ao atualizar perfil.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await authService.changePassword({ current_password: currentPassword, new_password: newPassword });
        toast.success("Senha alterada com sucesso.");
        setCurrentPassword("");
        setNewPassword("");
    } catch (error: any) {
        toast.error("Erro ao alterar senha. Verifique sua senha atual.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartMfaSetup = async () => {
    setIsLoading(true);
    try {
        const data = await authService.setup2fa();
        setQrCodeUrl(data.uri);
        setIs2faSetupOpen(true);
        setTwoFactorCode("");
    } catch (error: any) {
        const msg = error.response?.data?.detail?.message || "Erro ao iniciar configuração de segurança.";
        toast.error(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const handleConfirmMfa = async () => {
      if (twoFactorCode.length !== 6) {
          toast.error("Insira o código de 6 dígitos.");
          return;
      }
      setIsLoading(true);
      try {
          await authService.enable2fa(twoFactorCode);
          toast.success("Segurança MFA configurada com sucesso!");
          setIs2faSetupOpen(false);
          const updated = await authService.getCurrentUser();
          const token = localStorage.getItem('@mikrotik_web:token') || "";
          login(token, updated);
      } catch (error) {
          toast.error("Código inválido. Tente novamente.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleDisable2fa = async () => {
      if (!confirm("Tem certeza que deseja desativar o MFA? Sua conta ficará menos segura.")) return;
      setIsLoading(true);
      try {
          await authService.disable2fa();
          toast.success("MFA Desativado.");
          const updated = await authService.getCurrentUser();
          const token = localStorage.getItem('@mikrotik_web:token') || "";
          login(token, updated);
      } catch (error) {
          toast.error("Erro ao desativar.");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações e configurações de segurança.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                <CardDescription>Nome de exibição na plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                        <Label>E-mail (Identificador)</Label>
                        <Input value={user?.email} disabled className="bg-zinc-50 dark:bg-zinc-800 border-dashed" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                        Salvar Alterações
                    </Button>
                </form>
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Alterar Senha</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Senha Atual</Label>
                            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <Button type="submit" disabled={isLoading || !newPassword} variant="outline" className="w-full">
                            <Lock className="mr-2 h-4 w-4" /> Atualizar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShieldCheck className="h-5 w-5 text-purple-500" />
                        Autenticação MFA
                    </CardTitle>
                    <CardDescription>Proteção adicional para seu login.</CardDescription>
                </CardHeader>
                <CardContent>
                    {user?.is_two_factor_enabled && !is2faSetupOpen ? (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-bold text-green-700 dark:text-green-300">PROTEGIDO</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleDisable2fa} disabled={isLoading} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs">Desativar</Button>
                                </div>
                                {user.mfa_enabled_at && (
                                    <div className="flex items-center gap-2 text-[11px] text-green-600 dark:text-green-400 font-medium border-t border-green-100 dark:border-green-800 pt-2">
                                        <Calendar className="h-3 w-3" />
                                        Ativado em: {new Date(user.mfa_enabled_at).toLocaleString('pt-BR')}
                                    </div>
                                )}
                            </div>
                            <Button onClick={handleStartMfaSetup} variant="outline" disabled={isLoading} className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} 
                                Redefinir Dispositivo MFA
                            </Button>
                        </div>
                    ) : (
                        !is2faSetupOpen ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-md text-amber-700 dark:text-amber-400">
                                    <ShieldAlert className="h-5 w-5" />
                                    <span className="text-xs font-medium">MFA ainda não configurado nesta conta.</span>
                                </div>
                                <Button onClick={handleStartMfaSetup} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white shadow-sm">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />} 
                                    Configurar MFA Agora
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex justify-center bg-white p-3 rounded-xl border-2 border-purple-100 shadow-inner w-fit mx-auto">
                                    <QRCodeSVG value={qrCodeUrl} size={160} />
                                </div>
                                <p className="text-[11px] text-center text-zinc-500 px-4 leading-relaxed">
                                    Escaneie o código com seu app autenticador e insira o token gerado abaixo para confirmar.
                                </p>
                                <div className="space-y-2">
                                    <Input 
                                        value={twoFactorCode} 
                                        onChange={e => setTwoFactorCode(e.target.value)} 
                                        maxLength={6} 
                                        placeholder="000000"
                                        className="text-center text-2xl tracking-[0.5em] font-mono h-12"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" className="flex-1 text-xs" onClick={() => setIs2faSetupOpen(false)}>Cancelar</Button>
                                    <Button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white" onClick={handleConfirmMfa} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                                    </Button>
                                </div>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}