/**
 * Decode JWT token and extract payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64 - use Buffer in Node.js or atob in browser
    let decodedPayload;
    if (typeof window !== 'undefined') {
      // Browser environment
      decodedPayload = atob(paddedPayload);
    } else {
      // Node.js environment
      decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8');
    }
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Extract user information from JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - User info object or null if invalid
 */
export const getUserFromJWT = (token) => {
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  return {
    unique_name: payload.unique_name || payload.email || '',
    role: payload.role || 'User',
    email: payload.email || '',
    nameid: payload.nameid || '',
    organizer: payload.organizer || '',
    sub: payload.sub || '',
    jti: payload.jti || '',
    iat: payload.iat || null,
    nbf: payload.nbf || null,
    exp: payload.exp || null,
    iss: payload.iss || '',
    aud: payload.aud || ''
  };
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export const isJWTExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};
