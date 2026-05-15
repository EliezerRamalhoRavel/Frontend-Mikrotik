import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { 
  LayoutDashboard, 
  Router, 
  HardDrive, 
  Users, 
  ScrollText, 
  Activity,
  Building2,
  Settings,
  Cpu,
  KeyRound
} from 'lucide-react';

export function NavLinks() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  const { can } = usePermission();

  const links = [
    { 
      to: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      visible: true 
    },
    {
      to: '/mikrotiks',
      icon: Router,
      label: 'Dispositivos',
      visible: can('device:read')
    },
    {
      to: '/mikrotiks/senha-em-massa',
      icon: KeyRound,
      label: 'Senha MKs',
      visible: !!user?.is_root
    },
    {
      to: '/backups',
      icon: HardDrive, 
      label: 'Backups',
      visible: can('backup:read') 
    },
    { 
      to: '/ping-targets', 
      icon: Activity, 
      label: 'Ping Monitor',
      visible: can('ping:read') 
    },
    { 
      to: '/firmware', 
      icon: Cpu, 
      label: 'Firmware',
      visible: can('firmware:read') 
    },
    { 
      to: '/usuarios', 
      icon: Users, 
      label: 'Usuários',
      visible: can('user:write') 
    },
    { 
      to: '/logs', 
      icon: ScrollText, 
      label: 'Logs de Atividade',
      visible: can('audit:read') 
    },
    { 
      to: '/settings', 
      icon: Settings, 
      label: 'Configurações',
      visible: can('settings:read') 
    }
  ];

  if (user?.is_root) {
    links.splice(5, 0, { to: '/empresas', icon: Building2, label: 'Empresas (Tenants)', visible: true });
  }

  return (
    <nav className="grid items-start gap-2">
      {links
        .filter(link => link.visible)
        .map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.to;

        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
