import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string = "satya/profiles"
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image: ${publicId}`);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Failed to delete image");
  }
};

/**
 * Generate signed upload parameters for direct client-side upload
 */
export const generateUploadSignature = (folder: string = "satya/profiles"): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
} => {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    transformation: "w_500,h_500,c_fill,g_face/q_auto/f_auto",
  };

  const signature = cloudinary.utils.api_sign_request(params, CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    folder,
  };
};

/**
 * Extract public ID from Cloudinary URL
 */
export const extractPublicId = (url: string): string | null => {
  try {
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export default cloudinary;
