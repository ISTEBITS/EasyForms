import { useEffect, useState } from "react";
import {
  Key,
  Copy,
  Trash2,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiKeysApi } from "@/api";
import type { ApiKey, ApiKeyStats } from "@/api";
import { useAuth } from "@/context/auth";

function formatDate(dateString: string | null) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return "Never used";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

function maskApiKey(prefix: string, keyId: string): string {
  const id = typeof keyId === "string" ? keyId : "";
  const suffix = id.slice(-4) || "****";
  return `${prefix}...${suffix}`;
}

export function ApiKeysManager() {
  const { user } = useAuth();
  const isTestUser = user?.role === "test_user";

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<ApiKeyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(30);
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const hasReachedLimit = isTestUser && keys.length >= 1;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [keysData, statsData] = await Promise.all([
        apiKeysApi.list(),
        apiKeysApi.stats(),
      ]);
      setKeys(keysData);
      setStats(statsData);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const getKeyStats = (keyId: string): ApiKeyStats | undefined => {
    return stats.find((s) => s.keyId === keyId);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    if (hasReachedLimit) {
      toast.error("Test users are limited to 1 API key. Revoke your existing key first.");
      setShowCreateDialog(false);
      return;
    }
    try {
      setIsCreating(true);
      const result = await apiKeysApi.create(newKeyName.trim(), undefined, expiresInDays);
      setCreatedKey(result.apiKey);
      toast.success("API key created successfully");
      void fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create key";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      toast.success("API key copied to clipboard");
    } catch {
      toast.error("Failed to copy");
      const el = document.getElementById("new-api-key-value");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  const handleRevokeKey = async () => {
    if (!keyToRevoke) return;
    try {
      setIsRevoking(true);
      await apiKeysApi.revoke(keyToRevoke);
      toast.success("API key revoked");
      setKeyToRevoke(null);
      void fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to revoke key";
      toast.error(message);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCloseCreate = () => {
    if (!isCreating) {
      setShowCreateDialog(false);
      setNewKeyName("");
      setExpiresInDays(30);
      setCreatedKey(null);
    }
  };

  const renderUsageBars = (keyStats: ApiKeyStats) => {
    const days = Object.entries(keyStats.requestsByDay || {}).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    const totalTraffic = days.reduce((acc, [, count]) => acc + count, 0);
    const maxVal = Math.max(...days.map(([, c]) => c), 1);
    const recentDays = days.slice(-14);

    return (
      <div className="mt-4 rounded-xs border border-border bg-accent-1/40 p-3.5 space-y-2">
        <div className="flex-col sm:flex-row flex sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-6">
            Traffic History (Last 14 Days)
          </p>
          <span className="text-xs text-accent-5">
            {totalTraffic} total requests in 30d
          </span>
        </div>

        {totalTraffic === 0 ? (
          <div className="py-6 text-center text-xs text-accent-5">
            No request activity recorded for this API key in the last 30 days.
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-20 pt-2 pb-1 overflow-x-scroll scrollbar-hide">
            {recentDays.map(([day, count]) => {
              const heightPercent = count > 0 ? Math.max(14, (count / maxVal) * 100) : 6;
              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-7 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <span className="rounded-xs bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-xs text-white font-medium whitespace-nowrap shadow-lg">
                      {day}: {count} {count === 1 ? "request" : "requests"}
                    </span>
                  </div>

                  <div
                    className={`w-full rounded-xs transition-all duration-200 ${
                      count > 0
                        ? "bg-purple-500 hover:bg-purple-400 opacity-90"
                        : "bg-zinc-800 opacity-40"
                    }`}
                    style={{
                      height: `${heightPercent}%`,
                    }}
                  />
                  <span className="mt-1 text-xs text-zinc-400 truncate max-w-full font-mono">
                    {day.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-xs border border-border bg-background p-6">
        <div className="flex items-center gap-2 text-sm text-accent-5">
          <Activity className="h-4 w-4 animate-spin" />
          Loading API keys...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xs border border-border bg-background">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">API Keys</h3>
            {isTestUser && (
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                hasReachedLimit
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-purple-500/30 bg-purple-500/10 text-purple-300"
              }`}>
                Test User Limit: {keys.length}/1
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">
            Manage authentication keys with custom expiration & real-time analytics.
            {hasReachedLimit && (
              <span className="ml-1 text-amber-400 font-medium">
                (Maximum 1 API key limit reached)
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            if (hasReachedLimit) {
              toast.error("Test users are limited to 1 API key. Revoke your existing key first.");
              return;
            }
            setShowCreateDialog(true);
          }}
          disabled={hasReachedLimit}
          variant="default"
          size="sm"
          className="h-8 bg-white text-zinc-900 hover:bg-white/90 rounded-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasReachedLimit ? "Test users are limited to 1 API key" : undefined}
        >
          <Plus className="h-4 w-4" />
          Create Key
        </Button>
      </div>

      {/* Empty state */}
      {keys.length === 0 && (
        <div className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xs border border-border bg-accent-1">
            <Key className="h-6 w-6 text-accent-4" />
          </div>
          <h4 className="text-base font-medium text-foreground">No API keys</h4>
          <p className="mt-1 text-xs text-zinc-500">Create an API key to access EasyForms REST API & SDKs.</p>
        </div>
      )}

      {/* Key list */}
      {keys.length > 0 && (
        <div className="divide-y divide-border">
          {keys.map((key) => {
            const keyStats = getKeyStats(key.id);
            const isExpanded = expandedKey === key.id;

            return (
              <div key={key.id}>
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xs border border-border bg-accent-1">
                        <Key className="h-4 w-4 text-accent-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {key.name}
                          </p>
                          {key.isExpired ? (
                            <span className="rounded-xs border border-red-500/30 bg-red-500/10 text-red-400 px-2 py-0.5 text-[10px] font-semibold">
                              Expired
                            </span>
                          ) : key.expiresAt ? (
                            <span className="rounded-xs border border-zinc-700 bg-zinc-900 text-zinc-300 px-2 py-0.5 text-[10px]">
                              Expires: {formatDate(key.expiresAt)}
                            </span>
                          ) : (
                            <span className="rounded-xs border border-zinc-800 bg-zinc-900 text-zinc-400 px-2 py-0.5 text-[10px]">
                              Never expires
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-xs text-accent-5 mt-0.5">
                          {maskApiKey(key.keyPrefix, key.id)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-accent-5">
                    {keyStats && (
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" />
                        {keyStats.totalRequests} requests
                      </span>
                    )}
                    <span className="hidden sm:inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeTime(key.lastUsedAt)}
                    </span>

                    <button
                      onClick={() =>
                        setExpandedKey(isExpanded ? null : key.id)
                      }
                      className="rounded-xs p-1 text-accent-4 transition-geist duration-150 hover:bg-accent-1 hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setKeyToRevoke(key.id)}
                      className="rounded-xs p-1 text-accent-4 transition-geist duration-150 hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded stats panel */}
                {isExpanded && keyStats && (
                  <div className="border-t border-border bg-accent-1/30 px-4 py-4 sm:px-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xs border border-border bg-accent-1/60 p-3">
                        <p className="text-xs text-accent-5">Total Requests</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {keyStats.totalRequests}
                        </p>
                      </div>
                      <div className="rounded-xs border border-border bg-accent-1/60 p-3">
                        <p className="text-xs text-accent-5">Failed Attempts</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {keyStats.failedAttempts}
                        </p>
                      </div>
                      <div className="rounded-xs border border-border bg-accent-1/60 p-3">
                        <p className="text-xs text-accent-5">Expiration Date</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {formatDate(key.expiresAt)}
                        </p>
                      </div>
                      <div className="rounded-xs border border-border bg-accent-1/60 p-3">
                        <p className="text-xs text-accent-5">Last Used</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {formatRelativeTime(key.lastUsedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Usage bar chart */}
                    {renderUsageBars(keyStats)}

                    {/* Endpoint breakdown */}
                    {Object.keys(keyStats.requestsByEndpoint).length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs uppercase tracking-wider text-accent-5 font-semibold font-mono">
                          Endpoint Breakdown
                        </p>
                        <div className="space-y-1.5">
                          {Object.entries(keyStats.requestsByEndpoint)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 6)
                            .map(([endpoint, count]) => (
                              <div
                                key={endpoint}
                                className="flex items-center justify-between rounded-xs border border-border bg-accent-1/50 px-2.5 py-1.5"
                              >
                                <span className="truncate text-xs font-sans text-accent-6">
                                  {endpoint}
                                </span>
                                <span className="ml-2 text-xs text-accent-5 font-medium">
                                  {count} reqs
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseCreate}>
        <DialogContent className="ring-1 ring-gray-500 rounded-xs bg-black text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createdKey ? "API Key Created" : "Create API Key"}
            </DialogTitle>
            <DialogDescription className="text-accent-5">
              {createdKey
                ? "Copy this key now. It will not be shown again."
                : "Generate a new API key for SDK embeds and backend integrations."}
            </DialogDescription>
          </DialogHeader>

          {!createdKey ? (
            <div className="space-y-4">
              {hasReachedLimit && (
                <div className="rounded-xs border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-300">
                  Test users can only create 1 API key. Please revoke your existing key to generate a new one.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="key-name" className="text-sm text-foreground">
                  Key Name
                </Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Embed, Staging API"
                  className="h-9 rounded-xs border-border bg-background text-foreground placeholder:text-accent-4"
                  disabled={hasReachedLimit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !hasReachedLimit) void handleCreateKey();
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration" className="text-sm text-foreground">
                  Key Expiration
                </Label>
                <select
                  id="expiration"
                  value={expiresInDays === null ? "never" : String(expiresInDays)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpiresInDays(val === "never" ? null : Number(val));
                  }}
                  className="h-9 w-full rounded-xs border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="7">7 Days</option>
                  <option value="30">30 Days (Recommended)</option>
                  <option value="90">90 Days</option>
                  <option value="365">1 Year</option>
                  <option value="never">Never Expire</option>
                </select>
              </div>

              <Button
                onClick={() => void handleCreateKey()}
                disabled={!newKeyName.trim() || isCreating || hasReachedLimit}
                className="w-full bg-white text-gray-900 hover:bg-white/90 rounded-xs pointer-cursor font-bold"
              >
                {isCreating ? "Generating..." : "Generate Key"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xs border border-border bg-accent-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <code
                    id="new-api-key-value"
                    className="break-all text-sm font-sans text-foreground select-all"
                  >
                    {createdKey}
                  </code>
                  <Button
                    onClick={() => void handleCopyKey()}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-accent-5 hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-amber-400">
                ⚠️ Keep this key safe. You will not be able to retrieve it again.
              </p>

              <Button
                onClick={handleCloseCreate}
                className="w-full bg-white text-zinc-900 hover:bg-white/90 font-bold rounded-xs"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog
        open={Boolean(keyToRevoke)}
        onOpenChange={(open) => {
          if (!open) setKeyToRevoke(null);
        }}
      >
        <AlertDialogContent className="rounded-xs border border-border bg-background text-foreground sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription className="text-accent-5">
              Are you sure? Applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRevoking}
              className="rounded-xs border-border bg-accent-1 text-foreground hover:bg-accent-2"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleRevokeKey()}
              disabled={isRevoking}
              className="rounded-xs bg-error text-white hover:bg-error/90 font-bold"
            >
              {isRevoking ? "Revoking..." : "Revoke Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
