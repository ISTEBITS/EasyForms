import { useState } from "react";
import {
  Palette,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { FormTheme } from "@/types/form";

interface DesignPanelProps {
  theme: FormTheme;
  onUpdateTheme: (updates: Partial<FormTheme>) => void;
  onUploadThemeAsset: (
    target: "logoUrl" | "bannerUrl",
    file: File,
  ) => Promise<void>;
  isUploading: boolean;
  isTestUser: boolean;
}

const PRIMARY_COLOR_SWATCHES = [
  { name: "Vercel Blue", value: "#0070f3" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Monochrome", value: "#000000" },
];

const BACKGROUND_COLOR_SWATCHES = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Off White", value: "#fafafa" },
  { name: "Midnight", value: "#090909" },
  { name: "Slate", value: "#0f172a" },
  { name: "Charcoal", value: "#18181b" },
];

const BACKGROUND_PRESETS = [
  {
    id: "preset-1",
    name: "Yellow Sunshine",
    bg: "#fef08a",
    style: "bg-amber-100 border-amber-300",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "preset-2",
    name: "Midnight Mesh",
    bg: "#090909",
    style: "bg-neutral-900 border-neutral-700",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "preset-3",
    name: "Sunset Gradient",
    bg: "#ffedd5",
    style: "bg-gradient-to-r from-orange-400 to-rose-400 border-orange-300",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "preset-4",
    name: "Minimal Dots",
    bg: "#ffffff",
    style: "bg-slate-100 border-slate-300",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "preset-5",
    name: "Indigo Waves",
    bg: "#312e81",
    style: "bg-indigo-950 border-indigo-800",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "preset-6",
    name: "Emerald Nature",
    bg: "#064e3b",
    style: "bg-emerald-950 border-emerald-800",
    url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60",
  },
];

export function DesignPanel({
  theme,
  onUpdateTheme,
  onUploadThemeAsset: _onUploadThemeAsset,
  isUploading: _isUploading,
  isTestUser: _isTestUser,
}: DesignPanelProps) {
  const [activePresetTab, setActivePresetTab] = useState<
    "swatches" | "images"
  >("swatches");
  const [isGlobalOpen, setIsGlobalOpen] = useState(true);
  const [isBrandingOpen, setIsBrandingOpen] = useState(true);
  void _onUploadThemeAsset;
  void _isUploading;
  void _isTestUser;
  void isBrandingOpen;
  void setIsBrandingOpen;

  return (
    <div className="flex h-full w-full flex-col space-y-5 overflow-y-auto pr-1 text-xs hide-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-geist-success" />
          <h3 className="font-semibold text-sm text-foreground">Design</h3>
        </div>
      </div>

      <div className="space-y-2 px-2">
        {/* Global Section Accordion */}
        <div className="rounded-xs border border-border bg-background">
          <button
            type="button"
            onClick={() => setIsGlobalOpen(!isGlobalOpen)}
            className="flex w-full items-center justify-between p-3 text-left font-semibold text-foreground hover:bg-accent-1/50 transition-geist"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-accent-6" />
              <span>Global Theme</span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-accent-5 transition-transform duration-200 ${isGlobalOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {isGlobalOpen && (
            <div className="space-y-4 border-t border-border p-3">
              {/* Primary Accent Color Picker */}
              <div className="space-y-2">
                <Label className="text-[11px] text-accent-5 font-medium">
                  Primary Accent Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor || "#0070f3"}
                    onChange={(e) =>
                      onUpdateTheme({ primaryColor: e.target.value })
                    }
                    className="h-7 w-9 rounded-xs border border-border bg-transparent cursor-pointer"
                  />
                  <Input
                    value={theme.primaryColor || "#0070f3"}
                    onChange={(e) =>
                      onUpdateTheme({ primaryColor: e.target.value })
                    }
                    className="h-7 border-border bg-accent-1 text-xs font-mono"
                  />
                </div>

                {/* Quick Primary Swatches */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRIMARY_COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      type="button"
                      title={swatch.name}
                      onClick={() =>
                        onUpdateTheme({ primaryColor: swatch.value })
                      }
                      className="h-5 w-5 rounded-xs border border-border transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: swatch.value }}
                    >
                      {theme.primaryColor === swatch.value && (
                        <Check className="h-3 w-3 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color Picker */}
              <div className="space-y-2">
                <Label className="text-[11px] text-accent-5 font-medium">
                  Background Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      onUpdateTheme({ backgroundColor: e.target.value })
                    }
                    className="h-7 w-9 rounded-xs border border-border bg-transparent cursor-pointer"
                  />
                  <Input
                    value={theme.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      onUpdateTheme({ backgroundColor: e.target.value })
                    }
                    className="h-7 border-border bg-accent-1 text-xs font-mono"
                  />
                </div>

                {/* Quick Background Swatches */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {BACKGROUND_COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      type="button"
                      title={swatch.name}
                      onClick={() =>
                        onUpdateTheme({ backgroundColor: swatch.value })
                      }
                      className="h-5 w-5 rounded-xs border border-border transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: swatch.value }}
                    >
                      {theme.backgroundColor === swatch.value && (
                        <Check className="h-3 w-3 text-foreground drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-accent-5 font-medium">
                  Font Family
                </Label>
                <select
                  value={theme.fontFamily || "Geist Sans"}
                  onChange={(e) => onUpdateTheme({ fontFamily: e.target.value })}
                  className="h-8 w-full rounded-xs border border-border bg-accent-1 px-2 text-xs text-foreground focus:border-accent-8 focus:outline-none"
                >
                  <option value="Geist Sans">Geist Variable (Sans)</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Segoe UI">System Default</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Preset Swatches & Background Gallery */}
        <div className="rounded-xs border border-border bg-background p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground">
              Background Presets
            </Label>
            <div className="flex items-center rounded-xs bg-accent-1 p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setActivePresetTab("swatches")}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-xs transition-geist ${activePresetTab === "swatches"
                    ? "bg-accent-2 text-foreground"
                    : "text-accent-5 hover:text-foreground"
                  }`}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setActivePresetTab("images")}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-xs transition-geist ${activePresetTab === "images"
                    ? "bg-accent-2 text-foreground"
                    : "text-accent-5 hover:text-foreground"
                  }`}
              >
                Custom URL
              </button>
            </div>
          </div>

          {activePresetTab === "swatches" ? (
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onUpdateTheme({
                      backgroundColor: preset.bg,
                      backgroundImageUrl: preset.url,
                    })
                  }
                  className={`group relative h-16 rounded-xs border p-1 text-left transition-all duration-150 hover:scale-[1.02] ${preset.style} ${theme.backgroundImageUrl === preset.url
                      ? "ring-2 ring-geist-success border-transparent"
                      : ""
                    }`}
                >
                  <span className="absolute bottom-1 left-1.5 text-[9px] font-semibold text-foreground bg-background/80 px-1 rounded-xs backdrop-blur-xs">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[11px] text-accent-5">
                Image / Gradient URL
              </Label>
              <Input
                value={theme.backgroundImageUrl || ""}
                onChange={(e) =>
                  onUpdateTheme({ backgroundImageUrl: e.target.value })
                }
                placeholder="https://example.com/bg.jpg"
                className="h-8 border-border bg-accent-1 text-xs"
              />
              {theme.backgroundImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateTheme({ backgroundImageUrl: "" })}
                  className="h-6 text-[10px] text-geist-error hover:bg-accent-1"
                >
                  Remove Background Image
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
