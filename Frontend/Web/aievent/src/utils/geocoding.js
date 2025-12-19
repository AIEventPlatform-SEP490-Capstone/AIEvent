import { toast } from "react-hot-toast";

// OpenCageData API key - in a real application, this should be stored securely
const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || 'YOUR_OPENCAGE_API_KEY_HERE';

// Danh sách các quận cũ đã sáp nhập vào TP Thủ Đức
const THU_DUC_OLD_DISTRICTS = ['Quận 2', 'Quận 9', 'Quận Thủ Đức', 'Q2', 'Q9', 'Q.2', 'Q.9'];

// Danh sách các phường thuộc Quận 1 (để tránh nhầm với Thủ Đức)
const QUAN_1_WARDS = [
  'Bến Nghé', 'Bến Thành', 'Cầu Kho', 'Cầu Ông Lãnh', 'Cô Giang',
  'Đa Kao', 'Nguyễn Cư Trinh', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão',
  'Tân Định', 'Sài Gòn' // Thêm "Sài Gòn" vì một số API trả về như vậy
];

// Danh sách các phường thuộc Quận 3
const QUAN_3_WARDS = [
  'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5',
  'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10',
  'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Võ Thị Sáu'
];

// Bounding box cho TP Thủ Đức (approximate)
// Thủ Đức nằm ở phía Đông Bắc TP.HCM
const THU_DUC_BOUNDS = {
  minLat: 10.8,
  maxLat: 10.95,
  minLng: 106.7,
  maxLng: 106.9
};

// Bounding box cho khu vực trung tâm (Quận 1, 3, 5, 10)
const CENTRAL_BOUNDS = {
  minLat: 10.75,
  maxLat: 10.8,
  minLng: 106.65,
  maxLng: 106.72
};

// Danh sách các phường thuộc TP Thủ Đức
const THU_DUC_WARDS = [
  // Quận 2 cũ
  'An Khánh', 'An Lợi Đông', 'An Phú', 'Bình An', 'Bình Khánh', 'Bình Trưng Đông', 
  'Bình Trưng Tây', 'Cát Lái', 'Thạnh Mỹ Lợi', 'Thảo Điền', 'Thủ Thiêm',
  // Quận 9 cũ
  'Hiệp Phú', 'Long Bình', 'Long Phước', 'Long Thạnh Mỹ', 'Long Trường', 
  'Phú Hữu', 'Phước Bình', 'Phước Long A', 'Phước Long B', 'Tân Phú', 
  'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B', 'Trường Thạnh',
  // Quận Thủ Đức cũ
  'Bình Chiểu', 'Bình Thọ', 'Hiệp Bình Chánh', 'Hiệp Bình Phước', 
  'Linh Chiểu', 'Linh Đông', 'Linh Tây', 'Linh Trung', 'Linh Xuân', 
  'Tam Bình', 'Tam Phú', 'Trường Thọ'
];

/**
 * Chuẩn hóa tên quận/huyện theo format chuẩn (match với PredefinedCities)
 * @param {string} district - Tên quận/huyện thô
 * @returns {string} - Tên quận/huyện đã chuẩn hóa
 */
const normalizeDistrict = (district) => {
  if (!district) return '';
  
  // Loại bỏ khoảng trắng thừa và chuẩn hóa
  let normalized = district.trim();
  
  // Kiểm tra nếu là TP Thủ Đức - trả về format match với PredefinedCities
  if (normalized.toLowerCase().includes('thủ đức') || 
      normalized.toLowerCase().includes('thu duc')) {
    return 'Thành phố Thủ Đức';
  }
  
  // Kiểm tra các quận cũ đã sáp nhập vào TP Thủ Đức
  for (const oldDistrict of THU_DUC_OLD_DISTRICTS) {
    if (normalized.toLowerCase().includes(oldDistrict.toLowerCase())) {
      return 'Thành phố Thủ Đức';
    }
  }
  
  return normalized;
};

/**
 * Kiểm tra xem phường có thuộc TP Thủ Đức không
 * @param {string} ward - Tên phường
 * @returns {boolean}
 */
const isWardInThuDuc = (ward) => {
  if (!ward) return false;
  const normalizedWard = ward.toLowerCase().replace(/phường\s*/i, '').trim();
  return THU_DUC_WARDS.some(w => w.toLowerCase() === normalizedWard);
};

/**
 * Kiểm tra xem phường có thuộc Quận 1 không
 * @param {string} ward - Tên phường
 * @returns {boolean}
 */
