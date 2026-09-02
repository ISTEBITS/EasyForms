import { useGoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

interface Props {
  onVerified: (token: string, displayEmail: string) => void;
}

function CustomGoogleSignInButton({ onVerified }: Props) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          toast.error("Authentication failed");
          setIsAuthenticating(false);
          return;
        }

        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          toast.error("Unable to retrieve account information");
          setIsAuthenticating(false);
          return;
        }

        const data = await res.json();
        const email = data.email;
        if (!email) {
          toast.error("Email not found on Google account");
          setIsAuthenticating(false);
          return;
        }

        onVerified(accessToken, email);
      } catch (err) {
        console.error(err);
        toast.error("Authentication process failed");
      } finally {
        setIsAuthenticating(false);
      }
    },
    onError: () => {
      setIsAuthenticating(false);
    },
    onNonOAuthError: (nonOAuthError) => {
      setIsAuthenticating(false);
      if (nonOAuthError.type === "popup_closed") {
        toast.info("Google sign-in was cancelled");
      }
    },
  });

  const handleSignIn = () => {
    setIsAuthenticating(true);
    login();
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isAuthenticating}
      className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-sm border border-border bg-background px-4 text-sm font-medium text-foreground transition-all duration-150 hover:bg-accent-1 hover:border-accent-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-accent-6" />
          <span className="font-sans">Authenticating...</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27a7.195 7.195 0 0 1 0-4.54V6.58H1.25a11.986 11.986 0 0 0 0 10.84l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span className="font-sans">Sign in with Google</span>
        </>
      )}
    </button>
  );
}

export function GoogleVerification({ onVerified }: Props) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-md border border-border bg-accent-1 p-3.5 text-sm text-accent-5 font-sans">
        Google Authentication is unavailable. Configuration required.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CustomGoogleSignInButton onVerified={onVerified} />
    </GoogleOAuthProvider>
  );
}
