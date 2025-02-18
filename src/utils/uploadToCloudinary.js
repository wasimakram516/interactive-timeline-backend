const env = require("../config/env");
const { cloudinary } = require("../config/cloudinary");

/**
 * ✅ Upload files manually to Cloudinary with dynamic folder structure
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimetype - The MIME type of the file
 * @param {string} type - Either "media" or "infographic"
 */
const uploadToCloudinary = async (fileBuffer, mimetype, type) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith("video") ? "video" : "image";
    const baseFolder = type === "infographics" ? "infographics" : "media";
    const folderName = mimetype.startsWith("video") ? "videos" : "images";

    console.log(`Uploading file to Cloudinary: ${type}/${folderName}`); // Debugging line

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: `${env.cloudinary.folder}/${baseFolder}/${folderName}` },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadToCloudinary };
