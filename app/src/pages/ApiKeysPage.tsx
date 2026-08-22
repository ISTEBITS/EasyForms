import { Key, Shield } from "lucide-react";
import { ApiKeysManager } from "@/components/dashboard/ApiKeysManager";

export function ApiKeysPage() {
  return (
    <div className="space-y-10 animate-in fade-in-50 duration-200 p-4 font-sans">
      {/* 1. API Keys & Credentials Section */}
      <section className="space-y-6">
        <div className="rounded-xs border border-zinc-800 bg-zinc-950/80 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xs border border-zinc-800 bg-zinc-900 text-zinc-200">
                  <Key className="h-4.5 w-4.5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  API Keys & Credentials
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xs p-3">
              <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Scoped access tokens with automated rate limiting</span>
            </div>
          </div>
        </div>
        <ApiKeysManager />
      </section>
    </div>
  );
}