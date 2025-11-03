// Cloudinary upload utility functions
// Replace YOUR_CLOUD_NAME and YOUR_UPLOAD_PRESET with your actual Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = 'dkepgafaf'; // e.g., 'demo'
const CLOUDINARY_UPLOAD_PRESET = 'Event_Upload'; // e.g., 'ml_default'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload a single image file to Cloudinary
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {FileList|File[]} files - The image files to upload
 * @returns {Promise<string[]>} - Array of secure URLs for the uploaded images
 */
export const uploadImagesToCloudinary = async (files) => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadImageToCloudinary(file));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading images to Cloudinary:', error);
    throw error;
  }
};

export default {
  uploadImageToCloudinary,
  uploadImagesToCloudinary
};