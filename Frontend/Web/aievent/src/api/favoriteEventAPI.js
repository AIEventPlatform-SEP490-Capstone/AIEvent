import fetcher from './fetcher';
import { convertUTCToUTC7ISOString } from '../utils/dateUtils';

// Helper function to process event dates for display (UTC -> UTC+7)
const processEventDatesForDisplay = (event) => {
  if (!event) return event;
  
  // Create a new event object to avoid mutating the original
  const processedEvent = { ...event };
  
  // Convert all date fields from UTC to UTC+7 for display
  if (processedEvent.startTime) {
    processedEvent.startTime = convertUTCToUTC7ISOString(processedEvent.startTime);
  }
  
  if (processedEvent.endTime) {
    processedEvent.endTime = convertUTCToUTC7ISOString(processedEvent.endTime);
  }
  
  if (processedEvent.saleStartTime) {
    processedEvent.saleStartTime = convertUTCToUTC7ISOString(processedEvent.saleStartTime);
  }
  
  if (processedEvent.saleEndTime) {
    processedEvent.saleEndTime = convertUTCToUTC7ISOString(processedEvent.saleEndTime);
  }
  
  // Map new API response fields to match expected frontend structure
  if (processedEvent.totalPersonJoin !== undefined) {
    processedEvent.soldQuantity = processedEvent.totalPersonJoin;
  }
  
  if (processedEvent.totalAmount !== undefined) {
    processedEvent.revenue = processedEvent.totalAmount;
  }
  
  if (processedEvent.averageRating !== undefined) {
    processedEvent.rating = processedEvent.averageRating;
  }
  
  return processedEvent;
};

// Helper function to process events array for display
const processEventsArrayForDisplay = (events) => {
  if (!Array.isArray(events)) return events;
  return events.map(processEventDatesForDisplay);
};

export const favoriteEventAPI = {
  // Get favorite events
  getFavoriteEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.eventCategoryId) queryParams.append('eventCategoryId', params.eventCategoryId);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    
    const response = await fetcher.get(`/favorite-event?${queryParams.toString()}`);
    let data = response.data?.data || response.data;
    
    // Process dates for all favorite events in the response
    if (data) {
      if (data.items) {
        // Paginated response
        data.items = processEventsArrayForDisplay(data.items);
      } else if (Array.isArray(data)) {
        // Array response
        data = processEventsArrayForDisplay(data);
      }
    }
    
    return data;
  },

  // Add event to favorites
  addFavoriteEvent: async (eventId) => {
    const response = await fetcher.post('/favorite-event', null, {
      params: { eventId }
    });
    return response.data;
  },

  // Remove event from favorites
  removeFavoriteEvent: async (eventId) => {
    const response = await fetcher.delete('/favorite-event', {
      params: { eventId }
    });
    return response.data;
  }
};

export default favoriteEventAPI;