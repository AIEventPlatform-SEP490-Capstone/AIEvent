import { toast } from "react-hot-toast";

// OpenCageData API key - in a real application, this should be stored securely
// For now, we'll use a placeholder that should be replaced with an actual key
const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || 'YOUR_OPENCAGE_API_KEY_HERE';

/**
 * Geocode an address using OpenCageData API
 * @param {string} locationName - Name of the location
 * @param {string} district - District of the location
 * @param {string} address - Detailed address
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string} | null>}
 */
export const geocodeAddress = async (locationName, district, address) => {
  try {
    // Construct the full address string
    const fullAddress = [address, district, locationName, "Vietnam"]
      .filter(part => part && part.trim() !== "")
      .join(", ");
    
    if (!fullAddress) {
      throw new Error("Invalid address information");
    }

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Construct the OpenCageData API URL
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${OPENCAGE_API_KEY}&language=vi&limit=1`;
    
    // Make the API request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
        formattedAddress: result.formatted
      };
    } else {
      throw new Error("No geocoding results found for the provided address");
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    toast.error("Không thể xác định tọa độ địa chỉ. Vui lòng kiểm tra lại thông tin địa chỉ.");
    return null;
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string | null>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Construct the OpenCageData API URL for reverse geocoding
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}%2C${longitude}&key=${OPENCAGE_API_KEY}&language=vi&limit=1`;
    
    // Make the API request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export default { geocodeAddress, reverseGeocode };