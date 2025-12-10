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
