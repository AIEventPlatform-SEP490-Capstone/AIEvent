/**
 * Format a number with thousand separators (Vietnamese style)
 * Example: 100000 -> "100.000"
 * @param {number | string} value - The value to format
 * @returns {string} - Formatted number with thousand separators
 */
export const formatNumberWithSeparator = (value) => {
  if (!value && value !== 0) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '';
  
  return new Intl.NumberFormat('vi-VN').format(numValue);
};

/**
 * Remove thousand separators and get clean number
 * Example: "100.000" -> "100000"
 * @param {string} value - The formatted value
 * @returns {string} - Clean number string without separators
 */
export const removeNumberFormatting = (value) => {
  if (!value) return '';
  return value.toString().replace(/\./g, '');
};

/**
 * Format price in Vietnamese currency style (without currency symbol)
 * Just the number with thousand separators
 * @param {number | string} value - The price value
 * @returns {string} - Formatted price
 */
export const formatPrice = (value) => {
  return formatNumberWithSeparator(value);
};
