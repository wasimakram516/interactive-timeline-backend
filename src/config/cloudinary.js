const cloudinary = require("cloudinary").v2;
const env = require("../config/env");

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

/**
 * ✅ Delete Image from Cloudinary
 * @param {string} imageUrl - Full Cloudinary image URL to delete
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1].split(".")[0]; // Extract filename
    const fullFolderPath = urlParts.slice(-3, -1).join("/"); // Extract full folder path (last 3 parts)

    const publicId = `${fullFolderPath}/${fileName}`; // Correct Public ID

    console.log(`🛑 Deleting image with Public ID: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    console.log(`✅ Cloudinary Response:`, result);

  } catch (error) {
    console.error("❌ Cloudinary Deletion Failed:", error);
  }
};

module.exports = { cloudinary, deleteImage };
