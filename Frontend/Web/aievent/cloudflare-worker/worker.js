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

var SYSTEM_PROMPT = 'You are an AI assistant that extracts event information from text and returns it as JSON. Extract ONLY the following fields if they are EXPLICITLY mentioned in the text: title (Event title/name), description (Short description max 200 chars), detailedDescription (Detailed description), locationName (Venue/location name), address (Street address), district (District/area in Vietnam context), startTime (Event start time ISO format YYYY-MM-DDTHH:mm), endTime (Event end time ISO format), saleStartTime (Ticket sale start time ISO format), saleEndTime (Ticket sale end time ISO format), ticketTypes (Array of ticket types with ticketName, ticketPrice as number, ticketQuantity as number, ticketDescription), linkRef (Reference link/URL if any). CRITICAL RULES: 1. Return ONLY valid JSON, no markdown or explanation. 2. MUST use null for ANY field NOT EXPLICITLY mentioned in the text - DO NOT invent or assume values. 3. For dates: ONLY extract if date/time is explicitly written in text. If no date/time mentioned, use null. If only date given without time, assume 00:00 for start and 23:59 for end. 4. For Vietnamese text, keep the original language. 5. ticketPrice should be a number (VND), ticketQuantity should be a number. 6. If year is not specified but date is given, use 2025. 7. NEVER create default dates like today date - only use null if not mentioned.';

var IMAGE_PROMPT_SYSTEM = 'You are an expert at creating image generation prompts. Given event information, create a detailed, vivid prompt for generating an event banner/poster image. The prompt should be in English, descriptive, and suitable for Stable Diffusion. Focus on visual elements, atmosphere, colors, and style. Keep it under 200 words. Return ONLY the prompt text, no explanation.';

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

  // Route to different handlers based on path
  if (path === '/generate-image') {
    return handleGenerateImage(request);
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
            { role: 'user', content: 'Extract event information from this text and return as JSON:\n\n' + text }
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

    var parsedData = JSON.parse(jsonStr.trim());

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

// Generate event image
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

    // Create event summary for prompt generation
    var eventSummary = 'Event: ' + (eventData.title || 'Untitled Event');
    if (eventData.description) eventSummary += '. Description: ' + eventData.description;
    if (eventData.locationName) eventSummary += '. Location: ' + eventData.locationName;

    // Step 1: Generate image prompt using LLM
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
            { role: 'user', content: 'Create an image generation prompt for this event:\n\n' + eventSummary }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      }
    );

    var promptData = await promptResponse.json();
    
    if (!promptData.success || !promptData.result || !promptData.result.response) {
      return new Response(JSON.stringify({ error: 'Failed to generate image prompt' }), {
        status: 500,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    var imagePrompt = promptData.result.response.trim();
    
    // Add quality enhancers to prompt
    imagePrompt = imagePrompt + ', high quality, professional event poster, vibrant colors, modern design, 4k, detailed';

    // Step 2: Generate image using Stable Diffusion
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
          num_steps: 20,
          guidance: 7.5
        })
      }
    );

    // Check if image generation was successful
    if (!imageResponse.ok) {
      var errorData = await imageResponse.json();
      return new Response(JSON.stringify({ 
        error: 'Image generation failed: ' + (errorData.errors ? errorData.errors[0].message : 'Unknown error')
      }), {
        status: 500,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      });
    }

    // Get image as array buffer and convert to base64
    var imageBuffer = await imageResponse.arrayBuffer();
    var base64Image = arrayBufferToBase64(imageBuffer);

    return new Response(JSON.stringify({ 
      success: true, 
      imagePrompt: imagePrompt,
      image: 'data:image/png;base64,' + base64Image
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

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
