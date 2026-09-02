import { useState } from "react";
import { Check, ShieldAlert, ArrowLeft, RefreshCw, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface SubmittedStateProps {
  confirmationMessage?: string;
}

export function SubmittedState({ confirmationMessage }: SubmittedStateProps) {
  const [copied, setCopied] = useState(false);
  const refId = `EF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(refId);
      setCopied(true);
      toast.success("Confirmation reference copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy reference");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-background p-8 sm:p-12 text-center shadow-xs space-y-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Glow Effect */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Success Icon */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shadow-2xs">
        <Check className="h-7 w-7 stroke-[2.5]" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-sans">
          {confirmationMessage || "Submission Recorded"}
        </h2>
        <p className="text-sm text-accent-5 max-w-md mx-auto leading-relaxed font-sans">
          Thank you! Your response has been securely transmitted and encrypted.
        </p>
      </div>

      {/* Reference Card */}
      <div className="mx-auto max-w-xs rounded-sm border border-border bg-accent-1/40 p-3 flex items-center justify-between gap-2">
        <div className="text-left">
          <p className="text-xs font-sans uppercase tracking-wider text-accent-4">
            Receipt Reference
          </p>
          <p className="text-xs font-sans font-medium text-foreground">{refId}</p>
        </div>
        <button
          type="button"
          onClick={handleCopyRef}
          className="rounded-xs p-1.5 text-accent-5 hover:bg-accent-2 hover:text-foreground transition-colors cursor-pointer"
          title="Copy Reference ID"
        >
          {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="rounded-sm px-4 h-9 text-xs font-medium font-sans border-border"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Submit Another Response
        </Button>

        <Link
          to="/"
          className="inline-flex h-9 items-center justify-center rounded-sm bg-foreground px-4 text-xs font-medium text-background transition-all hover:bg-accent-7 font-sans"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

interface AlreadyRespondedStateProps {
  displayEmail: string | null;
  onSwitchAccount: () => void;
}

export function AlreadyRespondedState({
  displayEmail,
  onSwitchAccount,
}: AlreadyRespondedStateProps) {
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-background p-8 sm:p-12 text-center shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-2xs">
        <ShieldAlert className="h-7 w-7" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-sans">
          Single Response Limit
        </h2>
        <p className="text-sm text-accent-5 max-w-md mx-auto leading-relaxed font-sans">
          This form is configured to accept only one submission per account. A response was already recorded for{" "}
          <span className="font-sans text-foreground font-medium">
            {displayEmail || "your account"}
          </span>.
        </p>
      </div>

      <div className="pt-3 flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={onSwitchAccount}
          className="rounded-sm px-4 h-9 text-xs font-medium font-sans border-border"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Switch Google Account
        </Button>
      </div>
    </div>
  );
}
