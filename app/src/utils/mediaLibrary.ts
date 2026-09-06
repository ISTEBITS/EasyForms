export interface MediaAsset {
  id: string;
  url: string;
  name: string;
  type: "logo" | "banner" | "background" | "other";
  sizeBytes?: number;
  uploadedAt: string;
  isCurated?: boolean;
}

const STORAGE_KEY = "easyforms_media_library";

export const CURATED_STOCK_ASSETS: MediaAsset[] = [
  // Curated Banners
  {
    id: "stock-banner-1",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80",
    name: "Vibrant Gradient Mesh",
    type: "banner",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "stock-banner-2",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&auto=format&fit=crop&q=80",
    name: "Dark Tech Mesh",
    type: "banner",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "stock-banner-3",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
    name: "Sunrise Radiant",
    type: "banner",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "stock-banner-4",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
    name: "Minimalist Flow",
    type: "banner",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "stock-banner-5",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80",
    name: "Indigo Waves",
    type: "banner",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "stock-banner-6",
    url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1600&auto=format&fit=crop&q=80",
    name: "Emerald Forest Nature",
    type: "banner",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
  // Curated Backgrounds
  {
    id: "stock-bg-1",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
    name: "Pure Clean Geometry",
    type: "background",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "stock-bg-2",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&auto=format&fit=crop&q=80",
    name: "Midnight Grid",
    type: "background",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    isCurated: true,
  },
];

export function getStoredMediaAssets(): MediaAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMediaAsset(asset: Omit<MediaAsset, "id" | "uploadedAt"> & { id?: string; uploadedAt?: string }): MediaAsset {
  const current = getStoredMediaAssets();
  const existingIndex = current.findIndex((a) => a.url === asset.url);

  const fullAsset: MediaAsset = {
    id: asset.id || `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    url: asset.url,
    name: asset.name || "Uploaded Image",
    type: asset.type || "other",
    sizeBytes: asset.sizeBytes,
    uploadedAt: asset.uploadedAt || new Date().toISOString(),
    isCurated: false,
  };

  let updated: MediaAsset[];
  if (existingIndex >= 0) {
    updated = [fullAsset, ...current.filter((_, idx) => idx !== existingIndex)];
  } else {
    updated = [fullAsset, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
  } catch {
    // Ignore storage quota errors
  }

  return fullAsset;
}

export function deleteMediaAsset(assetId: string): void {
  const current = getStoredMediaAssets();
  const updated = current.filter((a) => a.id !== assetId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}
