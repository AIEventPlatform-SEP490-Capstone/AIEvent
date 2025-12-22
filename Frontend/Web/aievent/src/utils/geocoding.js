import { toast } from "react-hot-toast";

// OpenCageData API key - in a real application, this should be stored securely
const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || 'YOUR_OPENCAGE_API_KEY_HERE';

/**
 * Xây dựng query string tối ưu cho OpenCage API
 * @param {string} locationName - Tên địa điểm
 * @param {string} district - Quận/Huyện
 * @param {string} address - Địa chỉ chi tiết
 * @returns {string}
 */
const buildGeocodingQuery = (locationName, district, address) => {
  const parts = [];
  
  if (address && address.trim()) {
    parts.push(address.trim());
  }
  
  if (locationName && locationName.trim()) {
    parts.push(locationName.trim());
  }
  
  if (district && district.trim()) {
    let cleanDistrict = district.trim();
    cleanDistrict = cleanDistrict.replace(/,?\s*(TP\.?HCM|TPHCM|Hồ Chí Minh|Ho Chi Minh|HCM)$/i, '').trim();
    parts.push(cleanDistrict);
  }
  
  parts.push('Hồ Chí Minh');
  parts.push('Vietnam');
  
  return parts.join(', ');
};

/**
 * Geocode an address using OpenCageData API
 * @param {string} locationName - Name of the location
 * @param {string} district - District of the location
 * @param {string} address - Detailed address
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string} | null>}
 */
export const geocodeAddress = async (locationName, district, address) => {
  try {
    const fullAddress = buildGeocodingQuery(locationName, district, address);
    
    if (!fullAddress || fullAddress === 'Hồ Chí Minh, Vietnam') {
      throw new Error("Invalid address information");
    }

    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${OPENCAGE_API_KEY}&language=vi&limit=1&countrycode=vn&bounds=106.35,10.35,107.05,11.15`;
    
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
 * Parse địa chỉ từ kết quả reverse geocoding - LẤY NGUYÊN KẾT QUẢ TỪ API
 * Không xử lý phức tạp, không set default
 * @param {Object} addressComponents - Object chứa các thành phần địa chỉ từ API
 * @returns {Object} - Object chứa city, district, ward
 */
export const parseVietnameseAddress = (addressComponents) => {
  if (!addressComponents) {
    return {
      city: '',
      district: '',
      ward: '',
      address: '',
      confidence: 'low',
      reason: 'Không có dữ liệu địa chỉ'
    };
  }

  const {
    city,
    city_district,
    county,
    suburb,
    ward,
    neighbourhood,
    road,
    house_number,
    state_district,
    state
  } = addressComponents;

  // Lấy district từ các field theo thứ tự ưu tiên - KHÔNG xử lý, KHÔNG set default
  let resultDistrict = city_district || county || state_district || '';
  let resultWard = ward || suburb || neighbourhood || '';
  let resultCity = city || state || '';

  // Xây dựng địa chỉ chi tiết
  const addressParts = [];
  if (house_number) addressParts.push(house_number);
  if (road) addressParts.push(road);
  
  return {
    city: resultCity,
    district: resultDistrict,
    ward: resultWard,
    address: addressParts.join(' '),
    confidence: resultDistrict ? 'high' : 'low',
    reason: resultDistrict ? `Từ API: ${resultDistrict}` : 'API không trả về thông tin quận/huyện'
  };
};

/**
 * Reverse geocode coordinates using OpenCage
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object | null>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}%2C${longitude}&key=${OPENCAGE_API_KEY}&language=vi&limit=1&countrycode=vn`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.components;
      
      const parsedAddress = parseVietnameseAddress(components);
      
      return {
        ...parsedAddress,
        formattedAddress: result.formatted,
        latitude,
        longitude,
        raw: components
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

/**
 * Reverse geocode sử dụng Nominatim (OSM) - LẤY NGUYÊN KẾT QUẢ
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object | null>}
 */
export const reverseGeocodeNominatim = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=vi`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AIEvent/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      
      // Lấy nguyên kết quả từ API - KHÔNG xử lý phức tạp, KHÔNG set default
      const district = addr.city_district || addr.district || addr.county || '';
      const ward = addr.suburb || addr.neighbourhood || addr.quarter || '';
      const city = addr.city || addr.state || '';
      
      const addressParts = [];
      if (addr.house_number) addressParts.push(addr.house_number);
      if (addr.road) addressParts.push(addr.road);
      
      return {
        city: city,
        district: district,
        ward: ward,
        address: addressParts.join(' '),
        formattedAddress: data.display_name,
        latitude,
        longitude,
        confidence: district ? 'high' : 'low',
        reason: district ? `Từ Nominatim: ${district}` : 'Nominatim không trả về thông tin quận/huyện',
        raw: addr
      };
    }
    
    return null;
  } catch (error) {
    console.error("Nominatim reverse geocoding error:", error);
    return null;
  }
};

/**
 * Smart reverse geocode - thử Nominatim trước, fallback sang OpenCage
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object | null>}
 */
export const smartReverseGeocode = async (latitude, longitude) => {
  // Thử Nominatim trước (miễn phí)
  let result = await reverseGeocodeNominatim(latitude, longitude);
  
  // Nếu không có kết quả hoặc không có district, thử OpenCage
  if (!result || !result.district) {
    const opencageResult = await reverseGeocode(latitude, longitude);
    
    if (opencageResult) {
      // Nếu OpenCage có district, dùng kết quả đó
      if (!result || opencageResult.district) {
        result = opencageResult;
      }
    }
  }
  
  return result;
};

/**
 * Tìm kiếm địa chỉ sử dụng Nominatim (OSM)
 * @param {string} query - Chuỗi tìm kiếm
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string} | null>}
 */
export const searchAddressNominatim = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return null;
    }

    const searchQuery = encodeURIComponent(`${query}, Ho Chi Minh City, Vietnam`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1&addressdetails=1&accept-language=vi&viewbox=106.35,11.15,107.05,10.35&bounded=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AIEvent/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name
      };
    }
    
    // Thử lại không bounded
    const urlUnbounded = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1&addressdetails=1&accept-language=vi`;
    
    const responseUnbounded = await fetch(urlUnbounded, {
      headers: {
        'User-Agent': 'AIEvent/1.0'
      }
    });
    
    if (!responseUnbounded.ok) {
      throw new Error(`Nominatim search API error: ${responseUnbounded.status}`);
    }
    
    const dataUnbounded = await responseUnbounded.json();
    
    if (dataUnbounded && dataUnbounded.length > 0) {
      const result = dataUnbounded[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error("Nominatim search error:", error);
    return null;
  }
};

/**
 * Smart search - thử Nominatim trước, fallback sang OpenCage
 * @param {string} query - Chuỗi tìm kiếm
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string} | null>}
 */
export const smartSearchAddress = async (query) => {
  let result = await searchAddressNominatim(query);
  
  if (!result) {
    result = await geocodeAddress('', '', query);
  }
  
  return result;
};

export default { 
  geocodeAddress, 
  reverseGeocode, 
  reverseGeocodeNominatim,
  smartReverseGeocode,
  parseVietnameseAddress,
  searchAddressNominatim,
  smartSearchAddress
};
