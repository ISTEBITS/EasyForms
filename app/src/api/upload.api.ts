import { API_BASE_URL } from "./client";

export interface MediaAsset {
  id: string;
  public_id?: string;
  url: string;
  name: string;
  type: "logo" | "banner" | "background" | "other";
  sizeBytes?: number;
  format?: string;
  width?: number;
  height?: number;
  uploadedAt: string;
}

export const uploadFile = async (file: File, type?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (type) {
    formData.append("type", type);
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "File upload failed");
  }

  return response.json();
};

export const fetchMediaLibrary = async (): Promise<{ assets: MediaAsset[] }> => {
  const response = await fetch(`${API_BASE_URL}/upload/media`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch media library");
  }

  return response.json();
};

export const fetchMediaAssets = async (): Promise<MediaAsset[]> => {
  try {
    const data = await fetchMediaLibrary();
    return Array.isArray(data?.assets) ? data.assets : [];
  } catch (error) {
    console.error("Failed to fetch media assets from Cloudinary:", error);
    return [];
  }
};

export const deleteCloudinaryMedia = async (publicIdOrUrl: string) => {
  const response = await fetch(`${API_BASE_URL}/upload/media`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publicId: publicIdOrUrl, url: publicIdOrUrl }),
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete media from Cloudinary");
  }

  return response.json();
};

export const deleteMediaAsset = async (publicIdOrUrl: string): Promise<boolean> => {
  await deleteCloudinaryMedia(publicIdOrUrl);
  return true;
};

export async function checkSubmissionStatus(formId: string, email: string) {
  const response = await fetch(
    `${API_BASE_URL}/forms/${formId}/check-status?email=${encodeURIComponent(email)}`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error("Failed to check submission status");
  }

  const data = await response.json();
  return data.submitted;
}
