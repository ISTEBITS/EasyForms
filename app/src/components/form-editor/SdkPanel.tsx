import { useState } from "react";
import { Copy, Check, Terminal, Layers, Key, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Form } from "@/types/form";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Highlight, themes } from "prism-react-renderer";

interface SdkPanelProps {
  form: Form;
}


function CodeBlock() {
  const codeSnippet = `import { EasyForm } from '@easyforms/react';
import '@easyforms/react/styles.css';

export function FormWidget() {
  return (
    <EasyForm
      formId="{formId}"
      apiKey="ef_live_YOUR_API_KEY"
      theme="vercel"
      onSuccess={(submission) => {
        console.log("Recorded submission:", submission);
      }}
      showProgressBar={true}
    />
  );
}`;

  return (
    <div className="rounded-xs border border-zinc-800 bg-zinc-950 p-3.5 overflow-x-auto">
      <Highlight
        theme={themes.dracula} // You can swap this with themes.nightOwl or themes.dracula
        code={codeSnippet}
        language="tsx"
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} font-mono  `}
            style={{ ...style, backgroundColor: "transparent" }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

export function SdkPanel({ form }: SdkPanelProps) {
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [packageManager, setPackageManager] = useState<"npm" | "pnpm" | "yarn">("npm");

  const formId = form._id || form.id;

  const installCommands = {
    npm: "npm install @easyforms/react",
    pnpm: "pnpm add @easyforms/react",
    yarn: "yarn add @easyforms/react",
  };

  const reactSnippet = `import { EasyForm } from '@easyforms/react';
import '@easyforms/react/styles.css';

export function FormWidget() {
  return (
    <EasyForm
      formId="${formId}"
      apiKey="ef_live_YOUR_API_KEY"
      theme="vercel"
      onSuccess={(submission) => {
        console.log("Recorded submission:", submission);
      }}
      showProgressBar={true}
    />
  );
}`;

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-2 text-xs font-sans text-foreground hide-scrollbar">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            React SDK Integration
          </h3>
        </div>
        <span className="text-xs font-medium text-accent-5">3 Steps</span>
      </div>

      <div className="p-2 space-y-4">
        {/* Step 1: Generate API Key */}
        <div className="rounded-xs border border-border bg-background p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-semibold">
                1
              </span>
              <h4 className="text-xs font-semibold text-foreground">
                Generate API Key
              </h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/api-keys")}
              className="h-7 px-2 text-xs font-medium text-geist-success hover:text-geist-success/80"
            >
              <Key className="h-3.5 w-3.5 mr-1" />
              API Keys <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <p className="text-xs text-accent-5 leading-normal">
            Create an API key from your dashboard to authenticate requests from your React application.
          </p>

          <div className="flex gap-2 items-center">
            <Input
              value="ef_live_YOUR_API_KEY"
              readOnly
              className="border-border bg-accent-1 text-xs text-accent-6 flex-1"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-3 text-xs font-medium"
              onClick={() => copyToClipboard("ef_live_YOUR_API_KEY", "apiKey", "API Key placeholder")}
            >
              {copiedKey === "apiKey" ? (
                <Check className="h-3.5 w-3.5 text-geist-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Step 2: Install SDK */}
        <div className="rounded-xs border border-border bg-background p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-semibold">
                2
              </span>
              <h4 className="text-xs font-semibold text-foreground">
                Install the React SDK
              </h4>
            </div>
            <div className="flex items-center rounded-xs bg-accent-1 p-0.5 border border-border">
              {(["npm", "pnpm", "yarn"] as const).map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPackageManager(pm)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-geist ${packageManager === pm
                    ? "bg-background text-foreground shadow-xs"
                    : "text-accent-5 hover:text-foreground"
                    }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xs border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="h-3.5 w-3.5 text-geist-success shrink-0" />
              <span className="truncate">{installCommands[packageManager]}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => copyToClipboard(installCommands[packageManager], "install", "Install command")}
            >
              {copiedKey === "install" ? (
                <Check className="h-3.5 w-3.5 text-geist-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Step 3: Paste Code */}
        <div className="rounded-xs border border-border bg-background p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-semibold">
                3
              </span>
              <h4 className="text-xs font-semibold text-foreground">
                Paste Component Code
              </h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs font-medium text-accent-6 hover:text-foreground"
              onClick={() => copyToClipboard(reactSnippet, "snippet", "React SDK code")}
            >
              {copiedKey === "snippet" ? (
                <Check className="h-3.5 w-3.5 text-geist-success mr-1" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              {copiedKey === "snippet" ? "Copied" : "Copy Code"}
            </Button>
          </div>
          <CodeBlock />
        </div>
      </div>

    </div>
  );
}
