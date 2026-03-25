import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return <section className={cn("panel", className)}>{children}</section>;
}
