/**
 * Cloudflare Workers AI utility for parsing event information from text
 * Uses Cloudflare Worker proxy to avoid CORS issues
 */

const WORKER_URL = 'https://ancient-water-682b.nguyenhangnhathuy.workers.dev';

/**
 * Parse event information from natural language text using Cloudflare AI
 * @param {string} text - The text describing the event
 * @returns {Promise<Object>} - Parsed event data
 */
export const parseEventFromText = async (text) => {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to parse event');
    }

    if (data.success) {
      return {
        success: true,
        data: data.data
      };
    } else {
      throw new Error(data.error || 'Failed to parse event information');
    }
  } catch (error) {
    console.error('Error parsing event from text:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse event information'
    };
  }
};

/**
 * Verify Cloudflare Worker is accessible
 * @returns {Promise<boolean>}
 */
export const verifyWorkerConnection = async () => {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch (error) {
    console.error('Worker connection failed:', error);
    return false;
  }
};


/**
 * Generate event banner image using AI based on event data
 * @param {Object} eventData - The parsed event data (title, description, locationName, etc.)
 * @returns {Promise<Object>} - Generated image as base64 data URL
 */
export const generateEventImage = async (eventData) => {
  try {
    const response = await fetch(`${WORKER_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventData }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate image');
    }

    if (data.success) {
      return {
        success: true,
        image: data.image,
        imagePrompt: data.imagePrompt,
      };
    } else {
      throw new Error(data.error || 'Failed to generate event image');
    }
  } catch (error) {
    console.error('Error generating event image:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate event image',
    };
  }
};

/**
 * Generate multiple event banner images using AI based on event data
 * @param {Object} eventData - The parsed event data (title, description, locationName, etc.)
 * @param {number} count - Number of images to generate (1-5)
 * @returns {Promise<Object>} - Generated images as base64 data URLs
 */
export const generateMultipleEventImages = async (eventData, count = 3) => {
  try {
    const response = await fetch(`${WORKER_URL}/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventData, count: Math.min(Math.max(count, 1), 5) }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate images');
    }

    if (data.success) {
      return {
        success: true,
        images: data.images,
        totalGenerated: data.totalGenerated,
        errors: data.errors,
      };
    } else {
      throw new Error(data.error || 'Failed to generate event images');
    }
  } catch (error) {
    console.error('Error generating event images:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate event images',
    };
  }
};


/**
 * Format rich text content using AI to make it more beautiful and modern
 * @param {string} content - The HTML content from rich text editor
 * @param {string} formatStyle - The formatting style ('professional', 'creative', 'minimal')
 * @returns {Promise<Object>} - Formatted HTML content
 */
