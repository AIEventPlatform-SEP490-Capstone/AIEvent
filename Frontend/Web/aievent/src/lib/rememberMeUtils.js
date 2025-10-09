/**
 * Utility functions for handling "Remember Me" functionality
 */

const REMEMBER_ME_KEY = 'rememberedEmail';
const REMEMBER_ME_DURATION = 30; // days

/**
 * Save email to localStorage for remember me functionality
 * @param {string} email - User's email address
 */
export const saveRememberedEmail = (email) => {
  try {
    localStorage.setItem(REMEMBER_ME_KEY, email);
  } catch (error) {
    console.error('Error saving remembered email:', error);
  }
};

/**
 * Get remembered email from localStorage
 * @returns {string|null} - Remembered email or null if not found
 */
export const getRememberedEmail = () => {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.error('Error getting remembered email:', error);
    return null;
  }
};

/**
 * Remove remembered email from localStorage
 */
export const clearRememberedEmail = () => {
  try {
    localStorage.removeItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.error('Error clearing remembered email:', error);
  }
};

/**
 * Check if user has a remembered email
 * @returns {boolean} - True if email is remembered
 */
export const hasRememberedEmail = () => {
  return getRememberedEmail() !== null;
};

/**
 * Get cookie expiration options based on remember me preference
 * @param {boolean} rememberMe - Whether user wants to be remembered
 * @param {string} tokenExpiresAt - Token expiration date from server
 * @returns {object} - Cookie options object
 */
export const getCookieOptions = (rememberMe, tokenExpiresAt) => {
  const baseOptions = {
    secure: true,
    sameSite: 'strict'
  };

  if (rememberMe) {
    // If remember me is checked, set cookie to expire in 30 days
    baseOptions.expires = REMEMBER_ME_DURATION;
  } else {
    // If remember me is not checked, use the token's expiration time
    baseOptions.expires = new Date(tokenExpiresAt);
  }

  return baseOptions;
};
