import { useState, useEffect, type ComponentType } from "react";
import { Link, NavLink, Outlet, matchPath, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MessageSquareText,
  Key,
  Activity,
  LogOut,
  Menu,
  X,
  Search,
  Mail,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal";
import {
  ADMIN_DASHBOARD_SCOPE,
  DASHBOARD_SCOPE_PARAM,
  normalizeDashboardScope,
} from "@/lib/dashboard-scope";
import {
  DashboardSkeleton,
  EditorSkeleton,
  ResponsesSkeleton,
  ApiKeysSkeleton,
  ActivitySkeleton,
} from "@/components/ui/skeleton-new";

type NavTab = {
  key: "dashboard" | "editor" | "responses" | "api-keys" | "activity" | "mail";
  label: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
  active: boolean;
};

export default function ProtectedAppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isAdmin = user?.role === "admin";
  const scope = normalizeDashboardScope(
    new URLSearchParams(location.search).get(DASHBOARD_SCOPE_PARAM),
  );
  const scopeQuery =
    isAdmin && scope !== ADMIN_DASHBOARD_SCOPE
      ? `?${DASHBOARD_SCOPE_PARAM}=${encodeURIComponent(scope)}`
      : "";

  const withScope = (path: string) => `${path}${scopeQuery}`;

  const editorRootMatch = matchPath("/editor", location.pathname);
  const editorMatch = matchPath("/editor/:formId", location.pathname);
  const responsesRootMatch = matchPath("/responses", location.pathname);
  const responsesMatch = matchPath("/form/:id/responses", location.pathname);
  const apiKeysMatch = matchPath("/api-keys", location.pathname);
  const activityMatch = matchPath("/activity", location.pathname);
  const mailMatch = matchPath("/mail", location.pathname);

  const activeKey: NavTab["key"] = editorMatch
    ? "editor"
    : editorRootMatch
      ? "editor"
      : responsesMatch
        ? "responses"
        : responsesRootMatch
          ? "responses"
          : apiKeysMatch
            ? "api-keys"
            : activityMatch
              ? "activity"
              : mailMatch
                ? "mail"
                : "dashboard";

  const tabs: NavTab[] = [
    {
      key: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      to: withScope("/dashboard"),
      active: activeKey === "dashboard",
    },
    {
      key: "editor" as const,
      label: "Editor",
      icon: FileText,
      to: withScope("/editor"),
      active: activeKey === "editor",
    },
    {
      key: "responses" as const,
      label: "Responses",
      icon: MessageSquareText,
      to: withScope("/responses"),
      active: activeKey === "responses",
    },
    {
      key: "api-keys" as const,
      label: "API Keys",
      icon: Key,
      to: withScope("/api-keys"),
      active: activeKey === "api-keys",
    },
    {
      key: "mail" as const,
      label: "Email Templates",
      icon: Mail,
      to: withScope("/mail"),
      active: activeKey === "mail",
    },
    {
      key: "activity" as const,
      label: "Activity",
      icon: Activity,
      to: withScope("/activity"),
      active: activeKey === "activity",
    },
  ].filter((tab) => !(user?.role === "test_user" && (tab.key === "activity" || tab.key === "mail")));


  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const userName =
    user?.name ||
    user?.sub?.split("@")[0] ||
    (user?.role === "admin" ? "Admin User" : "Test User");

  const userInitial = userName.charAt(0).toUpperCase();

  const renderCurrentSkeleton = () => {
    switch (activeKey) {
      case "dashboard":
        return <DashboardSkeleton />;
      case "editor":
        return <EditorSkeleton />;
      case "responses":
        return <ResponsesSkeleton />;
      case "api-keys":
        return <ApiKeysSkeleton />;
      case "activity":
        return <ActivitySkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">
      {/* Geist Blur Header Navbar */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background transition-all">
        <div className="h-full px-4 lg:px-8 flex items-center justify-between gap-4">
          {/* Left Side Branding & Workspace */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-accent-5 hover:text-foreground rounded-sm hover:bg-accent-1"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link
              to={withScope("/dashboard")}
              className="flex items-center gap-2.5 group transition-transform duration-150 active:scale-98"
            >
              <div className="flex h-7 w-7 items-center justify-center">
                <Logo size={18} />
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground font-sans">
                EasyForms
              </span>
            </Link>

            <span className="text-accent-4 text-sm font-sans hidden sm:inline-block">/</span>

            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-accent-1 px-3 py-0.5 font-sans text-sm font-semibold text-accent-6">
              <span className={`h-2 w-2 rounded-full ${isAdmin ? "bg-blue-500" : "bg-purple-500"}`} />
              <span className="truncate max-w-[160px]">
                {isAdmin ? "Admin Workspace" : "Test User"}
              </span>
            </div>
          </div>

          {/* Right Side Search Trigger, Profile & Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              className="flex rounded-full items-center justify-between gap-3 h-9 w-fit sm:w-60 md:w-72 sm:rounded-sm border border-border bg-accent-1/50 px-3 text-sm text-accent-5 hover:border-accent-6 hover:text-foreground transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="h-4 w-4 text-accent-5 shrink-0" />
                <span className="hidden truncate font-sans text-sm">Search forms, pages...</span>
              </div>
              <kbd className="hidden sm:inline-block font-sans text-sm uppercase border border-border bg-background px-1.5 py-0.5 rounded-xs text-accent-5">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-3 border-l border-border pl-3">
              {user?.picture ? (
                <div className="h-8 w-8 overflow-hidden rounded-full border border-border bg-accent-1">
                  <img
                    src={user.picture}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-accent-2 font-sans text-sm font-semibold text-foreground">
                  {userInitial}
                </div>
              )}

              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-foreground leading-tight font-sans">
                  {userName}
                </span>
                <span className="font-sans text-sm uppercase text-accent-5">
                  {user?.role === "admin" ? "ADMIN" : "TEST USER"}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void logout();
              }}
              className="gap-1.5 font-sans text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex min-h-[calc(100vh-3.5rem)]">
        {/* Left Geist Architectural Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col justify-between border-r border-border bg-background p-4 sticky top-14 h-[calc(100vh-3.5rem)]">
          <div className="space-y-6">
            <div className="px-2">
              <p className="font-sans text-sm uppercase font-semibold text-accent-4 tracking-wider">
                Platform Navigation
              </p>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.key}
                    to={tab.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-sm font-sans font-medium rounded-sm transition-all duration-150 ${isActive
                        ? "bg-accent-1 text-foreground border border-border"
                        : "text-accent-5 hover:text-foreground hover:bg-accent-1 border border-transparent"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground" />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background flex flex-col p-6 space-y-4 pt-20 border-b border-border">
            <div className="px-2">
              <p className="font-sans text-sm uppercase font-semibold text-accent-5">Navigation</p>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.key}
                    to={tab.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 text-sm font-sans font-medium rounded-sm border ${isActive
                        ? "bg-accent-1 text-foreground border-border"
                        : "text-accent-5 hover:text-foreground border-transparent"
                      }`
                    }
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 bg-background">
          {isNavigating ? renderCurrentSkeleton() : <Outlet />}
        </main>
      </div>

      {/* Global Vercel Search Modal Command Palette */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />
    </div>
  );
}