export const formatRichTextContent = async (content, formatStyle = 'professional') => {
  try {
    // Debug: Log what we're sending to the API
    console.log('=== formatRichTextContent Debug ===');
    console.log('Content being sent:', content);
    console.log('Format style:', formatStyle);
    
    // Pre-check for images before sending
    const preCheckImages = content.match(/<img[^>]*>/gi) || [];
    console.log('Pre-check images found:', preCheckImages.length);
    preCheckImages.forEach((img, i) => console.log(`Image ${i}:`, img.substring(0, 100) + '...'));
    
    const response = await fetch(`${WORKER_URL}/format-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, formatStyle }),
    });

    const data = await response.json();
    
    console.log('API Response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to format content');
    }

    if (data.success) {
      // Verify images in response
      const responseImages = (data.formattedContent || '').match(/<img[^>]*>/gi) || [];
      console.log('Images in API response:', responseImages.length);
      
      return {
        success: true,
        formattedContent: data.formattedContent,
        originalContent: content,
        preservedImages: data.preservedImages || 0,
      };
    } else {
      throw new Error(data.error || 'Failed to format content');
    }
  } catch (error) {
    console.error('Error formatting content:', error);
    
    // Fallback to local formatting if API fails
    console.log('Using local fallback formatting...');
    const fallbackResult = localFormatContent(content, formatStyle);
    if (fallbackResult) {
      console.log('Fallback result:', fallbackResult);
      return {
        success: true,
        formattedContent: fallbackResult.html,
        originalContent: content,
        usedFallback: true,
        preservedImages: fallbackResult.imageCount || 0,
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to format content',
    };
  }
};

// Hashtag colors for styling
const HASHTAG_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EF4444', // red
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

/**
 * Helper function to style hashtags with colors
 */
const styleHashtags = (content) => {
  let colorIndex = 0;
  
  // Find all hashtags and style them
  const hashtagPattern = /#[a-zA-Z0-9_\u00C0-\u024F]+/g;
  
  return content.replace(hashtagPattern, (hashtag) => {
    const color = HASHTAG_COLORS[colorIndex % HASHTAG_COLORS.length];
    colorIndex++;
    return `<span class="hashtag" style="color: ${color}; font-weight: 600; cursor: pointer;">${hashtag}</span>`;
  });
};

/**
 * Helper function to generate hashtags from content
 */
const generateHashtags = (text) => {
  // Extract keywords from text
  const keywords = [];
  
  // Common event-related keywords to look for
  const eventKeywords = {
    'workshop': '#Workshop',
    'hội thảo': '#HoiThao',
    'sự kiện': '#SuKien',
    'event': '#Event',
    'công nghệ': '#CongNghe',
    'technology': '#Technology',
    'tech': '#Tech',
    'startup': '#Startup',
    'networking': '#Networking',
    'giao lưu': '#GiaoLuu',
    'học hỏi': '#HocHoi',
    'chia sẻ': '#ChiaSe',
    'kinh nghiệm': '#KinhNghiem',
    'it': '#IT',
    'developer': '#Developer',
    'lập trình': '#LapTrinh',
    'sinh viên': '#SinhVien',
    'fresher': '#Fresher',
    'career': '#Career',
    'nghề nghiệp': '#NgheNghiep',
    'hồ chí minh': '#HoChiMinh',
    'hà nội': '#HaNoi',
    'đà nẵng': '#DaNang',
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [keyword, hashtag] of Object.entries(eventKeywords)) {
    if (lowerText.includes(keyword) && !keywords.includes(hashtag)) {
      keywords.push(hashtag);
      if (keywords.length >= 5) break;
    }
  }
  
  // Add generic hashtags if not enough
  if (keywords.length < 3) {
    const genericTags = ['#SuKien', '#Event', '#Vietnam'];
    for (const tag of genericTags) {
      if (!keywords.includes(tag)) {
        keywords.push(tag);
        if (keywords.length >= 3) break;
      }
    }
  }
  
  return keywords;
};

/**
 * Helper function to extract clean image URL from potentially corrupted img tag
 */
const extractCleanImageUrl = (imgTag) => {
  // First, decode HTML entities
  let decoded = imgTag
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  
  // Try to find a valid Cloudinary URL (or any https URL)
  const urlPatterns = [
    /https:\/\/res\.cloudinary\.com\/[^"'\s<>]+/gi,  // Cloudinary URLs
    /https:\/\/[^"'\s<>]+\.(png|jpg|jpeg|gif|webp|svg)/gi,  // Other image URLs
  ];
  
  for (const pattern of urlPatterns) {
    const matches = decoded.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  
  // Fallback: try to extract src attribute value
  const srcMatch = decoded.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1] && !srcMatch[1].startsWith('<')) {
    return srcMatch[1];
  }
  
  return null;
};

/**
 * Helper function to check if img tag is corrupted (nested img tags)
 */
const isCorruptedImgTag = (imgTag) => {
  return imgTag.includes('&lt;') || 
         imgTag.includes('&gt;') ||
         (imgTag.match(/<img/gi) || []).length > 1 ||
         imgTag.includes('src="<');
};

/**
 * Local fallback formatting function when AI API is unavailable
 * Applies basic HTML formatting improvements while preserving images
 * Images are placed at logical positions based on content structure
 * @param {string} content - The HTML content
 * @param {string} formatStyle - The formatting style
 * @returns {Object|null} - { html: string, imageCount: number } or null
 */
const localFormatContent = (content, formatStyle) => {
  if (!content) return null;
  
  console.log('=== localFormatContent Debug ===');
  console.log('Input content:', content.substring(0, 300));
  
  // STEP 1: Clean/sanitize corrupted img tags and extract clean images
  let cleanedContent = content;
  const allImgMatches = cleanedContent.match(/<img[^>]*>/gi) || [];
  const extractedImages = [];
  
  console.log('Found', allImgMatches.length, 'img tags to check');
  
  allImgMatches.forEach((imgTag, i) => {
    let cleanImgTag = imgTag;
    
    if (isCorruptedImgTag(imgTag)) {
      console.log(`Corrupted img tag found at index ${i}:`, imgTag.substring(0, 80));
      const cleanUrl = extractCleanImageUrl(imgTag);
      if (cleanUrl) {
        cleanImgTag = `<img src="${cleanUrl}">`;
        console.log('Cleaned to:', cleanImgTag);
      } else {
        console.log('Could not extract clean URL, skipping');
        cleanedContent = cleanedContent.replace(imgTag, '');
        return;
      }
    }
    
    // Replace with placeholder
    const placeholder = `[HÌNH ${i + 1}]`;
    extractedImages.push({ placeholder, html: cleanImgTag });
    cleanedContent = cleanedContent.replace(imgTag, placeholder);
  });
  
  console.log('Total clean images extracted:', extractedImages.length);
  
  // STEP 2: Extract text from HTML (with placeholders)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleanedContent;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Check if only images (no text content)
  const textWithoutPlaceholders = text.replace(/\[HÌNH \d+\]/g, '').trim();
  if (!textWithoutPlaceholders && extractedImages.length > 0) {
    const html = extractedImages.map(img => `<p>${img.html}</p>`).join('\n');
    console.log('Only images, returning:', html.substring(0, 200));
    return { html, imageCount: extractedImages.length };
  }
  
  if (!text.trim()) return null;
  
  // STEP 3: Format text content (keeping placeholders)
  const parts = text.split(/\n+/).filter(p => p.trim());
  if (parts.length === 0) return null;
  
  let formattedHtml = '';
  const emojis = ['✨', '🎯', '💡', '🚀', '⭐', '🎉', '📌', '🔥'];
  let emojiIdx = 0;
  let isFirstText = true;
  
  if (formatStyle === 'professional') {
    formattedHtml = parts.map((p) => {
      const trimmed = p.trim();
      // Check if this is an image placeholder
      if (/^\[HÌNH \d+\]$/.test(trimmed)) {
        return `<p>${trimmed}</p>`;
      }
      if (isFirstText) { isFirstText = false; return `<p><strong>${trimmed}</strong></p>`; }
      if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        return `<li>${trimmed.replace(/^[-•*\d.]\s*/, '')}</li>`;
      }
      return `<p>${trimmed}</p>`;
    }).join('\n');
    formattedHtml = formattedHtml.replace(/(<li>.*?<\/li>\n?)+/g, (m) => `<ul>\n${m}</ul>\n`);
  } else if (formatStyle === 'creative') {
    formattedHtml = parts.map((p) => {
      const trimmed = p.trim();
      if (/^\[HÌNH \d+\]$/.test(trimmed)) {
        return `<p>${trimmed}</p>`;
      }
      const emoji = emojis[emojiIdx % emojis.length];
      emojiIdx++;
      if (isFirstText) { isFirstText = false; return `<h3>${emoji} ${trimmed}</h3>`; }
      return `<p>${emoji} ${trimmed}</p>`;
    }).join('\n');
  } else if (formatStyle === 'minimal') {
    formattedHtml = parts.map((p) => {
      const trimmed = p.trim();
      if (/^\[HÌNH \d+\]$/.test(trimmed)) {
        return `<p>${trimmed}</p>`;
      }
      const shortened = trimmed.length > 150 ? trimmed.substring(0, 147) + '...' : trimmed;
      if (isFirstText) { isFirstText = false; return `<p><strong>${shortened}</strong></p>`; }
      return `<p>${shortened}</p>`;
    }).join('\n');
  } else {
    formattedHtml = parts.map(p => `<p>${p.trim()}</p>`).join('\n');
  }
  
  // STEP 4: Replace placeholders with actual images
  extractedImages.forEach((img) => {
    if (formattedHtml.includes(img.placeholder)) {
      formattedHtml = formattedHtml.split(img.placeholder).join(img.html);
    } else {
      // Append at end if placeholder not found
      formattedHtml += `\n<p>${img.html}</p>`;
    }
  });
  
  // STEP 5: Generate and add hashtags
  const hashtags = generateHashtags(text);
  if (hashtags.length > 0) {
    const hashtagsHtml = `<p class="hashtags">${hashtags.join(' ')}</p>`;
    formattedHtml += '\n' + hashtagsHtml;
  }
  
  // STEP 6: Style all hashtags with colors
  formattedHtml = styleHashtags(formattedHtml);
  
  console.log('Final HTML:', formattedHtml.substring(0, 300));
  
  return { html: formattedHtml, imageCount: extractedImages.length };
};
