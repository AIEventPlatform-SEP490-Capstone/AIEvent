/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload);

    // Properly decode UTF-8 characters (handles Vietnamese and other special characters)
    // Convert binary string to UTF-8 by treating each character as a byte
    const utf8String = decodeURIComponent(
      decodedPayload.split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );

    const parsedPayload = JSON.parse(utf8String);

    return parsedPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get user role from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} User role or null if not found
 */
export const getUserRole = (token) => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded) return null;

    // Check for role in different possible locations
    return decoded.role || decoded.Role || decoded.roles || decoded.Roles || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Check if user has staff role
 * @param {string} token - JWT token
 * @returns {boolean} True if user is staff, false otherwise
 */
export const isStaffUser = (token) => {
  try {
    // Handle null, undefined, or non-string token
    if (!token || typeof token !== 'string') return false;

    const role = getUserRole(token);
    if (!role) return false;

    // Handle both string and array roles
    if (Array.isArray(role)) {
      return role.some(r => typeof r === 'string' && r.toLowerCase() === 'staff');
    }

    return typeof role === 'string' && role.toLowerCase() === 'staff';
  } catch (error) {
    console.error('Error checking staff role:', error);
    return false;
  }
};