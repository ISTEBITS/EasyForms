import { useState, useRef } from "react";
import {
  Palette,
  ChevronDown,
  Sparkles,
  Check,
  Building2,
  Images,
  Upload,
  Trash2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { FormTheme } from "@/types/form";
import { MediaLibraryModal } from "./MediaLibraryModal";

interface DesignPanelProps {
  theme: FormTheme;
  onUpdateTheme: (updates: Partial<FormTheme>) => void;
  onUploadThemeAsset: (
    target: "logoUrl" | "bannerUrl" | "backgroundImageUrl",
    file: File,
  ) => Promise<void>;
  onRemoveThemeAsset?: (target: "logoUrl" | "bannerUrl" | "backgroundImageUrl") => void;
  onSelectThemeAsset?: (target: "logoUrl" | "bannerUrl" | "backgroundImageUrl", url: string) => void;
  isUploading: boolean;
  uploadingTarget?: "logoUrl" | "bannerUrl" | "backgroundImageUrl" | null;
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
  onUploadThemeAsset,
  onRemoveThemeAsset,
  onSelectThemeAsset,
  isUploading,
  uploadingTarget = null,
  isTestUser: _isTestUser,
}: DesignPanelProps) {
  const [activePresetTab, setActivePresetTab] = useState<"swatches" | "images">("swatches");
  const [isGlobalOpen, setIsGlobalOpen] = useState(true);
  const [isBrandingOpen, setIsBrandingOpen] = useState(true);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Media Library state
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaLibraryTarget, setMediaLibraryTarget] = useState<"logo" | "banner" | "background">("logo");

  const handleOpenLibrary = (target: "logo" | "banner" | "background") => {
    setMediaLibraryTarget(target);
    setIsMediaLibraryOpen(true);
  };

  const handleSelectFromLibrary = (url: string) => {
    const targetKey =
      mediaLibraryTarget === "logo"
        ? "logoUrl"
        : mediaLibraryTarget === "banner"
        ? "bannerUrl"
        : "backgroundImageUrl";

    if (onSelectThemeAsset) {
      onSelectThemeAsset(targetKey, url);
    } else {
      onUpdateTheme({ [targetKey]: url });
    }
  };

  const handleRemove = (targetKey: "logoUrl" | "bannerUrl" | "backgroundImageUrl") => {
    if (onRemoveThemeAsset) {
      onRemoveThemeAsset(targetKey);
    } else {
      onUpdateTheme({ [targetKey]: "" });
    }
  };

  const bannerPositionX = typeof theme.bannerPositionX === "number" ? theme.bannerPositionX : 50;
  const bannerPositionY = typeof theme.bannerPositionY === "number" ? theme.bannerPositionY : 50;

  return (
    <div className="flex h-full w-full flex-col space-y-4 overflow-y-auto pr-1 text-sm font-sans hide-scrollbar">
      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void onUploadThemeAsset("logoUrl", file);
            e.target.value = "";
          }
        }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void onUploadThemeAsset("bannerUrl", file);
            e.target.value = "";
          }
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-geist-success" />
          <h3 className="font-semibold text-sm text-foreground font-sans">Theme & Design</h3>
        </div>
      </div>

      <div className="space-y-3 px-2">
        {/* 1. Global Theme Section Accordion */}
        <div className="rounded-sm border border-border bg-background">
          <button
            type="button"
            onClick={() => setIsGlobalOpen(!isGlobalOpen)}
            className="flex w-full items-center justify-between p-3 text-left font-semibold text-foreground hover:bg-accent-1/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-accent-6" />
              <span className="text-sm">Colors & Typography</span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-accent-5 transition-transform duration-200 ${
                isGlobalOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isGlobalOpen && (
            <div className="space-y-4 border-t border-border p-3">
              {/* Primary Accent Color Picker */}
              <div className="space-y-2">
                <Label className="text-sm text-accent-5 font-medium">
                  Primary Accent Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor || "#0070f3"}
                    onChange={(e) =>
                      onUpdateTheme({ primaryColor: e.target.value })
                    }
                    className="h-8 w-10 rounded-sm border border-border bg-transparent cursor-pointer"
                  />
                  <Input
                    value={theme.primaryColor || "#0070f3"}
                    onChange={(e) =>
                      onUpdateTheme({ primaryColor: e.target.value })
                    }
                    className="h-8 border-border bg-accent-1 text-sm font-sans"
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
                      className="h-6 w-6 rounded-sm border border-border transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: swatch.value }}
                    >
                      {theme.primaryColor === swatch.value && (
                        <Check className="h-3.5 w-3.5 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color Picker */}
              <div className="space-y-2">
                <Label className="text-sm text-accent-5 font-medium">
                  Background Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      onUpdateTheme({ backgroundColor: e.target.value })
                    }
                    className="h-8 w-10 rounded-sm border border-border bg-transparent cursor-pointer"
                  />
                  <Input
                    value={theme.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      onUpdateTheme({ backgroundColor: e.target.value })
                    }
                    className="h-8 border-border bg-accent-1 text-sm font-sans"
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
                      className="h-6 w-6 rounded-sm border border-border transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: swatch.value }}
                    >
                      {theme.backgroundColor === swatch.value && (
                        <Check className="h-3.5 w-3.5 text-foreground drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <Label className="text-sm text-accent-5 font-medium">
                  Font Family
                </Label>
                <select
                  value={theme.fontFamily || "Geist Sans"}
                  onChange={(e) => onUpdateTheme({ fontFamily: e.target.value })}
                  className="h-8 w-full rounded-sm border border-border bg-accent-1 px-2 text-sm text-foreground focus:border-accent-8 focus:outline-none"
                >
                  <option value="Geist Sans">Geist Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Segoe UI">System Default</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 2. Branding (Identity, Logo & Header Banner) Accordion */}
        <div className="rounded-sm border border-border bg-background">
          <button
            type="button"
            onClick={() => setIsBrandingOpen(!isBrandingOpen)}
            className="flex w-full items-center justify-between p-3 text-left font-semibold text-foreground hover:bg-accent-1/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-accent-6" />
              <span className="text-sm">Branding & Banner</span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-accent-5 transition-transform duration-200 ${
                isBrandingOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isBrandingOpen && (
            <div className="space-y-4 border-t border-border p-3">
              {/* Brand Identity Fields */}
              <div className="space-y-2">
                <Label className="text-sm text-accent-5 font-medium">
                  Brand Identity
                </Label>
                <Input
                  value={theme.brandName || ""}
                  onChange={(e) => onUpdateTheme({ brandName: e.target.value })}
                  placeholder="Brand name (optional)"
                  className="h-8 border-border bg-accent-1 text-sm font-sans"
                />
                <Input
                  value={theme.brandTagline || ""}
                  onChange={(e) => onUpdateTheme({ brandTagline: e.target.value })}
                  placeholder="Brand tagline (optional)"
                  className="h-8 border-border bg-accent-1 text-sm font-sans"
                />
              </div>

              {/* Logo Section */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-accent-5 font-medium">
                    Form Logo
                  </Label>
                  {theme.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemove("logoUrl")}
                      className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {theme.logoUrl ? (
                  <div className="flex items-center gap-2 p-2 rounded-sm border border-border bg-accent-1/50">
                    <div className="h-10 w-10 rounded-sm border border-border bg-background overflow-hidden flex items-center justify-center p-1 shrink-0">
                      <img
                        src={theme.logoUrl}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">Custom Logo</p>
                      <p className="text-sm text-accent-5 truncate font-sans">{theme.logoUrl}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenLibrary("logo")}
                        className="text-sm font-sans px-2 h-7"
                      >
                        <Images className="h-3.5 w-3.5 mr-1" />
                        Library
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-sm font-sans px-2 h-7"
                      >
                        {uploadingTarget === "logoUrl" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLibrary("logo")}
                      className="flex-1 text-sm font-sans gap-1.5 h-8"
                    >
                      <Images className="h-3.5 w-3.5 text-accent-5" />
                      <span>Library</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1 text-sm font-sans gap-1.5 h-8"
                    >
                      {uploadingTarget === "logoUrl" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-accent-5" />
                      )}
                      <span>Upload</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Banner Section */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-accent-5 font-medium">
                    Header Banner
                  </Label>
                  {theme.bannerUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemove("bannerUrl")}
                      className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {theme.bannerUrl ? (
                  <div className="space-y-2.5">
                    <div className="relative h-20 w-full rounded-sm border border-border overflow-hidden bg-accent-1">
                      <img
                        src={theme.bannerUrl}
                        alt="Header Banner"
                        className="h-full w-full object-cover"
                        style={{
                          objectPosition: `${bannerPositionX}% ${bannerPositionY}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenLibrary("banner")}
                        className="flex-1 text-sm font-sans gap-1.5 h-8"
                      >
                        <Images className="h-3.5 w-3.5 text-accent-5" />
                        <span>Library</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 text-sm font-sans gap-1.5 h-8"
                      >
                        {uploadingTarget === "bannerUrl" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-accent-5" />
                        )}
                        <span>Replace</span>
                      </Button>
                    </div>

                    {/* Banner Alignment Controls */}
                    <div className="space-y-2 pt-2 border-t border-border bg-accent-1/40 p-2.5 rounded-sm">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-foreground">
                          Horizontal Alignment
                        </Label>
                        <span className="text-sm text-accent-5 font-sans">
                          {bannerPositionX}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={bannerPositionX}
                        onChange={(e) =>
                          onUpdateTheme({
                            bannerPositionX: Number(e.target.value),
                          })
                        }
                        className="w-full accent-foreground cursor-pointer"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <Label className="text-sm font-medium text-foreground">
                          Vertical Alignment
                        </Label>
                        <span className="text-sm text-accent-5 font-sans">
                          {bannerPositionY}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={bannerPositionY}
                        onChange={(e) =>
                          onUpdateTheme({
                            bannerPositionY: Number(e.target.value),
                          })
                        }
                        className="w-full accent-foreground cursor-pointer"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onUpdateTheme({
                            bannerPositionX: 50,
                            bannerPositionY: 50,
                          })
                        }
                        className="w-full text-sm font-sans gap-1.5 h-7 mt-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-accent-5" />
                        <span>Reset Alignment</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLibrary("banner")}
                      className="flex-1 text-sm font-sans gap-1.5 h-8"
                    >
                      <Images className="h-3.5 w-3.5 text-accent-5" />
                      <span>Library</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1 text-sm font-sans gap-1.5 h-8"
                    >
                      {uploadingTarget === "bannerUrl" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-accent-5" />
                      )}
                      <span>Upload</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Preset Swatches & Background Gallery */}
        <div className="rounded-sm border border-border bg-background p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">
              Background Wallpapers
            </Label>
            <div className="flex items-center rounded-sm bg-accent-1 p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setActivePresetTab("swatches")}
                className={`px-2 py-0.5 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                  activePresetTab === "swatches"
                    ? "bg-accent-2 text-foreground font-semibold"
                    : "text-accent-5 hover:text-foreground"
                }`}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setActivePresetTab("images")}
                className={`px-2 py-0.5 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                  activePresetTab === "images"
                    ? "bg-accent-2 text-foreground font-semibold"
                    : "text-accent-5 hover:text-foreground"
                }`}
              >
                Custom URL
              </button>
            </div>
          </div>

          {activePresetTab === "swatches" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
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
                    className={`group relative h-16 rounded-sm border p-1 text-left transition-all hover:scale-[1.02] cursor-pointer ${
                      preset.style
                    } ${
                      theme.backgroundImageUrl === preset.url
                        ? "ring-2 ring-geist-success border-transparent"
                        : ""
                    }`}
                  >
                    <span className="absolute bottom-1 left-1.5 text-sm font-semibold text-foreground bg-background/90 px-1.5 py-0.5 rounded-sm shadow-sm backdrop-blur-xs">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenLibrary("background")}
                className="w-full text-sm font-sans gap-1.5 h-8"
              >
                <Images className="h-3.5 w-3.5 text-accent-5" />
                <span>Browse Background Library</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm text-accent-5">
                Image / Gradient URL
              </Label>
              <Input
                value={theme.backgroundImageUrl || ""}
                onChange={(e) =>
                  onUpdateTheme({ backgroundImageUrl: e.target.value })
                }
                placeholder="https://example.com/bg.jpg"
                className="h-8 border-border bg-accent-1 text-sm font-sans"
              />
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenLibrary("background")}
                  className="text-sm font-sans gap-1 h-7"
                >
                  <Images className="h-3.5 w-3.5" />
                  <span>From Library</span>
                </Button>
                {theme.backgroundImageUrl && (
                  <button
                    type="button"
                    onClick={() => handleRemove("backgroundImageUrl")}
                    className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canva-style Media Asset Library Modal */}
      <MediaLibraryModal
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelectAsset={handleSelectFromLibrary}
        targetType={mediaLibraryTarget}
        currentValue={
          mediaLibraryTarget === "logo"
            ? theme.logoUrl
            : mediaLibraryTarget === "banner"
            ? theme.bannerUrl
            : theme.backgroundImageUrl
        }
      />
    </div>
  );
}
