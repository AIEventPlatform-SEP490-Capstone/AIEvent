/**
 * Cloudflare Worker - AI Event Parser & Image Generator Proxy
 * Copy ALL code below and paste into Cloudflare Worker Quick Edit
 */

var CLOUDFLARE_ACCOUNT_ID = '3a63f7e67abb51ad7a8a00f2218771c3';
var CLOUDFLARE_API_TOKEN = 'uUlonA3Ct5m-_7E2-oH7MUe6woeEpEvT4uUgt5r7';
var AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';
var IMAGE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

var SYSTEM_PROMPT = 'You are an AI assistant that extracts event information from text and returns it as JSON. Extract ONLY the following fields if they are EXPLICITLY mentioned in the text: title (Event title/name - remove surrounding quotes like " or \'), description (Short description max 200 chars), detailedDescription (Detailed description), locationName (Venue/location name), address (Street address), district (District/area in Vietnam context), startTime (Event start time ISO format YYYY-MM-DDTHH:mm), endTime (Event end time ISO format), saleStartTime (Ticket sale start time ISO format), saleEndTime (Ticket sale end time ISO format), ticketTypes (Array of ticket types with ticketName, ticketPrice as number, ticketQuantity as number, ticketDescription), linkRef (Reference link/URL if any). CRITICAL RULES: 1. Return ONLY valid JSON, no markdown or explanation. 2. MUST use null for ANY field NOT EXPLICITLY mentioned in the text - DO NOT invent or assume values. 3. For dates: ONLY extract if date/time is explicitly written in text. If no date/time mentioned, use null. If only date given without time, assume 00:00 for start and 23:59 for end. 4. For Vietnamese text, keep the original language but REMOVE decorative quotes around titles. 5. ticketPrice should be a number (VND), ticketQuantity should be a number. 6. If year is not specified but date is given, use 2025. 7. NEVER create default dates like today date - only use null if not mentioned. 8. IMPORTANT: In JSON string values, properly escape special characters. Do not use raw quotes inside strings - use escaped quotes or remove them. 9. For title field: if the title has quotes like Game Show "Name" or Event \'Name\', extract as Game Show Name or Event Name (without the inner quotes).';

var IMAGE_PROMPT_SYSTEM = 'You are an expert at creating image generation prompts for event banners. Given event information, create a detailed, vivid prompt for generating a wide banner image (16:9 aspect ratio). The prompt should be in English, descriptive, and suitable for Stable Diffusion. Focus on visual elements, atmosphere, colors, and style suitable for a professional event banner. IMPORTANT: The image must NOT contain any text, letters, words, numbers, or typography. Focus only on visual imagery, scenery, and abstract elements. Keep it under 150 words. Return ONLY the prompt text, no explanation.';

// Format content system prompts for different styles
var FORMAT_CONTENT_PROMPTS = {
  professional: 'Bạn là chuyên gia viết nội dung sự kiện. Hãy format lại nội dung sau thành HTML đẹp, chuyên nghiệp cho mô tả chi tiết sự kiện. QUY TẮC: 1. Sử dụng các thẻ <h3>, <p>, <ul>, <li>, <strong>, <em> phù hợp. 2. Tạo cấu trúc rõ ràng với các section logic. 3. Giữ nguyên ý nghĩa và ngôn ngữ gốc (tiếng Việt). 4. Thêm bullet points cho danh sách. 5. Highlight thông tin quan trọng bằng <strong>. 6. KHÔNG thêm nội dung mới, chỉ format lại. 7. KHÔNG sử dụng markdown, chỉ HTML thuần. 8. Trả về CHỈ HTML, không giải thích.',
  
  creative: 'Bạn là copywriter sáng tạo cho sự kiện. Hãy format lại nội dung sau thành HTML hấp dẫn, thu hút cho mô tả chi tiết sự kiện. QUY TẮC: 1. Sử dụng các thẻ <h3>, <p>, <ul>, <li>, <strong>, <em> phù hợp. 2. Thêm emoji phù hợp (✨, 🎯, 💡, 🚀, ⭐, 🎉, 📌, 🔥) vào đầu các section/đoạn quan trọng. 3. Tạo cấu trúc sinh động, bắt mắt. 4. Giữ nguyên ý nghĩa và ngôn ngữ gốc (tiếng Việt). 5. KHÔNG thêm nội dung mới, chỉ format lại. 6. KHÔNG sử dụng markdown, chỉ HTML thuần. 7. Trả về CHỈ HTML, không giải thích.',
  
  minimal: 'Bạn là editor chuyên nghiệp. Hãy format lại nội dung sau thành HTML tối giản, súc tích cho mô tả chi tiết sự kiện. QUY TẮC: 1. Sử dụng các thẻ <p>, <strong> đơn giản. 2. Loại bỏ từ thừa, giữ ý chính. 3. Tạo cấu trúc ngắn gọn, trọng tâm. 4. Giữ nguyên ý nghĩa và ngôn ngữ gốc (tiếng Việt). 5. KHÔNG thêm nội dung mới, chỉ format và rút gọn. 6. KHÔNG sử dụng markdown, chỉ HTML thuần. 7. Trả về CHỈ HTML, không giải thích.'
};

