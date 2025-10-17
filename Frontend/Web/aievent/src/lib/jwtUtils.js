/**
 * Decode JWT token safely (supports UTF-8 unicode)
 * @param {string} token - JWT token
 * @returns {object|null}
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    // Split the token into parts
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Convert base64url -> base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // Decode UTF-8 safely
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
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
    unique_name: payload.unique_name || payload.email || "",
    role: payload.role || "User",
    email: payload.email || "",
    nameid: payload.nameid || "",
    organizer: payload.organizer || "",
    sub: payload.sub || "",
    jti: payload.jti || "",
    iat: payload.iat || null,
    nbf: payload.nbf || null,
    exp: payload.exp || null,
    iss: payload.iss || "",
    aud: payload.aud || "",
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
