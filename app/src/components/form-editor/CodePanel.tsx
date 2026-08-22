import { useState } from "react";
import { Copy, Check, ExternalLink, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Form } from "@/types/form";
import { toast } from "sonner";

interface CodePanelProps {
  form: Form;
}

export function CodePanel({ form }: CodePanelProps) {
  const [isIframeCopied, setIsIframeCopied] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [isJsonCopied, setIsJsonCopied] = useState(false);

  const formId = form._id || form.id;
  const shareUrl = `${window.location.origin}/form/${formId}`;
  const iframeSnippet = `<iframe\n  src="${shareUrl}"\n  width="100%"\n  height="650"\n  frameborder="0"\n  marginheight="0"\n  marginwidth="0"\n  title="${form.title || "EasyForm"}"\n>Loading...</iframe>`;

  const jsonSchema = JSON.stringify(
    {
      id: formId,
      title: form.title,
      description: form.description,
      questionsCount: form.questions.length,
      questions: form.questions.map((q) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        required: q.required,
        options: q.options?.map((o) => o.label),
      })),
    },
    null,
    2,
  );

  return (
    <div className="space-y-5 hide-scrollbar">

      {/* HTML Iframe Embed Code */}
      <div className="space-y-2 rounded-sm border border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-accent-6" />
            HTML Iframe Snippet
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[11px] px-2"
            onClick={() => {
              navigator.clipboard.writeText(iframeSnippet);
              setIsIframeCopied(true);
              toast.success("Iframe code copied");
              setTimeout(() => setIsIframeCopied(false), 2000);
            }}
          >
            {isIframeCopied ? (
              <Check className="h-3 w-3 text-geist-success" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {isIframeCopied ? "Copied" : "Copy Code"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-sm border border-border bg-accent-1 p-2.5 text-[11px] text-accent-6 leading-relaxed">
          <code>{iframeSnippet}</code>
        </pre>
      </div>

      {/* Public URL Link */}
      <div className="space-y-2 rounded-sm border border-border bg-background p-3">
        <span className="font-semibold text-xs text-foreground">
          Public Form Link
        </span>
        <div className="flex gap-2">
          <Input
            value={shareUrl}
            readOnly
            className="h-8 border-border bg-accent-1 text-xs flex-1"
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-2.5"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setIsUrlCopied(true);
              toast.success("URL copied");
              setTimeout(() => setIsUrlCopied(false), 2000);
            }}
          >
            {isUrlCopied ? (
              <Check className="h-3 w-3 text-geist-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-2.5"
            onClick={() => window.open(shareUrl, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Form Schema JSON */}
      <div className="space-y-2 rounded-sm border border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-foreground">
            Form JSON Schema
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[11px] px-2"
            onClick={() => {
              navigator.clipboard.writeText(jsonSchema);
              setIsJsonCopied(true);
              toast.success("JSON schema copied");
              setTimeout(() => setIsJsonCopied(false), 2000);
            }}
          >
            {isJsonCopied ? (
              <Check className="h-3 w-3 text-geist-success" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {isJsonCopied ? "Copied" : "Copy JSON"}
          </Button>
        </div>
        <pre className="max-h-48 overflow-y-auto rounded-sm border border-border bg-accent-1 p-2.5 text-[11px] text-accent-6 leading-relaxed">
          <code>{jsonSchema}</code>
        </pre>
      </div>
    </div>
  );
}
