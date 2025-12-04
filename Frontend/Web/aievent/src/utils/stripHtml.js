// Utility function to strip HTML tags from a string
export const stripHtml = (html) => {
  if (!html) return '';
  
  // Create a temporary DOM element to parse and extract text content
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};