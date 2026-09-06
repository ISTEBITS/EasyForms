import React, { useState, useEffect, useRef } from "react";
import {
  Images,
  Upload,
  Search,
  Check,
  Trash2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadFile } from "@/api/upload.api";
import {
  getStoredMediaAssets,
  saveMediaAsset,
  deleteMediaAsset,
  CURATED_STOCK_ASSETS,
  type MediaAsset,
} from "@/utils/mediaLibrary";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (url: string) => void;
  targetType?: "logo" | "banner" | "background" | "all";
  currentValue?: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  targetType = "all",
  currentValue,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "logo" | "banner" | "background" | "stock">(
    targetType === "all" ? "all" : targetType
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [storedAssets, setStoredAssets] = useState<MediaAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStoredAssets(getStoredMediaAssets());
      if (targetType !== "all") {
        setActiveTab(targetType);
      } else {
        setActiveTab("all");
      }
    }
  }, [isOpen, targetType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploaded = await uploadFile(file);
      const detectedType: MediaAsset["type"] =
        targetType === "logo"
          ? "logo"
          : targetType === "banner"
            ? "banner"
            : targetType === "background"
              ? "background"
              : "other";

      const saved = saveMediaAsset({
        url: uploaded.url,
        name: file.name,
        type: detectedType,
        sizeBytes: file.size,
      });

      setStoredAssets(getStoredMediaAssets());
      toast.success("Asset uploaded and saved to library");
      onSelectAsset(saved.url);
      onClose();
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    deleteMediaAsset(assetId);
    setStoredAssets(getStoredMediaAssets());
    toast.success("Asset removed from library");
  };

  // Filter assets
  const combinedAssets = [
    ...storedAssets,
    ...(activeTab === "stock" || activeTab === "all" ? CURATED_STOCK_ASSETS : []),
  ];

  const filteredAssets = combinedAssets.filter((asset) => {
    if (activeTab === "stock" && !asset.isCurated) return false;
    if (activeTab !== "all" && activeTab !== "stock" && asset.type !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    return asset.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-4xl h-[70vh] sm:h-[88vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 font-sans bg-background border-border hide-scrollbar rounded-md">
        {/* Modal Header */}
        <DialogHeader className="space-y-1 pb-3 border-b border-border">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground">
                  <Images className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground font-sans truncate">
                    Media & Asset Library
                  </DialogTitle>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-1.5 text-sm font-sans"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{isUploading ? "Uploading..." : "Upload New"}</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 rounded-sm bg-accent-1 border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 text-sm font-medium rounded-xs transition-colors cursor-pointer ${activeTab === "all"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-accent-5 hover:text-foreground"
                    }`}
                >
                  All Assets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("logo")}
                  className={`px-3 py-1 text-sm font-medium rounded-xs transition-colors cursor-pointer ${activeTab === "logo"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-accent-5 hover:text-foreground"
                    }`}
                >
                  Logos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("banner")}
                  className={`px-3 py-1 text-sm font-medium rounded-xs transition-colors cursor-pointer ${activeTab === "banner"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-accent-5 hover:text-foreground"
                    }`}
                >
                  Banners
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("background")}
                  className={`px-3 py-1 text-sm font-medium rounded-xs transition-colors cursor-pointer ${activeTab === "background"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-accent-5 hover:text-foreground"
                    }`}
                >
                  Backgrounds
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("stock")}
                  className={`px-3 py-1 text-sm font-medium rounded-xs transition-colors flex items-center gap-1 cursor-pointer ${activeTab === "stock"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-accent-5 hover:text-foreground"
                    }`}
                >
                  <span>Curated Presets</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-accent-4" />
                <Input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm font-sans bg-background"
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Asset Content Grid Area */}
        <div className="pt-2">


          {/* Asset Grid */}
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-2 sm:p-8 rounded-sm border border-dashed border-border bg-accent-1/30 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-2 text-accent-5">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground font-sans">
                  No assets found
                </h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-sm font-sans"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Upload Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[20vh] sm:max-h-[52vh] overflow-y-auto hide-scrollbar p-0.5">
              {filteredAssets.map((asset) => {
                const isSelected = currentValue === asset.url;
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(asset.url);
                      toast.success(`Selected "${asset.name}"`);
                      onClose();
                    }}
                    className={`group relative rounded-sm border overflow-hidden transition-all duration-150 cursor-pointer bg-background hover:border-foreground/60 hover:shadow-xs flex flex-col ${isSelected
                        ? "border-foreground ring-2 ring-foreground"
                        : "border-border"
                      }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-accent-1 flex items-center justify-center">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-xs">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {asset.isCurated && (
                        <div className="absolute bottom-1.5 left-1.5 rounded-xs bg-background/85 px-1.5 py-0.5 text-sm font-medium text-foreground backdrop-blur-xs border border-border">
                          Preset
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-2.5 flex items-center justify-between gap-1.5 bg-background border-t border-border">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate font-sans">
                          {asset.name}
                        </p>
                        <p className="text-sm text-accent-5 uppercase capitalize truncate font-sans">
                          {asset.type}
                        </p>
                      </div>

                      {!asset.isCurated && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, asset.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-xs text-accent-4 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete from Library"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-sm font-sans"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
