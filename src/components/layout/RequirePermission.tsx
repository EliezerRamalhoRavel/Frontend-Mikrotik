import { usePermission } from "@/hooks/usePermission";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

interface RequirePermissionProps {
  permission: string;
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { can } = usePermission();
  const hasPermission = can(permission);

  useEffect(() => {
    // Só mostra o toast se o componente montou e verificou que não tem permissão
    if (!hasPermission) {
      // Pequeno delay ou verificação para evitar toast no primeiro render se estiver carregando
      // Mas como o AuthContext tem isLoading, aqui já deve estar resolvido
      toast.error("Acesso negado: Você não tem permissão para acessar esta área.");
    }
  }, [hasPermission]);

  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}