import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Router, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from "sonner";
import * as authService from "@/api/authService";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { StarsCanvas } from '@/components/shared/StarsCanvas';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckedState } from '@radix-ui/react-checkbox';
import { QRCodeSVG } from "qrcode.react";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [qrUri, setQrUri] = useState('');
  
  const [step, setStep] = useState<'credentials' | '2fa' | 'mfa-setup'>('credentials');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    const rememberedUsername = localStorage.getItem('@mikrotik_web:remembered-user');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
    return () => { setIsMounted(false); };
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const response = await authService.authService.login({ email: username, password });
      await finalizeLogin(response);
    } catch (error: any) {
      setIsAuthenticating(false);
      if (error.isMfaSetupRequired) {
        setQrUri(error.qrCodeUri);
        setStep('mfa-setup');
      } else if (error.is2faRequired) {
        setStep('2fa');
      } else {
        handleError(error);
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const response = await authService.authService.login({ 
        email: username, 
        password, 
        code_2fa: twoFactorCode 
      });
      await finalizeLogin(response);
    } catch (error: any) {
      handleError(error);
    }
  };

  const finalizeLogin = async (response: any) => {
    if (!isMounted) return;
    await delay(500);
    const { access_token, user } = response;
    localStorage.setItem('@mikrotik_web:token', access_token);
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
    if (rememberMe) {
      localStorage.setItem('@mikrotik_web:remembered-user', username);
    } else {
      localStorage.removeItem('@mikrotik_web:remembered-user');
    }
    authLogin(access_token, user);
    toast.success(`Bem-vindo, ${user.full_name || 'Usuário'}!`);
    navigate('/dashboard', { replace: true });
  };

  const handleError = async (error: any) => {
    await delay(300);
    if (!isMounted) return;

    const errorCode = error.response?.data?.error;
    let userMessage = "Ocorreu um erro inesperado. Tente novamente.";

    switch (errorCode) {
        case "AUTH_INVALID_CREDENTIALS":
            userMessage = "E-mail ou senha incorretos.";
            break;
        case "AUTH_MFA_TOKEN_EXPIRED":
            userMessage = "Sua sessão de segurança expirou. Insira um novo código.";
            break;
        case "AUTH_INACTIVE_USER":
            userMessage = "Esta conta está desativada no sistema.";
            break;
        case "AUTH_MFA_REQUIRED":
            userMessage = "Autenticação de dois fatores necessária.";
            break;
        case "VALIDATION_ERROR":
            userMessage = "Os dados informados possuem formato inválido.";
            break;
    }

    toast.error(userMessage);
    setIsAuthenticating(false);
  };

  const formPanelVariants: Variants = {
    initial: { opacity: 0, x: 20, filter: 'blur(5px)' },
    enter: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, filter: 'blur(5px)', transition: { duration: 0.3 } }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0b0d] text-white flex items-center justify-center lg:justify-start">
      <div className="absolute right-0 top-0 bottom-0 hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-12 text-center lg:flex">
        <StarsCanvas />
        <div className="relative z-10 flex flex-col gap-10 max-w-xl">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 scale-125">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                <Router className="w-10 h-10 text-white" />
              </div>
              <span className="text-4xl font-bold tracking-tighter text-white uppercase">
                Mikrotik<span className="text-blue-500">Manager</span>
              </span>
            </div>
          </div>
          <div className="space-y-4">
              <h2 className="text-5xl font-bold leading-tight">Gestão de Ativos<br /><span className="text-blue-500 italic">Ravel Tecnologia</span></h2>
              <p className="text-zinc-400 text-lg">Plataforma interna para monitoramento em tempo real e automação de infraestrutura.</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md p-6 lg:w-1/2 lg:max-w-none lg:px-24 xl:px-32 z-20">
        <AnimatePresence mode="wait">
          {step === 'credentials' && !isAuthenticating && (
            <motion.div key="creds" variants={formPanelVariants} initial="initial" animate="enter" exit="exit" className="bg-[#101010]/80 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-2xl">
              <div className="mb-8">
                <h1 className="text-3xl font-semibold mb-2">Login</h1>
                <p className="text-sm text-zinc-500">Acesse o painel administrativo da rede.</p>
              </div>
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Corporativo</Label>
                  <Input id="email" type="email" placeholder="usuario@ravel.com.br" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-12 bg-[#1b1b1b] border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha de Acesso</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 bg-[#1b1b1b] border-white/10" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked: CheckedState) => setRememberMe(!!checked)} className="border-white/30" />
                  <label htmlFor="remember" className="text-sm text-zinc-400 cursor-pointer">Lembrar meu usuário</label>
                </div>
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-500 font-semibold text-lg">Entrar</Button>
              </form>
            </motion.div>
          )}

          {step === '2fa' && !isAuthenticating && (
            <motion.div key="2fa" variants={formPanelVariants} initial="initial" animate="enter" exit="exit" className="bg-[#101010]/80 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-2xl text-center">
              <div className="mb-6">
                <div className="flex justify-center mb-4"><div className="p-4 bg-blue-500/20 rounded-full"><ShieldCheck className="h-10 w-10 text-blue-500" /></div></div>
                <h1 className="text-2xl font-semibold mb-2">Segurança Requerida</h1>
                <p className="text-sm text-zinc-500">Sua sessão de MFA expirou. Por favor, insira o código de 6 dígitos do seu aplicativo.</p>
              </div>
              <form onSubmit={handleMfaSubmit} className="space-y-6">
                <Input id="code" type="text" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} required autoFocus className="h-14 bg-[#1b1b1b] border-white/10 text-center text-3xl tracking-[0.5em] font-mono" />
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-500 font-semibold">Validar e Acessar</Button>
                  <Button type="button" variant="ghost" onClick={() => setStep('credentials')} className="text-zinc-500"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Login</Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'mfa-setup' && !isAuthenticating && (
            <motion.div key="mfa-setup" variants={formPanelVariants} initial="initial" animate="enter" exit="exit" className="bg-[#101010]/80 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-2xl text-center">
              <div className="mb-6">
                <div className="flex justify-center mb-4"><div className="p-4 bg-purple-500/20 rounded-full"><QrCode className="h-10 w-10 text-purple-500" /></div></div>
                <h1 className="text-2xl font-semibold mb-2">Primeiro Acesso</h1>
                <p className="text-xs text-zinc-500">Vincule seu aplicativo autenticador escaneando o QR Code abaixo.</p>
              </div>
              <div className="flex justify-center bg-white p-3 rounded-lg mb-6 mx-auto w-fit">
                <QRCodeSVG value={qrUri} size={160} />
              </div>
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 uppercase font-bold">Código do Aplicativo</Label>
                   <Input type="text" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} required className="h-12 bg-[#1b1b1b] border-white/10 text-center text-xl tracking-[0.3em] font-mono" />
                </div>
                <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-500 font-semibold">Ativar Proteção e Entrar</Button>
                <Button type="button" variant="ghost" onClick={() => setStep('credentials')} className="text-zinc-500 text-xs">Cancelar Operação</Button>
              </form>
            </motion.div>
          )}

          {isAuthenticating && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
              <p className="text-blue-400 font-medium animate-pulse">Validando Credenciais...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}