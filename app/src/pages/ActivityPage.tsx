import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import {
  Activity,
  User,
  RefreshCw,
  Clock,
  Filter,
  Zap,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formsApi, type TestUserActivity } from "@/api";
import { ActivitySkeleton } from "@/components/ui/skeleton-new";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "Recently";
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (isNaN(diffMs)) return "Recently";
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityPage() {
  const { user } = useAuth();

  if (user?.role === "test_user") {
    return <Navigate to="/dashboard" replace />;
  }

  const [activities, setActivities] = useState<TestUserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "test_user" | "form" | "key">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivities = async (isRefresh = false) => {
    try {
      if (!isRefresh && activities.length === 0) {
        setLoading(true);
      }
      const data = await formsApi.getTestUserActivities();
      setActivities(data);
    } catch {
      toast.error("Failed to load activity logs");
      if (activities.length === 0) {
        setActivities([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchActivities(false);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchActivities(true);
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filterType === "test_user") return Boolean(act.testUserId);
      if (filterType === "form") return act.action?.toLowerCase().includes("form");
      if (filterType === "key") return act.action?.toLowerCase().includes("key");
      return true;
    });
  }, [activities, filterType]);

  if (loading) {
    return <ActivitySkeleton />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden space-y-4 font-sans p-4">
      {/* Page Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-border bg-background p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
              System Activity Audit Log
            </h1>
          </div>
          <p className="text-xs text-accent-5 font-sans">
            Real-time audit trail of admin and test user actions across EasyForms.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="secondary"
          size="sm"
          className="gap-2 shrink-0 font-medium"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Log
        </Button>
      </div>

      {/* Category Filter Bar */}
      <div className="shrink-0 flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-1.5 rounded-sm border border-border bg-accent-1 p-1 text-xs">
          <Filter className="h-3.5 w-3.5 ml-2 text-accent-5 shrink-0" />
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-xs font-medium font-sans text-xs transition-all ${filterType === "all"
                ? "bg-background text-foreground border border-border"
                : "text-accent-5 hover:text-foreground"
              }`}
          >
            All Events
          </button>
          <button
            type="button"
            onClick={() => setFilterType("test_user")}
            className={`px-2.5 py-1 rounded-xs font-semibold transition-all ${filterType === "test_user"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setFilterType("form")}
            className={`px-2.5 py-1 rounded-xs font-semibold transition-all ${filterType === "form"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            Forms
          </button>
          <button
            type="button"
            onClick={() => setFilterType("key")}
            className={`px-2.5 py-1 rounded-xs font-semibold transition-all ${filterType === "key"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            API Keys
          </button>
        </div>
      </div>

      {/* Audit Log Timeline Container */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xs border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-sm">
        {isRefreshing ? (
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/80 hide-scrollbar p-2 space-y-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Skeleton className="h-9 w-9 rounded-full bg-zinc-800/80 shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <Skeleton className="h-4 w-48 bg-zinc-800/80" />
                    <Skeleton className="h-3 w-32 bg-zinc-800/40" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-xs bg-zinc-800/60 shrink-0" />
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
              <Activity className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">No activity events found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              API key events, form updates, and user activities will appear here.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/80 hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredActivities.map((act, index) => {
              const email = act.email || "System User";
              const time = formatRelativeTime(act.createdAt);
              const isKeyAction = act.action?.toLowerCase().includes("key");

              const getActionDescription = () => {
                const name = act.metadata?.keyName ? `"${act.metadata.keyName}"` : "";
                if (act.action === "api_key.create") return `Created API Key ${name}`.trim();
                if (act.action === "api_key.revoke") return `Revoked API Key ${name}`.trim();
                if (act.action === "form.create") return "Created a new form";
                if (act.action === "form.update") return "Updated form content/settings";
                if (act.action === "form.delete") return "Deleted a form";
                if (act.action === "form.responses.view") return "Viewed form responses";
                if (act.action === "auth.login") return "Signed in to EasyForms";
                return act.action;
              };

              return (
                <div
                  key={act._id || `${act.email}-${act.createdAt}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300">
                      {isKeyAction ? (
                        <Key className="h-4 w-4 text-amber-400" />
                      ) : act.testUserId ? (
                        <User className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Zap className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[220px] sm:max-w-xs">
                          {email}
                        </span>
                        {isKeyAction && (
                          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                            API Key
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300">
                        {getActionDescription()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5 rounded-xs border border-zinc-800 bg-zinc-900/80 px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-semibold text-xs text-zinc-300">{time}</span>
                    </div>
                    <span className={`inline-flex h-2 w-2 rounded-full ${isKeyAction ? "bg-amber-400" : "bg-emerald-400"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