const isWardInQuan1 = (ward) => {
  if (!ward) return false;
  const normalizedWard = ward.toLowerCase().replace(/phường\s*/i, '').trim();
  return QUAN_1_WARDS.some(w => w.toLowerCase() === normalizedWard);
};

/**
 * Kiểm tra tọa độ có nằm trong khu vực Thủ Đức không
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
const isCoordinateInThuDuc = (lat, lng) => {
  return lat >= THU_DUC_BOUNDS.minLat && 
         lat <= THU_DUC_BOUNDS.maxLat && 
         lng >= THU_DUC_BOUNDS.minLng && 
         lng <= THU_DUC_BOUNDS.maxLng;
};

/**
 * Kiểm tra tọa độ có nằm trong khu vực trung tâm (Q1, Q3...) không
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
const isCoordinateInCentral = (lat, lng) => {
  return lat >= CENTRAL_BOUNDS.minLat && 
         lat <= CENTRAL_BOUNDS.maxLat && 
         lng >= CENTRAL_BOUNDS.minLng && 
         lng <= CENTRAL_BOUNDS.maxLng;
};

/**
 * Xây dựng query string tối ưu cho OpenCage API
 * Format: "địa chỉ chi tiết, tên địa điểm, quận/huyện, Hồ Chí Minh, Vietnam"
 * @param {string} locationName - Tên địa điểm
 * @param {string} district - Quận/Huyện
 * @param {string} address - Địa chỉ chi tiết
 * @returns {string}
 */
