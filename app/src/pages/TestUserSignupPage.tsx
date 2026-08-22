import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import Logo from "@/components/ui/Logo";
import { Loader } from "lucide-react";
import { useAuth } from "@/context/auth";

export function TestUserSignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsTestUserWithGoogle } = useAuth();
  const googleClientId = import.meta.env.VITE_CLIENT_ID as string | undefined;

  const handleGoogleTestLogin = async (idToken?: string) => {
    if (!idToken) {
      toast.error("Google authentication failed");
      return;
    }

    setIsLoading(true);
    try {
      await loginAsTestUserWithGoogle(idToken);
      toast.success("Signed in as test user");
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign in failed";
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
            className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 hover:border-zinc-700 transition-colors"
          >
            <Logo size={22} />
            <span className="text-base font-bold tracking-tight text-white">
              EasyForms
            </span>
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-6 sm:p-8 shadow-sm text-center space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Test User Signup
            </h1>
            <p className="text-sm text-zinc-400">
              Sign up with Google to explore EasyForms workspace features.
            </p>
          </div>

          <div className="space-y-4">
            {googleClientId ? (
              <GoogleOAuthProvider clientId={googleClientId}>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      void handleGoogleTestLogin(credentialResponse.credential);
                    }}
                    onError={() => toast.error("Google authentication failed")}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="pill"
                  />
                </div>
              </GoogleOAuthProvider>
            ) : (
              <div className="rounded-md border border-zinc-800 bg-black p-4 text-xs text-zinc-400">
                Google test signup requires `VITE_CLIENT_ID` configuration.
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={isLoading}
              className="w-full text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Switch to Admin Sign In →</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
