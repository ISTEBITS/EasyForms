import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="dark min-h-screen bg-background text-foreground selection:bg-accent-2 selection:text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,var(--accents-1)_1px,transparent_1px),linear-gradient(to_bottom,var(--accents-1)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      {children}
      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}
