import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <LoaderCircle
      role="status"
      aria-label="Carregando"
      className={cn("size-4 animate-spin", className)}
      style={{ animationDuration: "0.8s", ...props.style }}
      {...props}
    />
  );
}

export { Spinner };
