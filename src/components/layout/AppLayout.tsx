import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLinks } from './NavLinks';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, Router as RouterIcon } from 'lucide-react';
import { useState } from 'react';
import { authService } from '@/api/authService';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
        await authService.logout();
    } catch (error) {
        console.error("Erro ao fazer logout no backend", error);
    } finally {
        logout(); 
        navigate('/login');
    }
  };

  return (
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] overflow-hidden">
      
      <div className="hidden border-r bg-zinc-50/40 dark:bg-zinc-950 md:block h-full overflow-y-auto">
        <div className="flex h-full flex-col gap-2">
          
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 shrink-0 bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2 font-semibold">
              <div className="p-1 bg-blue-600 rounded text-white">
                <RouterIcon className="h-5 w-5" />
              </div>
              <span className="text-zinc-900 dark:text-zinc-100">Mikrotik<span className="text-blue-600">Manager</span></span>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-2 px-2">
            <NavLinks />
          </div>

          {/* User Footer - AGORA CLICÁVEL */}
          <div 
             className="mt-auto p-4 border-t bg-white dark:bg-zinc-950 shrink-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
             onClick={() => navigate('/perfil')}
             title="Ver meu perfil"
          >
             <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm">
                    {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{user?.full_name || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
        
        <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-zinc-950 px-4 lg:h-[60px] lg:px-6 shrink-0">
          <button 
            className="md:hidden p-2 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="w-full flex-1"></div>
          
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {isMobileMenuOpen && (
             <div className="md:hidden border rounded-md bg-popover p-2 mb-4 shadow-lg absolute top-16 left-4 right-4 z-50">
                <NavLinks />
                {/* Link extra para mobile */}
                <div 
                    className="flex items-center gap-2 p-2 mt-2 border-t text-sm font-medium text-zinc-700"
                    onClick={() => { navigate('/perfil'); setIsMobileMenuOpen(false); }}
                >
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                        {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    Meu Perfil
                </div>
             </div>
            )}
            
            <Outlet />
        </main>
      </div>
    </div>
  );
}