// Hashtag colors for styling
var HASHTAG_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EF4444', // red
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  var url = new URL(request.url);
  var path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });
  }

  if (path === '/generate-images') {
    return handleGenerateMultipleImages(request);
  } else if (path === '/generate-image') {
    return handleGenerateImage(request);
  } else if (path === '/format-content') {
    return handleFormatContent(request);
  } else {
    return handleParseEvent(request);
  }
}

// Parse event text
async function handleParseEvent(request) {
  try {
    var body = await request.json();
    var text = body.text;

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    // Sanitize input text to handle special characters that might break JSON parsing
    var sanitizedText = text
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    var aiResponse = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/' + CLOUDFLARE_ACCOUNT_ID + '/ai/run/' + AI_MODEL,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: 'Extract event information from this text and return as JSON:\n\n' + sanitizedText }
          ],
          max_tokens: 2048,
          temperature: 0.1
        })
      }
    );

    var aiData = await aiResponse.json();

    if (!aiData.success) {
      return new Response(JSON.stringify({ 
        error: (aiData.errors && aiData.errors[0] && aiData.errors[0].message) || 'AI request failed' 
      }), {
        status: 500,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    var responseText = aiData.result && aiData.result.response;

    if (!responseText) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    var jsonStr = responseText;
    var jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    var jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonStr = jsonObjectMatch[0];
    }

    // Clean up the JSON string before parsing - fix common JSON issues
    jsonStr = jsonStr
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\\u([0-9a-fA-F]{0,3}[^0-9a-fA-F])/g, '\\\\u$1') // Fix incomplete unicode escapes
      .replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1') // Fix invalid escape sequences
      .replace(/,\s*}/g, '}') // Remove trailing commas before }
      .replace(/,\s*]/g, ']') // Remove trailing commas before ]
      .replace(/"\s*\n\s*"/g, '" "') // Fix broken strings across lines
      .trim();

    // Try to parse, if fails try additional cleanup
    var parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      // Additional cleanup for stubborn JSON
      jsonStr = jsonStr
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove all control chars including extended
        .replace(/\\x[0-9a-fA-F]{2}/g, '') // Remove hex escapes
        .replace(/\\u[0-9a-fA-F]{4}/g, function(match) {
          // Validate unicode escapes
          try {
            return JSON.parse('"' + match + '"');
          } catch (e) {
            return '';
          }
        });
      
      parsedData = JSON.parse(jsonStr);
    }

    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });
  }
}

// Generate single event image
async function handleGenerateImage(request) {
  try {
    var body = await request.json();
    var eventData = body.eventData;

    if (!eventData) {
      return new Response(JSON.stringify({ error: 'Event data is required' }), {
        status: 400,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    var result = await generateSingleImage(eventData, 0);
    
    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imagePrompt: result.imagePrompt,
      image: result.image
    }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });
  }
}

