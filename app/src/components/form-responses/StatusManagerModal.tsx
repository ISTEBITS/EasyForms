import { useState, useEffect } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface StatusOption {
  id: string;
  label: string;
  colorKey: StatusColorKey;
}

export type StatusColorKey =
  | "gray"
  | "blue"
  | "emerald"
  | "amber"
  | "red"
  | "purple"
  | "teal"
  | "pink"
  | "indigo"
  | "orange"
  | "cyan";

export const STATUS_COLORS: Record<
  StatusColorKey,
  { name: string; bg: string; text: string; border: string; previewBg: string }
> = {
  gray: {
    name: "Gray / Neutral",
    bg: "bg-accent-1 text-accent-6 border-border",
    text: "text-accent-6",
    border: "border-border",
    previewBg: "bg-neutral-600",
  },
  blue: {
    name: "Blue",
    bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    text: "text-blue-400",
    border: "border-blue-500/30",
    previewBg: "bg-blue-500",
  },
  emerald: {
    name: "Emerald Green",
    bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    previewBg: "bg-emerald-500",
  },
  amber: {
    name: "Amber / Yellow",
    bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    text: "text-amber-400",
    border: "border-amber-500/30",
    previewBg: "bg-amber-500",
  },
  red: {
    name: "Crimson Red",
    bg: "bg-red-500/15 text-red-400 border-red-500/30",
    text: "text-red-400",
    border: "border-red-500/30",
    previewBg: "bg-red-500",
  },
  purple: {
    name: "Purple",
    bg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    text: "text-purple-400",
    border: "border-purple-500/30",
    previewBg: "bg-purple-500",
  },
  teal: {
    name: "Teal",
    bg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    text: "text-teal-400",
    border: "border-teal-500/30",
    previewBg: "bg-teal-500",
  },
  pink: {
    name: "Pink",
    bg: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    text: "text-pink-400",
    border: "border-pink-500/30",
    previewBg: "bg-pink-500",
  },
  indigo: {
    name: "Indigo",
    bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    previewBg: "bg-indigo-500",
  },
  orange: {
    name: "Orange",
    bg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    text: "text-orange-400",
    border: "border-orange-500/30",
    previewBg: "bg-orange-500",
  },
  cyan: {
    name: "Cyan",
    bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    previewBg: "bg-cyan-500",
  },
};

export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { id: "Unreviewed", label: "Unreviewed", colorKey: "gray" },
  { id: "Reviewed", label: "Reviewed", colorKey: "blue" },
  { id: "Approved", label: "Approved", colorKey: "emerald" },
  { id: "Flagged", label: "Flagged", colorKey: "amber" },
  { id: "Rejected", label: "Rejected", colorKey: "red" },
];

interface InternalStatusOption extends StatusOption {
  _key: string;
  originalId: string;
}

interface StatusManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusOptions: StatusOption[];
  onSaveOptions: (options: StatusOption[], renameMap?: Record<string, string>) => void;
}