const buildGeocodingQuery = (locationName, district, address) => {
  const parts = [];
  
  // Thêm địa chỉ chi tiết trước (số nhà, đường)
  if (address && address.trim()) {
    parts.push(address.trim());
  }
  
  // Thêm tên địa điểm
  if (locationName && locationName.trim()) {
    parts.push(locationName.trim());
  }
  
  // Xử lý quận/huyện - loại bỏ phần ", TP.HCM" nếu có
  if (district && district.trim()) {
    let cleanDistrict = district.trim();
    // Loại bỏ các suffix như ", TP.HCM", ", TPHCM", ", Hồ Chí Minh"
    cleanDistrict = cleanDistrict.replace(/,?\s*(TP\.?HCM|TPHCM|Hồ Chí Minh|Ho Chi Minh|HCM)$/i, '').trim();
    parts.push(cleanDistrict);
  }
  
  // Luôn thêm Hồ Chí Minh và Vietnam để tăng độ chính xác
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
    // Xây dựng query string tối ưu
    const fullAddress = buildGeocodingQuery(locationName, district, address);
    
    if (!fullAddress || fullAddress === 'Hồ Chí Minh, Vietnam') {
      throw new Error("Invalid address information");
    }

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Construct the OpenCageData API URL với bounds cho TP.HCM
    // Bounds: SW (10.35, 106.35) to NE (11.15, 107.05)
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${OPENCAGE_API_KEY}&language=vi&limit=1&countrycode=vn&bounds=106.35,10.35,107.05,11.15`;
    
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
 * Parse địa chỉ từ kết quả reverse geocoding theo logic hành chính VN
 * @param {Object} addressComponents - Object chứa các thành phần địa chỉ từ API
 * @param {number} latitude - Latitude để kiểm tra tọa độ (optional)
 * @param {number} longitude - Longitude để kiểm tra tọa độ (optional)
 * @returns {Object} - Object chứa city, district, ward, confidence, reason
 */
export const parseVietnameseAddress = (addressComponents, latitude = null, longitude = null) => {
  if (!addressComponents) {
    return {
      city: 'Thành phố Hồ Chí Minh',
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
    state_district
  } = addressComponents;

  let resultDistrict = '';
  let resultWard = ward || suburb || neighbourhood || '';
  let confidence = 'medium';
  let reason = '';

  // RULE 0: Kiểm tra phường thuộc Quận 1 trước (ưu tiên cao nhất)
  if (resultWard && isWardInQuan1(resultWard)) {
    resultDistrict = 'Quận 1';
    confidence = 'high';
    reason = `Phường "${resultWard}" thuộc Quận 1`;
  }
  // RULE 0.5: Kiểm tra tọa độ - nếu nằm trong khu vực trung tâm, KHÔNG phải Thủ Đức
  else if (latitude && longitude && isCoordinateInCentral(latitude, longitude)) {
    if (city_district && !city_district.toLowerCase().includes('thủ đức')) {
      resultDistrict = normalizeDistrict(city_district);
      confidence = 'high';
      reason = `Tọa độ trung tâm + city_district: ${city_district}`;
    } else if (county && !county.toLowerCase().includes('thủ đức')) {
      resultDistrict = normalizeDistrict(county);
      confidence = 'high';
      reason = `Tọa độ trung tâm + county: ${county}`;
    } else {
      resultDistrict = 'Quận 1';
      confidence = 'medium';
      reason = `Tọa độ nằm trong khu vực trung tâm TP.HCM`;
    }
  }
  // RULE 1: Kiểm tra city_district trước (đây là field chính xác nhất cho quận)
  else if (city_district) {
    resultDistrict = normalizeDistrict(city_district);
    confidence = 'high';
    reason = `Xác định từ city_district: ${city_district}`;
  }
  // RULE 2: Kiểm tra county (thường dùng cho huyện)
  else if (county) {
    resultDistrict = normalizeDistrict(county);
    confidence = 'high';
    reason = `Xác định từ county: ${county}`;
  }
  // RULE 3: Kiểm tra state_district
  else if (state_district) {
    resultDistrict = normalizeDistrict(state_district);
    confidence = 'medium';
    reason = `Xác định từ state_district: ${state_district}`;
  }
  // RULE 4: Nếu city = "Thành phố Thủ Đức" -> kiểm tra tọa độ trước
  else if (city && city.toLowerCase().includes('thủ đức')) {
    if (latitude && longitude && isCoordinateInThuDuc(latitude, longitude)) {
      resultDistrict = 'Thành phố Thủ Đức';
      confidence = 'high';
      reason = `city = "${city}" + tọa độ xác nhận`;
    } else if (latitude && longitude) {
      // Tọa độ không nằm trong Thủ Đức -> có thể là lỗi
      resultDistrict = '';
      confidence = 'low';
      reason = `city = "${city}" nhưng tọa độ không khớp - cần xác minh`;
    } else {
      resultDistrict = 'Thành phố Thủ Đức';
      confidence = 'medium';
      reason = `city = "${city}" (không có tọa độ để xác minh)`;
    }
  }
  // RULE 5: Kiểm tra suburb/ward có thuộc TP Thủ Đức không
  else if (resultWard && isWardInThuDuc(resultWard)) {
    resultDistrict = 'Thành phố Thủ Đức';
    confidence = 'medium';
    reason = `Phường "${resultWard}" thuộc Thành phố Thủ Đức`;
  }
  // RULE 6: Fallback - dùng city nhưng cần kiểm tra kỹ
  else if (city) {
    resultDistrict = normalizeDistrict(city);
    confidence = 'low';
    reason = `Fallback từ city: ${city} (cần xác minh)`;
  }

  // Xây dựng địa chỉ chi tiết
  const addressParts = [];
  if (house_number) addressParts.push(house_number);
  if (road) addressParts.push(road);
  
  return {
    city: 'Thành phố Hồ Chí Minh',
    district: resultDistrict,
    ward: resultWard,
    address: addressParts.join(' '),
    confidence,
    reason
  };
};

/**
 * Reverse geocode coordinates to get structured address for Vietnam
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object | null>} - Object chứa thông tin địa chỉ đã parse
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Construct the OpenCageData API URL for reverse geocoding
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}%2C${longitude}&key=${OPENCAGE_API_KEY}&language=vi&limit=1&countrycode=vn`;
    
    // Make the API request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.components;
      
      // Parse địa chỉ theo logic hành chính VN - truyền tọa độ để kiểm tra
      const parsedAddress = parseVietnameseAddress(components, latitude, longitude);
      
      return {
        ...parsedAddress,
        formattedAddress: result.formatted,
        latitude,
        longitude,
        raw: components // Giữ lại raw data để debug nếu cần
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
 * Reverse geocode sử dụng Nominatim (OSM) - backup option
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
      
      // Parse theo logic tương tự
      let district = '';
      let ward = addr.suburb || addr.neighbourhood || addr.quarter || '';
      let confidence = 'medium';
      let reason = '';
      
      // RULE 0: Kiểm tra phường thuộc Quận 1 trước (ưu tiên cao nhất)
      // Vì OSM thường trả về sai "Thành phố Thủ Đức" cho khu vực trung tâm
      if (ward && isWardInQuan1(ward)) {
        district = 'Quận 1';
        confidence = 'high';
        reason = `Phường "${ward}" thuộc Quận 1`;
      }
      // RULE 0.5: Kiểm tra tọa độ - nếu nằm trong khu vực trung tâm, KHÔNG phải Thủ Đức
      else if (isCoordinateInCentral(latitude, longitude)) {
        // Nếu tọa độ nằm trong khu vực trung tâm, ưu tiên city_district hoặc district
        if (addr.city_district && !addr.city_district.toLowerCase().includes('thủ đức')) {
          district = normalizeDistrict(addr.city_district);
          confidence = 'high';
          reason = `Tọa độ trung tâm + city_district: ${addr.city_district}`;
        } else if (addr.district && !addr.district.toLowerCase().includes('thủ đức')) {
          district = normalizeDistrict(addr.district);
          confidence = 'high';
          reason = `Tọa độ trung tâm + district: ${addr.district}`;
        } else {
          // Fallback: dựa vào tọa độ, có thể là Quận 1 hoặc Quận 3
          district = 'Quận 1'; // Default cho khu vực trung tâm
          confidence = 'medium';
          reason = `Tọa độ nằm trong khu vực trung tâm TP.HCM`;
        }
      }
      // Nominatim dùng các field khác
      else if (addr.city_district) {
        district = normalizeDistrict(addr.city_district);
        confidence = 'high';
        reason = `Nominatim city_district: ${addr.city_district}`;
      } else if (addr.district) {
        district = normalizeDistrict(addr.district);
        confidence = 'high';
        reason = `Nominatim district: ${addr.district}`;
      } else if (addr.county) {
        district = normalizeDistrict(addr.county);
        confidence = 'medium';
        reason = `Nominatim county: ${addr.county}`;
      } else if (addr.city && addr.city.toLowerCase().includes('thủ đức')) {
        // Chỉ chấp nhận Thủ Đức nếu tọa độ thực sự nằm trong khu vực Thủ Đức
        if (isCoordinateInThuDuc(latitude, longitude)) {
          district = 'Thành phố Thủ Đức';
          confidence = 'medium';
          reason = `Nominatim city: ${addr.city} + tọa độ xác nhận`;
        } else {
          // Tọa độ không nằm trong Thủ Đức -> có thể là lỗi OSM
          district = '';
          confidence = 'low';
          reason = `Nominatim city: ${addr.city} nhưng tọa độ không khớp - cần xác minh`;
        }
      } else if (ward && isWardInThuDuc(ward)) {
        district = 'Thành phố Thủ Đức';
        confidence = 'medium';
        reason = `Phường "${ward}" thuộc Thành phố Thủ Đức`;
      }
      
      const addressParts = [];
      if (addr.house_number) addressParts.push(addr.house_number);
      if (addr.road) addressParts.push(addr.road);
      
      return {
        city: 'Thành phố Hồ Chí Minh',
        district,
        ward,
        address: addressParts.join(' '),
        formattedAddress: data.display_name,
        latitude,
        longitude,
        confidence,
        reason,
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
 * Smart reverse geocode - thử Nominatim trước (miễn phí), fallback sang OpenCage
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object | null>}
 */
export const smartReverseGeocode = async (latitude, longitude) => {
  // Thử Nominatim trước (miễn phí, không cần API key)
  let result = await reverseGeocodeNominatim(latitude, longitude);
  
  // Nếu không có kết quả hoặc confidence thấp, thử OpenCage
  if (!result || result.confidence === 'low') {
    const opencageResult = await reverseGeocode(latitude, longitude);
    
    if (opencageResult) {
      // Nếu OpenCage có confidence cao hơn, dùng kết quả đó
      if (!result || opencageResult.confidence !== 'low') {
        result = opencageResult;
      }
    }
  }
  
  return result;
};

/**
 * Tìm kiếm địa chỉ sử dụng Nominatim (OSM) - miễn phí, không cần API key
 * @param {string} query - Chuỗi tìm kiếm
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string} | null>}
 */
export const searchAddressNominatim = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return null;
    }

    // Thêm "Ho Chi Minh City, Vietnam" để tăng độ chính xác
    const searchQuery = encodeURIComponent(`${query}, Ho Chi Minh City, Vietnam`);
    
    // Bounds cho TP.HCM: viewbox=106.35,11.15,107.05,10.35
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
    
    // Nếu không tìm thấy với bounded, thử lại không bounded
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
  // Thử Nominatim trước (miễn phí)
  let result = await searchAddressNominatim(query);
  
  // Nếu không có kết quả, thử OpenCage
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
