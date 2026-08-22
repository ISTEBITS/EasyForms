import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmittedStateProps {
  confirmationMessage?: string;
}

export function SubmittedState({ confirmationMessage }: SubmittedStateProps) {
  return (
    <div className="rounded-sm border border-border bg-accent-1 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-accent-1">
        <CheckCircle2 className="h-7 w-7 text-accent-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {confirmationMessage || "Submission Received"}
      </h3>
      <p className="mt-2 text-sm text-accent-5">
        Your response has been securely recorded.
      </p>
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
    <div className="rounded-sm border border-border bg-accent-1 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-accent-1">
        <AlertCircle className="h-7 w-7 text-accent-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Response Limit Reached
      </h3>
      <p className="mt-2 text-sm text-accent-5">
        A response already exists for{" "}
        <span className="text-foreground">
          {displayEmail || "this account"}
        </span>.
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={onSwitchAccount}
        className="mt-4"
      >
        Switch Google Account
      </Button>
    </div>
  );
}
