import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Key,
  Activity,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formsApi } from "@/api";
import type { Form } from "@/types/form";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchItem = {
  id: string;
  category: "Navigation" | "Forms" | "Actions";
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
};

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch forms when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setLoading(true);
      formsApi
        .getAll()
        .then((data) => setForms(data))
        .catch(() => setForms([]))
        .finally(() => setLoading(false));

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const navigationItems: SearchItem[] = useMemo(
    () => [
      {
        id: "nav-dashboard",
        category: "Navigation",
        title: "Dashboard",
        description: "View form metrics and workspace overview",
        icon: LayoutDashboard,
        onSelect: () => {
          navigate("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-editor",
        category: "Navigation",
        title: "Form Editor",
        description: "Build and edit questions, themes, and SDK options",
        icon: FileText,
        onSelect: () => {
          navigate("/editor");
          onClose();
        },
      },
      {
        id: "nav-responses",
        category: "Navigation",
        title: "Responses & Submissions",
        description: "Track submission records and export CSV analytics",
        icon: MessageSquareText,
        onSelect: () => {
          navigate("/responses");
          onClose();
        },
      },
      {
        id: "nav-api-keys",
        category: "Navigation",
        title: "API Keys & Credentials",
        description: "Manage SDK authentication keys and developer tokens",
        icon: Key,
        onSelect: () => {
          navigate("/api-keys");
          onClose();
        },
      },
      {
        id: "nav-activity",
        category: "Navigation",
        title: "Activity Log",
        description: "Audit trail for system events and test user actions",
        icon: Activity,
        onSelect: () => {
          navigate("/activity");
          onClose();
        },
      },
    ],
    [navigate, onClose]
  );

  const actionItems: SearchItem[] = useMemo(
    () => [
      {
        id: "action-new-form",
        category: "Actions",
        title: "Create New Form",
        description: "Start a new form with custom questions or templates",
        icon: Plus,
        onSelect: () => {
          navigate("/dashboard");
          onClose();
        },
      },
      {
        id: "action-api-keys",
        category: "Actions",
        title: "Generate New API Key",
        description: "Create a live API key for @easyforms/react SDK",
        icon: Sparkles,
        onSelect: () => {
          navigate("/api-keys");
          onClose();
        },
      },
    ],
    [navigate, onClose]
  );

  const formItems: SearchItem[] = useMemo(() => {
    return forms.map((form) => ({
      id: `form-${form._id || form.id}`,
      category: "Forms",
      title: form.title || "Untitled Form",
      description: form.description || `${form.responseCount || 0} responses recorded`,
      icon: FileText,
      onSelect: () => {
        navigate(`/editor/${form._id || form.id}`);
        onClose();
      },
    }));
  }, [forms, navigate, onClose]);

  const allItems = useMemo(() => {
    const combined = [...navigationItems, ...formItems, ...actionItems];
    if (!query.trim()) return combined;
    const lower = query.toLowerCase();
    return combined.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
    );
  }, [navigationItems, formItems, actionItems, query]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const categories: Record<string, SearchItem[]> = {};
    allItems.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  }, [allItems]);

  // Keyboard navigation inside search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
      } else if (e.key === "Enter" && allItems[selectedIndex]) {
        e.preventDefault();
        allItems[selectedIndex].onSelect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-sm border border-border bg-background shadow-2xl overflow-hidden flex flex-col font-sans animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 py-3 gap-3 bg-background">
          <Search className="h-4 w-4 text-accent-5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search forms, pages, responses..."
            className="w-full bg-transparent text-sm font-sans text-foreground placeholder:text-accent-4 outline-none border-none focus:outline-none focus:ring-0"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xs text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors"
          >
            <kbd className="font-mono text-[10px] uppercase border border-border bg-accent-1 px-1.5 py-0.5 rounded-xs text-accent-5">
              ESC
            </kbd>
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4 divide-y divide-border/40">
          {loading ? (
            <div className="p-8 text-center font-mono text-xs text-accent-5">
              Searching EasyForms...
            </div>
          ) : allItems.length === 0 ? (
            <div className="p-8 text-center font-sans text-xs text-accent-5">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="pt-2 first:pt-0 space-y-1">
                <div className="px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent-4">
                  {category}
                </div>
                {items.map((item) => {
                  const currentIndex = globalIndex++;
                  const isHighlighted = currentIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => item.onSelect()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xs cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-accent-1 text-foreground border border-border"
                          : "text-accent-6 hover:bg-accent-1/60 hover:text-foreground border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-border ${isHighlighted ? "bg-background text-foreground" : "bg-accent-1 text-accent-5"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate font-sans">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-accent-5 truncate font-sans">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isHighlighted && (
                        <ArrowRight className="h-3.5 w-3.5 text-accent-5 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Keyboard Shortcuts */}
        <div className="border-t border-border bg-accent-1/50 px-4 py-2 flex items-center justify-between font-mono text-[10px] text-accent-5">
          <div className="flex items-center gap-3">
            <span><kbd className="border border-border bg-background px-1 py-0.5 rounded-xs">↑↓</kbd> Navigate</span>
            <span><kbd className="border border-border bg-background px-1 py-0.5 rounded-xs">↵</kbd> Select</span>
            <span><kbd className="border border-border bg-background px-1 py-0.5 rounded-xs">esc</kbd> Dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
}
