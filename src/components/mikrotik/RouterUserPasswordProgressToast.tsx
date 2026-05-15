import { useEffect, useMemo, useState } from "react";

import { mikrotikUsersService } from "@/api/mikrotikUsersService";
import { Spinner } from "@/components/ui/spinner";
import {
  clearRouterUserPasswordProgress,
  getRouterUserPasswordProgress,
  subscribeRouterUserPasswordProgress,
  type RouterUserPasswordProgressState,
} from "@/lib/routerUserPasswordProgress";

const RUNNING_JOB_STATUSES = new Set(["pending", "processing", "retrying"]);
const RECENT_PROGRESS_GRACE_MS = 8000;

export function RouterUserPasswordProgressToast() {
  const [progress, setProgress] = useState<RouterUserPasswordProgressState | null>(() => getRouterUserPasswordProgress());

  useEffect(() => {
    return subscribeRouterUserPasswordProgress(() => {
      setProgress(getRouterUserPasswordProgress());
    });
  }, []);

  const itemKeys = useMemo(() => {
    return new Set(progress?.items.map((item) => `${item.device_id}:${item.routeros_user_id}`) || []);
  }, [progress?.items]);

  useEffect(() => {
    if (!progress || itemKeys.size === 0) return;

    const verifyProgress = async () => {
      try {
        const inventory = await mikrotikUsersService.listRouterUsersInventory();
        const trackedUsers = inventory.filter((user) => itemKeys.has(`${user.device_id}:${user.id}`));
        const hasRunningJobs = trackedUsers.some((user) => RUNNING_JOB_STATUSES.has(user.job_status || ""));
        const isRecentProgress = Date.now() - progress.updatedAt < RECENT_PROGRESS_GRACE_MS;

        if (!hasRunningJobs && trackedUsers.length > 0 && !isRecentProgress) {
          clearRouterUserPasswordProgress();
        }
      } catch {
        // Mantem o indicador na tela se a checagem falhar; a próxima consulta tenta novamente.
      }
    };

    const interval = window.setInterval(verifyProgress, 5000);
    void verifyProgress();

    return () => window.clearInterval(interval);
  }, [itemKeys, progress]);

  if (!progress) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[min(360px,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="flex items-start gap-3">
        <Spinner className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            Atualizando senha... {progress.current} de {progress.total}
          </div>
          <div className="mt-1 truncate text-xs text-zinc-500">
            Cliente {progress.deviceName} · Usuário {progress.username}
          </div>
        </div>
      </div>
    </div>
  );
}
