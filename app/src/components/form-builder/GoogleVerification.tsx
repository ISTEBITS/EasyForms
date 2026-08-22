import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { toast } from "sonner";
import { Shield, UserCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

interface Props {
  onVerified: (token: string, displayEmail: string) => void;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const base64Url = token.split(".")[1];
  if (!base64Url) return null;

  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const decoded = atob(padded);
  return JSON.parse(decoded) as Record<string, unknown>;
}

function GoogleButton({ onVerified }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      const nextWidth = Math.max(
        180,
        Math.min(320, Math.floor(element.clientWidth)),
      );
      setButtonWidth(nextWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-sm flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          try {
            const idToken = credentialResponse.credential;
            if (!idToken) {
              toast.error("Authentication failed");
              return;
            }

            const payload = decodeJwtPayload(idToken);
            const email = payload?.email;
            if (typeof email !== "string" || !email) {
              toast.error("Unable to retrieve account information");
              return;
            }

            onVerified(idToken, email);
          } catch (error) {
            console.log(error);
            toast.error("Authentication failed");
          }
        }}
        onError={() => toast.error("Authentication failed")}
        theme="outline"
        size="large"
        text="continue_with"
        shape="pill"
        width={String(buttonWidth)}
      />
    </div>
  );
}

export function GoogleVerification({ onVerified }: Props) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-sm border border-border bg-accent-1 p-4 text-xs text-accent-5">
        Authentication unavailable. Configuration required.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="rounded-sm border border-border bg-accent-1/60 p-5 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-accent-1">
            <Shield className="h-5 w-5 text-accent-7" />
          </div>

          <h3 className="text-sm font-semibold text-foreground">
            Verify Identity
          </h3>

          <p className="mt-1 text-xs text-accent-5">
            Continue with Google to submit this form.
          </p>

          <div className="mt-4 flex w-full max-w-sm flex-col items-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-xs text-accent-5">
              <UserCheck className="h-3.5 w-3.5" />
              Secure verification
            </div>

            <GoogleButton onVerified={onVerified} />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
