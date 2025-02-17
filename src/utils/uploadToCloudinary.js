
const env = require("../config/env");
const { cloudinary } = require("../config/cloudinary");

// ✅ Helper function to upload files manually to Cloudinary
const uploadToCloudinary = async (fileBuffer, mimetype) => {
    return new Promise((resolve, reject) => {
      const resourceType = mimetype.startsWith("video") ? "video" : "image";
      const folderName = mimetype.startsWith("video") ? "videos" : "images";
  
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: `${env.cloudinary.folder}/${folderName}` },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
  
      uploadStream.end(fileBuffer);
    });
  };
  
  module.exports = { uploadToCloudinary };