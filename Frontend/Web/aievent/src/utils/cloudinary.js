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
 * Upload a base64 data URL image to Cloudinary
 * @param {string} base64DataUrl - The base64 data URL (e.g., "data:image/png;base64,...")
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadBase64ToCloudinary = async (base64DataUrl) => {
  const formData = new FormData();
  formData.append('file', base64DataUrl);
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
    console.error('Error uploading base64 image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * Supports both File objects and base64 data URLs
 * @param {FileList|File[]|string[]} files - The image files or base64 data URLs to upload
 * @returns {Promise<string[]>} - Array of secure URLs for the uploaded images
 */
export const uploadImagesToCloudinary = async (files) => {
  try {
    const uploadPromises = Array.from(files).map(file => {
      // Check if it's a base64 data URL string
      if (typeof file === 'string' && file.startsWith('data:')) {
        return uploadBase64ToCloudinary(file);
      }
      // Otherwise treat as File object
      return uploadImageToCloudinary(file);
    });
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading images to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple base64 images to Cloudinary
 * @param {string[]} base64Images - Array of base64 data URLs
 * @returns {Promise<string[]>} - Array of secure URLs for the uploaded images
 */
export const uploadBase64ImagesToCloudinary = async (base64Images) => {
  try {
    const uploadPromises = base64Images.map(base64 => uploadBase64ToCloudinary(base64));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading base64 images to Cloudinary:', error);
    throw error;
  }
};

export default {
  uploadImageToCloudinary,
  uploadImagesToCloudinary,
  uploadBase64ToCloudinary,
  uploadBase64ImagesToCloudinary
};