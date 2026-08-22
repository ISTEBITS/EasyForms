import type { ComponentType } from "react";
import { Plus, FileText, Calendar, MessageSquare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DashboardHeaderProps {
  showTemplates: boolean;
  onShowTemplatesChange: (open: boolean) => void;
  onCreateBlankForm: () => Promise<void>;
  onCreateFromTemplate: (name: string) => Promise<void>;
  disableCreate?: boolean;
}

const templateOptions: Array<{
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    name: "Event Registration",
    description: "Collect attendee and ticket registration details.",
    icon: Calendar,
  },
  {
    name: "Customer Feedback",
    description: "Measure customer satisfaction and rating scores.",
    icon: MessageSquare,
  },
  {
    name: "Job Application",
    description: "Capture candidate details and resume submissions.",
    icon: Briefcase,
  },
];

export function DashboardHeader({
  showTemplates,
  onShowTemplatesChange,
  onCreateBlankForm,
  onCreateFromTemplate,
  disableCreate = false,
}: DashboardHeaderProps) {
  return (
    <header className="mb-6 rounded-sm border border-border bg-background p-4 flex items-center justify-between">
      <div className="flex items-center gap-2 font-sans">
        <span className="font-mono text-xs uppercase font-semibold border border-border px-2.5 py-0.5 rounded-full bg-accent-1 text-accent-6">
          Form Management
        </span>
        <span className="text-xs text-accent-5 hidden sm:inline-block">
          Use <kbd className="font-mono border border-border bg-accent-1 px-1 py-0.5 rounded-xs text-accent-6">⌘K</kbd> for global search
        </span>
      </div>

      <Dialog open={showTemplates} onOpenChange={onShowTemplatesChange}>
        <DialogTrigger
          render={
            <Button
              disabled={disableCreate}
              variant="primary"
              size="md"
              className="gap-2 shrink-0 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Create Form</span>
            </Button>
          }
        />
          <DialogContent className="bg-background text-foreground sm:max-w-xl p-6">
            <DialogHeader className="mb-4 text-left space-y-1">
              <DialogTitle className="text-lg font-semibold text-foreground font-sans">Create Form</DialogTitle>
              <DialogDescription className="text-xs text-accent-5 font-sans">
                Start with a blank canvas or select a template.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  void onCreateBlankForm();
                }}
                className="group flex flex-col justify-between rounded-sm border border-border bg-background p-4 text-left transition-all hover:border-accent-7"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground mb-3">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground font-sans">Blank Form</h4>
                  <p className="mt-1 text-xs text-accent-5 font-sans">
                    Build a custom form from scratch.
                  </p>
                </div>
              </button>

              {templateOptions.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => {
                      void onCreateFromTemplate(template.name);
                    }}
                    className="group flex flex-col justify-between rounded-sm border border-border bg-background p-4 text-left transition-all hover:border-accent-7"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground mb-3">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground font-sans">
                        {template.name}
                      </h4>
                      <p className="mt-1 text-xs text-accent-5 font-sans">
                        {template.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
    </header>
  );
}