// Generate multiple event images (up to 5)
async function handleGenerateMultipleImages(request) {
  try {
    var body = await request.json();
    var eventData = body.eventData;
    var count = Math.min(Math.max(body.count || 1, 1), 5); // 1-5 images

    if (!eventData) {
      return new Response(JSON.stringify({ error: 'Event data is required' }), {
        status: 400,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    var images = [];
    var errors = [];

    // Generate images sequentially to avoid rate limits
    for (var i = 0; i < count; i++) {
      var result = await generateSingleImage(eventData, i);
      if (result.error) {
        errors.push({ index: i, error: result.error });
      } else {
        images.push({
          index: i,
          image: result.image,
          imagePrompt: result.imagePrompt
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      images: images,
      errors: errors.length > 0 ? errors : undefined,
      totalRequested: count,
      totalGenerated: images.length
    }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });
  }
}

// Helper function to generate a single image
async function generateSingleImage(eventData, variationIndex) {
  try {
    // Sanitize event data to handle special characters
    var sanitizeText = function(text) {
      if (!text) return '';
      return text
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/[\n\r]/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };
    
    var eventSummary = 'Event: ' + sanitizeText(eventData.title || 'Untitled Event');
    if (eventData.description) eventSummary += '. Description: ' + sanitizeText(eventData.description);
    if (eventData.locationName) eventSummary += '. Location: ' + sanitizeText(eventData.locationName);

    // Add variation instruction for different images
    var variationHints = [
      'Create a vibrant, colorful banner with dynamic composition.',
      'Create an elegant, sophisticated banner with subtle tones.',
      'Create a modern, minimalist banner with bold typography space.',
      'Create an energetic, exciting banner with dramatic lighting.',
      'Create a warm, inviting banner with soft gradients.'
    ];
    var variationHint = variationHints[variationIndex % variationHints.length];

    var promptResponse = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/' + CLOUDFLARE_ACCOUNT_ID + '/ai/run/' + AI_MODEL,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: IMAGE_PROMPT_SYSTEM },
            { role: 'user', content: variationHint + ' Create an image generation prompt for this event:\n\n' + eventSummary }
          ],
          max_tokens: 300,
          temperature: 0.8 // Higher temperature for more variation
        })
      }
    );

    var promptData = await promptResponse.json();
    
    if (!promptData.success || !promptData.result || !promptData.result.response) {
      return { error: 'Failed to generate image prompt' };
    }

    var imagePrompt = promptData.result.response.trim();
    
    // Add quality enhancers and banner-specific instructions - emphasize NO TEXT
    imagePrompt = imagePrompt + ', wide banner format 16:9 aspect ratio, high quality, professional event banner, vibrant colors, modern design, 4k, detailed, absolutely no text, no letters, no words, no typography, no watermark, no writing, text-free image';

    var imageResponse = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/' + CLOUDFLARE_ACCOUNT_ID + '/ai/run/' + IMAGE_MODEL,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          negative_prompt: 'text, letters, words, numbers, typography, watermark, signature, writing, font, caption, title, label, logo with text',
          num_steps: 20,
          guidance: 7.5,
          width: 1024,  // Wide banner format
          height: 576   // 16:9 aspect ratio (1024/576 ≈ 16:9)
        })
      }
    );

    if (!imageResponse.ok) {
      var errorData = await imageResponse.json();
      return { error: 'Image generation failed: ' + (errorData.errors ? errorData.errors[0].message : 'Unknown error') };
    }

    var imageBuffer = await imageResponse.arrayBuffer();
    var base64Image = arrayBufferToBase64(imageBuffer);

    return {
      image: 'data:image/png;base64,' + base64Image,
      imagePrompt: imagePrompt
    };

  } catch (error) {
    return { error: error.message || 'Failed to generate image' };
  }
}

function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper function to style hashtags with colors
function styleHashtags(content) {
  var colorIndex = 0;
  
  // Find all hashtags and style them
  // Match #Word patterns (including Vietnamese without diacritics)
  var hashtagPattern = /#[a-zA-Z0-9_\u00C0-\u024F]+/g;
  
  var styledContent = content.replace(hashtagPattern, function(hashtag) {
    var color = HASHTAG_COLORS[colorIndex % HASHTAG_COLORS.length];
    colorIndex++;
    return '<span class="hashtag" style="color: ' + color + '; font-weight: 600; cursor: pointer;">' + hashtag + '</span>';
  });
  
  return styledContent;
}

// Helper function to extract clean image URL from potentially corrupted img tag
function extractCleanImageUrl(imgTag) {
  // First, decode HTML entities
  var decoded = imgTag
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  
  // Try to find a valid Cloudinary URL (or any https URL)
  var urlPatterns = [
    /https:\/\/res\.cloudinary\.com\/[^"'\s<>]+/gi,  // Cloudinary URLs
    /https:\/\/[^"'\s<>]+\.(png|jpg|jpeg|gif|webp|svg)/gi,  // Other image URLs
  ];
  
  for (var i = 0; i < urlPatterns.length; i++) {
    var matches = decoded.match(urlPatterns[i]);
    if (matches && matches.length > 0) {
      // Return the first valid URL found
      return matches[0];
    }
  }
  
  // Fallback: try to extract src attribute value
  var srcMatch = decoded.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1] && !srcMatch[1].startsWith('<')) {
    return srcMatch[1];
  }
  
  return null;
}

