import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { ArrowRight, Loader, Lock, User } from "lucide-react";
import Logo from "@/components/ui/Logo";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login({ username, password });
      toast.success("Welcome back, Admin");
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Invalid credentials";
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 font-sans bg-black">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xs border border-zinc-800 bg-zinc-950 px-4 py-2 hover:border-zinc-700 transition-colors"
          >
            <Logo size={22} />
            <span className="text-base font-bold tracking-tight text-white">
              EasyForms
            </span>
          </Link>
        </div>

        <div className="rounded-xs border border-zinc-800 bg-zinc-950/90 p-6 sm:p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Admin Sign In
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              Enter your administrative credentials to manage EasyForms.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-zinc-400">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 w-full rounded-xs border border-zinc-800 bg-black pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-zinc-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-xs border border-zinc-800 bg-black pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xs bg-white text-sm font-semibold text-black hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
