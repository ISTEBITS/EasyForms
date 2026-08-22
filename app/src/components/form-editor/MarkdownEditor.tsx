import { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Code,
  Quote,
  List,
  Link,
  Heading3,
  Eye,
  Edit3,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { renderMarkdownPreview } from "@/lib/form-header-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  rows?: number;
  tokens?: { label: string; token: string }[];
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write markdown here...",
  minHeight = "min-h-[120px]",
  rows = 5,
  tokens = [],
  className = "",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${prefix}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${prefix}${selectedText || "text"}${suffix}`;

    const newValue =
      value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 4),
      );
    }, 10);
  };

  const insertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value} ${token}`);
      return;
    }

    const start = textarea.selectionStart;
    const newValue =
      value.substring(0, start) + ` ${token} ` + value.substring(start);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + token.length + 2,
        start + token.length + 2,
      );
    }, 10);
  };

  return (
    <div
      className={`rounded-sm border border-border bg-background transition-geist duration-150 focus-within:border-accent-8 ${className}`}
    >
      {/* Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-accent-1/50 px-3 py-2">
        {/* Formatting Actions */}
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("**", "**")}
            title="Bold (**text**)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("*", "*")}
            title="Italic (*text*)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("~~", "~~")}
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("### ")}
            title="Heading (### Heading)"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("`", "`")}
            title="Code (`code`)"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("> ")}
            title="Quote (> quote)"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("- ")}
            title="Bullet List (- item)"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent-5 hover:bg-accent-2 hover:text-foreground"
            onClick={() => insertFormatting("[Link Text](", ")")}
            title="Link ([text](url))"
          >
            <Link className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Tab Switcher: Write / Preview */}
        <div className="flex items-center rounded-sm bg-accent-2/60 p-0.5 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xs transition-geist duration-150 ${
              activeTab === "write"
                ? "bg-background text-foreground shadow-xs"
                : "text-accent-5 hover:text-foreground"
            }`}
          >
            <Edit3 className="h-3 w-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xs transition-geist duration-150 ${
              activeTab === "preview"
                ? "bg-background text-foreground shadow-xs"
                : "text-accent-5 hover:text-foreground"
            }`}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Dynamic Token Insert Chips (if provided) */}
      {tokens.length > 0 && activeTab === "write" && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-accent-1/30 px-3 py-1.5 text-xs">
          <span className="text-accent-4 font-medium mr-1">Variables:</span>
          {tokens.map((t) => (
            <button
              key={t.token}
              type="button"
              onClick={() => insertToken(t.token)}
              className="rounded-xs border border-border bg-background px-1.5 py-0.5 font-sans text-[11px] text-accent-6 transition-geist hover:border-accent-7 hover:text-foreground"
            >
              + {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Editor / Preview Content */}
      <div className="p-3">
        {activeTab === "write" ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`w-full rounded-xs border-0 bg-transparent px-2 py-2 text-sm text-foreground focus:ring-0 placeholder:text-accent-4 resize-y ${minHeight}`}
          />
        ) : (
          <div
            className={`prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed ${minHeight}`}
            dangerouslySetInnerHTML={{
              __html:
                renderMarkdownPreview(value) ||
                '<p class="text-accent-4 italic">Nothing to preview</p>',
            }}
          />
        )}
      </div>
    </div>
  );
}