// Helper function to check if img tag is corrupted (nested img tags)
function isCorruptedImgTag(imgTag) {
  // Check for nested img tags or HTML entities in src
  return imgTag.indexOf('&lt;') !== -1 || 
         imgTag.indexOf('&gt;') !== -1 ||
         (imgTag.match(/<img/gi) || []).length > 1 ||
         imgTag.indexOf('src="<') !== -1;
}

// Format rich text content using AI
async function handleFormatContent(request) {
  try {
    var body = await request.json();
    var content = body.content;
    var formatStyle = body.formatStyle || 'professional';

    // Debug logging
    console.log('=== handleFormatContent Debug ===');
    console.log('Received content length:', content ? content.length : 0);
    console.log('Content preview:', content ? content.substring(0, 500) : 'null');

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    // STEP 1: Clean/sanitize content - fix corrupted img tags from previous formats
    var cleanedContent = content;
    
    // Find all img-like patterns (including corrupted ones)
    var imgPattern = /<img[^>]*>/gi;
    var allImgMatches = cleanedContent.match(imgPattern) || [];
    
    console.log('Found ' + allImgMatches.length + ' img tags to check');
    
    allImgMatches.forEach(function(imgTag, idx) {
      if (isCorruptedImgTag(imgTag)) {
        console.log('Corrupted img tag found at index ' + idx + ':', imgTag.substring(0, 80));
        var cleanUrl = extractCleanImageUrl(imgTag);
        if (cleanUrl) {
          var cleanImgTag = '<img src="' + cleanUrl + '">';
          console.log('Cleaned to:', cleanImgTag);
          cleanedContent = cleanedContent.replace(imgTag, cleanImgTag);
        } else {
          console.log('Could not extract clean URL, removing corrupted tag');
          cleanedContent = cleanedContent.replace(imgTag, '');
        }
      }
    });

    // STEP 2: Extract clean images from sanitized content
    var extractedImages = [];
    var imageIndex = 0;
    
    // Match img tags - handle both <img ... > and <img ... />
    var imgTagPattern = /<img\s+[^>]*\/?>/gi;
    var match;
    
    // Reset lastIndex to ensure we start from the beginning
    imgTagPattern.lastIndex = 0;
    
    while ((match = imgTagPattern.exec(cleanedContent)) !== null) {
      var imgHtml = match[0];
      console.log('Extracted clean image ' + imageIndex + ':', imgHtml.substring(0, 100));
      extractedImages.push({
        marker: '___IMG' + imageIndex + '___',
        html: imgHtml,
        originalIndex: match.index
      });
      imageIndex++;
    }
    
    console.log('Total clean images extracted:', extractedImages.length);
    
    // Replace images with markers for AI processing
    // Process in reverse order to maintain correct indices
    var contentWithMarkers = cleanedContent;
    for (var i = extractedImages.length - 1; i >= 0; i--) {
      var img = extractedImages[i];
      // Use indexOf to find and replace (more reliable than regex)
      var idx = contentWithMarkers.indexOf(img.html);
      if (idx !== -1) {
        contentWithMarkers = contentWithMarkers.substring(0, idx) + img.marker + contentWithMarkers.substring(idx + img.html.length);
        console.log('Replaced image ' + i + ' with marker at index ' + idx);
      } else {
        console.log('WARNING: Could not find image ' + i + ' in content');
      }
    }
    
    console.log('Content with markers:', contentWithMarkers.substring(0, 500));

    // Create human-readable placeholders for AI: [HÌNH 1], [HÌNH 2], etc.
    var textWithPlaceholders = contentWithMarkers;
    extractedImages.forEach(function(img, idx) {
      var placeholder = '[HÌNH ' + (idx + 1) + ']';
      textWithPlaceholders = textWithPlaceholders.split(img.marker).join(placeholder);
    });
    
    // Strip HTML tags to get plain text for AI processing (keep placeholders)
    var plainText = textWithPlaceholders
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Check if only images (no text content)
    var textWithoutPlaceholders = plainText.replace(/\[HÌNH \d+\]/g, '').trim();
    if (!textWithoutPlaceholders && extractedImages.length > 0) {
      // If only images, return them formatted nicely
      var imageOnlyContent = extractedImages.map(function(img) {
        return '<p>' + img.html + '</p>';
      }).join('\n');
      
      return new Response(JSON.stringify({ 
        success: true, 
        formattedContent: imageOnlyContent,
        formatStyle: formatStyle,
        preservedImages: extractedImages.length
      }), {
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }
    
    if (!plainText) {
      return new Response(JSON.stringify({ error: 'Content is empty after stripping HTML' }), {
        status: 400,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    console.log('Plain text for AI (with placeholders):', plainText.substring(0, 500));

    // Get the appropriate system prompt based on format style
    var systemPrompt = FORMAT_CONTENT_PROMPTS[formatStyle] || FORMAT_CONTENT_PROMPTS.professional;
    
    // Add instruction about image placeholders
    if (extractedImages.length > 0) {
      systemPrompt += ' QUAN TRỌNG VỀ HÌNH ẢNH: Nội dung có ' + extractedImages.length + ' hình ảnh được đánh dấu là [HÌNH 1], [HÌNH 2],... Hãy GIỮ NGUYÊN các placeholder này và đặt chúng ở vị trí phù hợp trong nội dung đã format. Mỗi placeholder nên nằm trên một dòng riêng trong thẻ <p>. KHÔNG thay đổi format của placeholder, giữ nguyên [HÌNH X].';
    }
    
    // Add instruction about hashtags
    systemPrompt += ' HASHTAGS: Ở cuối nội dung, hãy thêm một dòng chứa 3-5 hashtags phù hợp với nội dung sự kiện. Format: <p class="hashtags">#Hashtag1 #Hashtag2 #Hashtag3</p>. Hashtags nên viết liền không dấu cách, có thể dùng tiếng Việt không dấu hoặc tiếng Anh. Ví dụ: #SuKien #Workshop #CongNghe #HoChiMinh';

    var aiResponse = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/' + CLOUDFLARE_ACCOUNT_ID + '/ai/run/' + AI_MODEL,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + CLOUDFLARE_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Nội dung cần format:\n\n' + plainText + '\n\nChỉ trả về HTML đã format, không giải thích.' }
          ],
          max_tokens: 2048,
          temperature: 0.3
        })
      }
    );

    var aiData = await aiResponse.json();

    if (!aiData.success) {
      return new Response(JSON.stringify({ 
        error: (aiData.errors && aiData.errors[0] && aiData.errors[0].message) || 'AI request failed' 
      }), {
        status: 500,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    var responseText = aiData.result && aiData.result.response;

    if (!responseText) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    // Clean up the response - remove markdown code blocks if present
    var formattedContent = responseText
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    
    console.log('AI response (cleaned):', formattedContent.substring(0, 500));
    
    // IMPORTANT: Remove any img tags that AI might have incorrectly added
    formattedContent = formattedContent.replace(/<img[^>]*>/gi, '');
    
    // Style hashtags with colors
    formattedContent = styleHashtags(formattedContent);
    
    // Replace placeholders with actual images
    var restoredCount = 0;
    extractedImages.forEach(function(img, idx) {
      var placeholder = '[HÌNH ' + (idx + 1) + ']';
      // Also handle variations AI might produce
      var variations = [
        placeholder,
        '[Hình ' + (idx + 1) + ']',
        '[hình ' + (idx + 1) + ']',
        '\\[HÌNH ' + (idx + 1) + '\\]',
        '(HÌNH ' + (idx + 1) + ')',
        'HÌNH ' + (idx + 1)
      ];
      
      var found = false;
      for (var v = 0; v < variations.length; v++) {
        if (formattedContent.indexOf(variations[v]) !== -1) {
          formattedContent = formattedContent.split(variations[v]).join(img.html);
          restoredCount++;
          found = true;
          console.log('Restored image ' + (idx + 1) + ' from placeholder:', variations[v]);
          break;
        }
      }
      
      // If placeholder not found, append at the end
      if (!found) {
        console.log('Placeholder not found for image ' + (idx + 1) + ', appending at end');
        formattedContent += '\n<p>' + img.html + '</p>';
        restoredCount++;
      }
    });
    
    console.log('Images restored:', restoredCount);
    console.log('Final content preview:', formattedContent.substring(0, 500));

    return new Response(JSON.stringify({ 
      success: true, 
      formattedContent: formattedContent,
      formatStyle: formatStyle,
      preservedImages: extractedImages.length,
      imagesRestored: restoredCount
    }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
    });
  }
}
