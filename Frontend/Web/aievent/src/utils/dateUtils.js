/**
 * Utility functions for date handling and timezone conversion
 */

/**
 * Convert a UTC date to UTC+7 (Vietnam time)
 * @param {string|Date} utcDate - Date in UTC format
 * @returns {Date} - Date converted to UTC+7
 */
export const convertUTCToUTC7 = (utcDate) => {
  if (!utcDate) return null;
  
  // Create a new Date object from the UTC date
  const date = new Date(utcDate);
  
  // Add 7 hours to convert from UTC to UTC+7
  // Vietnam is UTC+7
  date.setHours(date.getHours() + 7);
  
  return date;
};

/**
 * Convert a UTC date to UTC+7 (Vietnam time) as ISO string
 * @param {string|Date} utcDate - Date in UTC format
 * @returns {string|null} - ISO string of date converted to UTC+7
 */
export const convertUTCToUTC7ISOString = (utcDate) => {
  if (!utcDate) return null;
  
  const date = convertUTCToUTC7(utcDate);
  return date ? date.toISOString() : null;
};

/**
 * Convert a UTC+7 (Vietnam time) date to UTC
 * @param {string|Date} utc7Date - Date in UTC+7 format
 * @returns {Date} - Date converted to UTC
 */
export const convertUTC7ToUTC = (utc7Date) => {
  if (!utc7Date) return null;
  
  // Create a new Date object from the UTC+7 date
  const date = new Date(utc7Date);
  
  // Subtract 7 hours to convert from UTC+7 to UTC
  date.setHours(date.getHours() - 7);
  
  return date;
};

/**
 * Format date with timezone conversion from UTC to UTC+7
 * @param {string|Date} utcDate - Date in UTC format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatUTC7Date = (utcDate, options = {}) => {
  if (!utcDate) return 'Chưa xác định';
  
  try {
    const date = convertUTCToUTC7(utcDate);
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    };
    
    return date.toLocaleDateString('vi-VN', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Chưa xác định';
  }
};

/**
 * Format time with timezone conversion from UTC to UTC+7
 * @param {string|Date} utcDate - Date in UTC format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted time string
 */
export const formatUTC7Time = (utcDate, options = {}) => {
  if (!utcDate) return 'Chưa xác định';
  
  try {
    const date = convertUTCToUTC7(utcDate);
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    return date.toLocaleTimeString('vi-VN', defaultOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Chưa xác định';
  }
};

/**
 * Format date and time with timezone conversion from UTC to UTC+7
 * @param {string|Date} utcDate - Date in UTC format
 * @param {Object} dateOptions - Intl.DateTimeFormat options for date
 * @param {Object} timeOptions - Intl.DateTimeFormat options for time
 * @returns {Object} - Object containing formatted date and time
 */
export const formatUTC7DateTime = (utcDate, dateOptions = {}, timeOptions = {}) => {
  if (!utcDate) return { date: 'Chưa xác định', time: 'Chưa xác định' };
  
  try {
    return {
      date: formatUTC7Date(utcDate, dateOptions),
      time: formatUTC7Time(utcDate, timeOptions)
    };
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return { date: 'Chưa xác định', time: 'Chưa xác định' };
  }
};

export default {
  convertUTCToUTC7,
  convertUTC7ToUTC,
  formatUTC7Date,
  formatUTC7Time,
  formatUTC7DateTime
};