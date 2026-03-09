import { useAuth } from "@/contexts/AuthContext";
import type { Group, Permission } from "@/types/management";

export function usePermission() {
  const { user } = useAuth();

  const can = (permissionName: string): boolean => {
    if (!user) return false;
    if (user.is_root) return true;

    // Acessa groups apenas se existirem
    if (!user.groups || !Array.isArray(user.groups)) return false;

    return user.groups.some((group: Group) => 
      group.permissions && group.permissions.some((perm: Permission) => 
        perm.name === permissionName || perm.name === "*:*"
      )
    );
  };

  const isAdmin = () => can("user:write");

  return { can, isAdmin };
}