export function StatusManagerModal({
  isOpen,
  onClose,
  statusOptions,
  onSaveOptions,
}: StatusManagerModalProps) {
  const [options, setOptions] = useState<InternalStatusOption[]>([]);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState<StatusColorKey>("purple");

  // Re-sync options when modal opens or statusOptions change
  useEffect(() => {
    if (isOpen) {
      setOptions(
        statusOptions.map((opt, idx) => ({
          ...opt,
          _key: `status_${opt.id || opt.label}_${idx}_${Date.now()}_${Math.random()}`,
          originalId: opt.id || opt.label,
        }))
      );
      setNewStatusLabel("");
    }
  }, [isOpen, statusOptions]);

  if (!isOpen) return null;

  const handleUpdateOption = (
    key: string,
    updates: Partial<Pick<StatusOption, "label" | "colorKey">>
  ) => {
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt._key !== key) return opt;
        return {
          ...opt,
          ...updates,
        };
      })
    );
  };

  const handleDeleteOption = (key: string) => {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((opt) => opt._key !== key));
  };

  const handleAddNewStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newStatusLabel.trim();
    if (!label) return;

    // If duplicate label already exists, don't add
    if (options.some((o) => o.label.trim().toLowerCase() === label.toLowerCase())) {
      return;
    }

    const newOption: InternalStatusOption = {
      _key: `status_new_${Date.now()}_${Math.random()}`,
      originalId: "",
      id: label,
      label: label,
      colorKey: newStatusColor,
    };

    setOptions((prev) => [...prev, newOption]);
    setNewStatusLabel("");
  };

  const handleSaveAndClose = () => {
    // Build a rename map: old status value -> new status value
    const renameMap: Record<string, string> = {};

    const cleanOptions: StatusOption[] = options.map((opt) => {
      const finalLabel = opt.label.trim() || opt.originalId || "Status";
      if (opt.originalId && opt.originalId !== finalLabel) {
        renameMap[opt.originalId] = finalLabel;
        renameMap[opt.originalId.toLowerCase()] = finalLabel;
      }
      return {
        id: finalLabel,
        label: finalLabel,
        colorKey: opt.colorKey,
      };
    });

    onSaveOptions(cleanOptions, renameMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div
        className="relative w-full max-w-lg rounded-md border border-[#262626] bg-[#0c0c0c] text-foreground shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              Manage Status Values & Colors
            </h3>
            <p className="text-sm text-accent-5">
              Customize status labels and assign custom background color themes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto hide-scrollbar">
          {/* Status List */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-foreground block">
              Current Statuses
            </Label>

            <div className="space-y-2">
              {options.map((opt) => {
                return (
                  <div
                    key={opt._key}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-sm border border-border bg-background"
                  >
                    {/* Status Label Input */}
                    <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                      <Input
                        value={opt.label}
                        onChange={(e) =>
                          handleUpdateOption(opt._key, { label: e.target.value })
                        }
                        placeholder="Status label..."
                        className="h-8 border-border bg-background text-sm font-medium text-foreground"
                      />
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(Object.keys(STATUS_COLORS) as StatusColorKey[]).map(
                        (cKey) => {
                          const c = STATUS_COLORS[cKey];
                          const isSelected = opt.colorKey === cKey;
                          return (
                            <button
                              key={cKey}
                              type="button"
                              title={c.name}
                              onClick={() =>
                                handleUpdateOption(opt._key, { colorKey: cKey })
                              }
                              className={`h-5 w-5 rounded-full ${c.previewBg} transition-transform flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                                  : "opacity-75 hover:opacity-100 hover:scale-105"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white stroke-[3]" />
                              )}
                            </button>
                          );
                        }
                      )}

                      {/* Delete Status */}
                      {options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(opt._key)}
                          className="p-1 rounded-sm text-accent-4 hover:text-red-400 hover:bg-red-500/10 ml-1 cursor-pointer transition-colors"
                          title="Delete status"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Status Form */}
          <form
            onSubmit={handleAddNewStatus}
            className="p-4 rounded-sm border border-dashed border-border bg-accent-1/30 space-y-3"
          >
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Plus className="h-4 w-4 text-geist-success" />
              <span>Add New Status</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Input
                value={newStatusLabel}
                onChange={(e) => setNewStatusLabel(e.target.value)}
                placeholder="e.g. In Progress, Follow Up, Completed..."
                className="h-9 border-border bg-background text-sm font-sans"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                {(Object.keys(STATUS_COLORS) as StatusColorKey[]).slice(0, 6).map(
                  (cKey) => {
                    const c = STATUS_COLORS[cKey];
                    const isSelected = newStatusColor === cKey;
                    return (
                      <button
                        key={cKey}
                        type="button"
                        title={c.name}
                        onClick={() => setNewStatusColor(cKey)}
                        className={`h-5 w-5 rounded-full ${c.previewBg} transition-transform flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white stroke-[3]" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              <Button
                type="submit"
                disabled={!newStatusLabel.trim()}
                className="h-9 px-4 rounded-sm text-sm font-medium bg-foreground text-background hover:bg-accent-7 shrink-0 cursor-pointer disabled:opacity-50"
              >
                Add Status
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium rounded-sm border-border cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndClose}
            className="h-9 px-5 text-sm font-medium rounded-sm bg-foreground text-background hover:bg-accent-7 shadow-xs cursor-pointer"
          >
            Save Status Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
