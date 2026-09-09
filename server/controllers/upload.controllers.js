import cloudinary from '../config/cloudinary.config.js';
import fs from 'fs/promises';

export async function handleUploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const localFilePath = req.file.path;
    const type = req.body?.type || "other";
    const tags = ["easyforms_media"];
    if (type && type !== "other") {
      tags.push(type);
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: "form_uploads",
      resource_type: "auto",
      tags,
    });
    await fs.unlink(localFilePath);

    res.json({
      url: result.secure_url || result.url,
      public_id: result.public_id,
      filename: result.original_filename,
      format: result.format,
      sizeBytes: result.bytes,
      type,
      uploadedAt: result.created_at || new Date().toISOString(),
    });
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }

    console.error("Upload Error:", error.message);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
}

export async function handleGetMediaLibrary(req, res) {
  try {
    let resources = [];

    // Attempt 1: Fetch all uploaded images with form_uploads prefix
    try {
      const response = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'form_uploads',
        max_results: 100,
        resource_type: 'image',
      });
      resources = response.resources || [];
    } catch (prefixErr) {
      console.warn("Cloudinary prefix fetch notice:", prefixErr.message);
    }

    // Attempt 2: If prefix returned no items, fetch general upload resources
    if (resources.length === 0) {
      try {
        const fallbackRes = await cloudinary.api.resources({
          type: 'upload',
          max_results: 100,
          resource_type: 'image',
        });
        resources = fallbackRes.resources || [];
      } catch (fallbackErr) {
        console.warn("Cloudinary fallback fetch notice:", fallbackErr.message);
      }
    }

    // Sort by created_at descending (newest first)
    resources.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const assets = resources.map((resource) => {
      const parts = (resource.public_id || "").split('/');
      const rawName = parts[parts.length - 1] || resource.public_id;
      const cleanName = rawName.replace(/^[a-z0-9]{10,}_/i, "").replace(/[-_]/g, " ") || rawName;

      let type = "other";
      if (resource.tags && Array.isArray(resource.tags)) {
        if (resource.tags.includes("logo")) type = "logo";
        else if (resource.tags.includes("banner")) type = "banner";
        else if (resource.tags.includes("background")) type = "background";
      }
      if (type === "other") {
        const lower = (resource.public_id || "").toLowerCase();
        if (lower.includes("logo")) type = "logo";
        else if (lower.includes("banner")) type = "banner";
        else if (lower.includes("background") || lower.includes("bg")) type = "background";
      }

      return {
        id: resource.public_id,
        public_id: resource.public_id,
        url: resource.secure_url || resource.url,
        name: cleanName,
        type,
        sizeBytes: resource.bytes,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        uploadedAt: resource.created_at || new Date().toISOString(),
        isCurated: false,
      };
    });

    res.json({ assets });
  } catch (error) {
    console.error("Get Media Library Error:", error.message);
    res.status(500).json({ message: "Failed to fetch media library", error: error.message });
  }
}

export async function handleDeleteMedia(req, res) {
  try {
    const rawTarget =
      req.body?.publicId ||
      req.body?.url ||
      req.body?.id ||
      req.query?.publicId ||
      req.query?.url ||
      req.params?.publicId;

    if (!rawTarget) {
      return res.status(400).json({ message: "Asset identifier (publicId or url) is required" });
    }

    let publicId = String(rawTarget).trim();
    if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
      const uploadIdx = publicId.indexOf("/upload/");
      if (uploadIdx !== -1) {
        let pathAfterUpload = publicId.substring(uploadIdx + "/upload/".length);
        // Strip optional transformation params or version prefix v12345678/
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");
        // Strip file extension (.jpg, .png, etc.)
        const dotIdx = pathAfterUpload.lastIndexOf(".");
        if (dotIdx !== -1) {
          pathAfterUpload = pathAfterUpload.substring(0, dotIdx);
        }
        publicId = decodeURIComponent(pathAfterUpload);
      }
    }

    let destroyResult = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (destroyResult.result !== "ok" && destroyResult.result !== "not found") {
      destroyResult = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
        invalidate: true,
      });
    }

    res.json({
      success: true,
      result: destroyResult.result,
      publicId,
      message: "Media deleted from Cloudinary successfully",
    });
  } catch (error) {
    console.error("Delete Media Error:", error.message);
    res.status(500).json({ message: "Failed to delete media from Cloudinary", error: error.message });
  }
}
