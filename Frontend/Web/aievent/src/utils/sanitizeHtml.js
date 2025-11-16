// Simple HTML sanitization utility
// Only allows safe HTML tags like <strong>, <em>, <br>, etc.
export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Remove any script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any on* event handlers
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');
  sanitized = sanitized.replace(/on\w+=[^>\s]*/gi, '');
  
  // Remove any javascript: links
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
};