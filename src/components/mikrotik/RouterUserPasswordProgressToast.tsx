import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { mikrotikUsersService } from "@/api/mikrotikUsersService";
import { Spinner } from "@/components/ui/spinner";
import {
  clearRouterUserPasswordProgress,
  getRouterUserPasswordProgress,
  subscribeRouterUserPasswordProgress,
  type RouterUserPasswordProgressState,
} from "@/lib/routerUserPasswordProgress";
import type { MikrotikUser } from "@/types/mikrotikUsers";

const RUNNING_JOB_STATUSES = new Set(["pending", "processing", "retrying"]);
const RECENT_PROGRESS_GRACE_MS = 8000;
const COMPLETED_PROGRESS_VISIBLE_MS = 6000;
type TrackedRouterUser = MikrotikUser & { device_id: string };

interface CompletedPasswordProgress {
  deviceName: string;
  username: string;
  completedAt?: string;
  requestedBy?: string;
}

const formatCompletedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const isCompletedPasswordJob = (user: MikrotikUser) => {
  return user.job_status === "completed" && user.job_action !== "status";
};

export function RouterUserPasswordProgressToast() {
  const [progress, setProgress] = useState<RouterUserPasswordProgressState | null>(() => getRouterUserPasswordProgress());
  const [completedProgress, setCompletedProgress] = useState<CompletedPasswordProgress | null>(null);

  useEffect(() => {
    return subscribeRouterUserPasswordProgress(() => {
      const currentProgress = getRouterUserPasswordProgress();
      setProgress(currentProgress);
      if (currentProgress) setCompletedProgress(null);
    });
  }, []);

  const itemKeys = useMemo(() => {
    return new Set(progress?.items.map((item) => `${item.device_id}:${item.routeros_user_id}`) || []);
  }, [progress?.items]);

  const deviceIds = useMemo(() => {
    return Array.from(new Set(progress?.items.map((item) => item.device_id) || []));
  }, [progress?.items]);

  useEffect(() => {
    if (!progress || itemKeys.size === 0) return;

    const verifyProgress = async () => {
      try {
        let trackedUsers: TrackedRouterUser[] = [];

        try {
          const usersByDevice = await Promise.all(
            deviceIds.map(async (deviceId) => {
              const users = await mikrotikUsersService.listRouterUsers(deviceId);
              return users.map((user) => ({ ...user, device_id: deviceId }));
            }),
          );
          trackedUsers = usersByDevice.flat().filter((user) => itemKeys.has(`${user.device_id}:${user.id}`));
        } catch {
          const inventory = await mikrotikUsersService.listRouterUsersInventory();
          trackedUsers = inventory.filter((user) => itemKeys.has(`${user.device_id}:${user.id}`));
        }

        const hasRunningJobs = trackedUsers.some((user) => RUNNING_JOB_STATUSES.has(user.job_status || ""));
        const isRecentProgress = Date.now() - progress.updatedAt < RECENT_PROGRESS_GRACE_MS;

        if (!hasRunningJobs && !isRecentProgress) {
          const completedUser = trackedUsers.find(isCompletedPasswordJob);
          const progressItem = progress.items.find((item) => item.routeros_user_id === completedUser?.id) || progress.items[0];

          if (completedUser) {
            setCompletedProgress({
              deviceName: progressItem?.device_name || progress.deviceName,
              username: completedUser.name || progressItem?.username || progress.username,
              completedAt: completedUser.job_validated_at || completedUser.job_processed_at || undefined,
              requestedBy: completedUser.job_requested_by_user_name || completedUser.job_requested_by_user_email || undefined,
            });
            window.setTimeout(() => setCompletedProgress(null), COMPLETED_PROGRESS_VISIBLE_MS);
          }
          clearRouterUserPasswordProgress();
        }
      } catch {
        // Mantem o indicador na tela se a checagem falhar; a próxima consulta tenta novamente.
      }
    };

    const interval = window.setInterval(verifyProgress, 5000);
    void verifyProgress();

    return () => window.clearInterval(interval);
  }, [deviceIds, itemKeys, progress]);

  if (!progress && !completedProgress) return null;

  const title = completedProgress
    ? "Concluído"
    : `Atualizando senha... ${progress?.current} de ${progress?.total}`;
  const description = completedProgress
    ? completedProgress.completedAt
      ? `Senha atualizada em ${formatCompletedAt(completedProgress.completedAt)}`
      : "Senha atualizada"
    : `Cliente ${progress?.deviceName} · Usuário ${progress?.username}`;
  const details = completedProgress
    ? `Cliente ${completedProgress.deviceName} · Usuário ${completedProgress.username}${completedProgress.requestedBy ? ` · Técnico ${completedProgress.requestedBy}` : ""}`
    : null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[min(360px,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="flex items-start gap-3">
        {completedProgress ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        ) : (
          <Spinner className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 truncate text-xs text-zinc-500">
            {description}
          </div>
          {details && <div className="mt-0.5 truncate text-xs text-zinc-500">{details}</div>}
        </div>
      </div>
    </div>
  );
}
