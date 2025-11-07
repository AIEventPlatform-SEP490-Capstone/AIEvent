import fetcher from './fetcher';
import { EventStatus } from '../constants/eventConstants';
import { convertUTCToUTC7, convertUTC7ToUTC, convertUTCToUTC7ISOString } from '../utils/dateUtils';

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
  
  return processedEvent;
};

// Helper function to process event dates for saving (UTC+7 -> UTC)
const processEventDatesForSaving = (eventData) => {
  if (!eventData) return eventData;
  
  // Create a new event object to avoid mutating the original
  const processedEvent = { ...eventData };
  
  // Convert all date fields from UTC+7 to UTC for saving
  if (processedEvent.startTime) {
    processedEvent.startTime = convertUTC7ToUTC(processedEvent.startTime).toISOString();
  }
  
  if (processedEvent.endTime) {
    processedEvent.endTime = convertUTC7ToUTC(processedEvent.endTime).toISOString();
  }
  
  if (processedEvent.saleStartTime) {
    processedEvent.saleStartTime = convertUTC7ToUTC(processedEvent.saleStartTime).toISOString();
  }
  
  if (processedEvent.saleEndTime) {
    processedEvent.saleEndTime = convertUTC7ToUTC(processedEvent.saleEndTime).toISOString();
  }
  
  return processedEvent;
};

// Helper function to process events array for display
const processEventsArrayForDisplay = (events) => {
  if (!Array.isArray(events)) return events;
  return events.map(processEventDatesForDisplay);
};

export const eventAPI = {
  // Get all events with filters
  getEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.eventCategoryId) queryParams.append('eventCategoryId', params.eventCategoryId);
    if (params.ticketType) queryParams.append('ticketType', params.ticketType);
    if (params.city) queryParams.append('city', params.city);
    if (params.timeLine) queryParams.append('timeLine', params.timeLine);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    
    // Handle tags array
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach((tag, index) => {
        queryParams.append(`tags[${index}].TagId`, tag.tagId || tag.TagId);
      });
    }

    const response = await fetcher.get(`/event?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    const data = response.data?.data || response.data;
    
    // Process dates for all events in the response
    if (data) {
      if (data.items) {
        // Paginated response
        data.items = processEventsArrayForDisplay(data.items);
      } else if (Array.isArray(data)) {
        // Array response
        return processEventsArrayForDisplay(data);
      }
    }
    
    return data;
  },

  // Get event by ID
  getEventById: async (eventId) => {
    const response = await fetcher.get(`/event/${eventId}`);
    // Return the actual event data from the response
    let data = response.data?.data || response.data;
    
    // Process dates for the event
    if (data) {
      data = processEventDatesForDisplay(data);
    }
    
    return data;
  },

  // Get related events by event ID
  getRelatedEvents: async (eventId) => {
    const response = await fetcher.get(`/event/${eventId}/related`);
    // Return the actual related events data from the paginated response
    // The backend returns a paginated response, so we need to extract the items
    let data = response.data?.data?.items || response.data?.data || response.data || [];
    
    // Process dates for all related events
    if (Array.isArray(data)) {
      data = processEventsArrayForDisplay(data);
    }
    
    return data;
  },

  // Create new event (requires Organizer role)
  createEvent: async (eventData) => {
    console.log('Creating FormData from:', eventData);
    const formData = new FormData();
    
    // Add basic event fields
    formData.append('Title', eventData.title);
    formData.append('Description', eventData.description);
    formData.append('StartTime', eventData.startTime);
    formData.append('EndTime', eventData.endTime);
    formData.append('TotalTickets', eventData.totalTickets);
    formData.append('TicketPricingType', eventData.ticketPricingType);
    formData.append('RequireApproval', eventData.requireApproval || EventStatus.PendingApproval);
    formData.append('Publish', eventData.publish || false);
    
    // Optional fields
    if (eventData.locationName) {
      formData.append('LocationName', eventData.locationName);
    }
    if (eventData.detailedDescription) {
      formData.append('DetailedDescription', eventData.detailedDescription);
    }
    if (eventData.linkRef) {
      formData.append('LinkRef', eventData.linkRef);
    }
    if (eventData.district) {
      formData.append('District', eventData.district);
    }
    if (eventData.address) {
      formData.append('Address', eventData.address);
    }
    if (eventData.latitude) {
      formData.append('Latitude', eventData.latitude);
    }
    if (eventData.longitude) {
      formData.append('Longitude', eventData.longitude);
    }
    if (eventData.saleStartTime) {
      formData.append('SaleStartTime', eventData.saleStartTime);
    }
    if (eventData.saleEndTime) {
      formData.append('SaleEndTime', eventData.saleEndTime);
    }
    if (eventData.eventCategoryId) {
      formData.append('EventCategoryId', eventData.eventCategoryId);
    }

    // Add images
    if (eventData.images && eventData.images.length > 0) {
      eventData.images.forEach((image, index) => {
        formData.append(`ImgListEvent`, image);
      });
    }

    // Add evidence images
    if (eventData.evidenceImages && eventData.evidenceImages.length > 0) {
      eventData.evidenceImages.forEach((image, index) => {
        formData.append(`ImgListEvidences`, image);
      });
    }

    // Add ticket types
    if (eventData.ticketTypes && eventData.ticketTypes.length > 0) {
      eventData.ticketTypes.forEach((ticket, index) => {
        formData.append(`TicketTypes[${index}].TicketName`, ticket.ticketName);
        formData.append(`TicketTypes[${index}].TicketPrice`, ticket.ticketPrice);
        formData.append(`TicketTypes[${index}].TicketQuantity`, ticket.ticketQuantity);
        if (ticket.ticketDescription) {
          formData.append(`TicketTypes[${index}].TicketDescription`, ticket.ticketDescription);
        }
      });
    }

    // Add tags
    if (eventData.tags && eventData.tags.length > 0) {
      eventData.tags.forEach((tag, index) => {
        formData.append(`Tags[${index}].TagId`, tag.tagId);
      });
    }

    // Debug FormData contents
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await fetcher.post('/event', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Update event (requires Organizer role)
  updateEvent: async (eventData) => {
    console.log('Updating event with data:', eventData);
    const formData = new FormData();
    
    // Add event ID
    formData.append('EventId', eventData.eventId);
    
    // Add basic event fields
    formData.append('Title', eventData.title);
    formData.append('Description', eventData.description);
    formData.append('StartTime', eventData.startTime);
    formData.append('EndTime', eventData.endTime);
    formData.append('TotalTickets', eventData.totalTickets);
    formData.append('TicketPricingType', eventData.ticketPricingType);
    if (eventData.requireApproval !== undefined) {
      formData.append('RequireApproval', eventData.requireApproval);
    }
    formData.append('Publish', eventData.publish || false);
    
    // Optional fields
    if (eventData.locationName) {
      formData.append('LocationName', eventData.locationName);
    }
    if (eventData.detailedDescription) {
      formData.append('DetailedDescription', eventData.detailedDescription);
    }
    if (eventData.linkRef) {
      formData.append('LinkRef', eventData.linkRef);
    }
    if (eventData.district) {
      formData.append('District', eventData.district);
    }
    if (eventData.address) {
      formData.append('Address', eventData.address);
    }
    if (eventData.latitude) {
      formData.append('Latitude', eventData.latitude);
    }
    if (eventData.longitude) {
      formData.append('Longitude', eventData.longitude);
    }
    if (eventData.saleStartTime) {
      formData.append('SaleStartTime', eventData.saleStartTime);
    }
    if (eventData.saleEndTime) {
      formData.append('SaleEndTime', eventData.saleEndTime);
    }
    if (eventData.eventCategoryId) {
      formData.append('EventCategoryId', eventData.eventCategoryId);
    }

    // Add new images only (not existing image URLs)
    if (eventData.images && eventData.images.length > 0) {
      eventData.images.forEach((image) => {
        formData.append('ImgListEvent', image);
      });
    }

    // Add new evidence images only (not existing image URLs)
    if (eventData.evidenceImages && eventData.evidenceImages.length > 0) {
      eventData.evidenceImages.forEach((image) => {
        formData.append('ImgListEvidences', image);
      });
    }

    // Add image URLs to remove
    if (eventData.removeImageUrls && eventData.removeImageUrls.length > 0) {
      eventData.removeImageUrls.forEach((imageUrl) => {
        formData.append('RemoveImageUrls', imageUrl);
      });
    }

    // Add evidence image URLs to remove
    if (eventData.removeEvidenceImageUrls && eventData.removeEvidenceImageUrls.length > 0) {
      eventData.removeEvidenceImageUrls.forEach((imageUrl) => {
        formData.append('RemoveImageEvidenceUrls', imageUrl);
      });
    }

    // Add ticket types
    if (eventData.ticketTypes && eventData.ticketTypes.length > 0) {
      eventData.ticketTypes.forEach((ticket, index) => {
        // Add ticket ID if it exists (for existing tickets)
        if (ticket.id) {
          formData.append(`TicketTypes[${index}].Id`, ticket.id);
        }
        formData.append(`TicketTypes[${index}].TicketName`, ticket.ticketName);
        formData.append(`TicketTypes[${index}].TicketPrice`, ticket.ticketPrice);
        formData.append(`TicketTypes[${index}].TicketQuantity`, ticket.ticketQuantity);
        if (ticket.ticketDescription) {
          formData.append(`TicketTypes[${index}].TicketDescription`, ticket.ticketDescription);
        }
      });
    }

    // Add ticket type IDs to remove
    if (eventData.removeTicketTypeIds && eventData.removeTicketTypeIds.length > 0) {
      eventData.removeTicketTypeIds.forEach((id) => {
        formData.append('RemoveTicketTypeIds', id);
      });
    }

    // Add tag IDs to add
    if (eventData.addTagIds && eventData.addTagIds.length > 0) {
      eventData.addTagIds.forEach((id) => {
        formData.append('AddTagIds', id);
      });
    }

    // Add tag IDs to remove
    if (eventData.removeTagIds && eventData.removeTagIds.length > 0) {
      eventData.removeTagIds.forEach((id) => {
        formData.append('RemoveTagIds', id);
      });
    }

    // Debug FormData contents
    console.log('Update FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await fetcher.patch(`/event/${eventData.eventId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Delete event (requires Organizer role)
  deleteEvent: async (eventId, reasonCancel = null) => {
    let url = `/event/${eventId}`;
    
    // If reasonCancel is provided, send it in the request body as JSON
    if (reasonCancel) {
      const response = await fetcher.delete(url, {
        data: JSON.stringify(reasonCancel),
      });
      // Return the actual response data
      return response.data?.data || response.data;
    } else {
      // For events without a reason, just send a simple DELETE request
      const response = await fetcher.delete(url);
      // Return the actual response data
      return response.data?.data || response.data;
    }
  },

  // Get draft events (requires Organizer role)
  getDraftEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const response = await fetcher.get(`/event/draft?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    const data = response.data?.data || response.data;
    
    // Process dates for all events in the response
    if (data) {
      if (data.items) {
        // Paginated response
        data.items = processEventsArrayForDisplay(data.items);
      } else if (Array.isArray(data)) {
        // Array response
        return processEventsArrayForDisplay(data);
      }
    }
    
    return data;
  },

  // Get events by status (requires Admin, Manager, Organizer roles)
  getEventsByStatus: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const response = await fetcher.get(`/event/status?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    const data = response.data?.data || response.data;
    
    // Process dates for all events in the response
    if (data) {
      if (data.items) {
        // Paginated response
        data.items = processEventsArrayForDisplay(data.items);
      } else if (Array.isArray(data)) {
        // Array response
        return processEventsArrayForDisplay(data);
      }
    }
    
    return data;
  },

  // Confirm event (requires Admin, Manager roles)
  confirmEvent: async (eventId, confirmData) => {
    const formData = new FormData();
    formData.append('Status', confirmData.status);
    if (confirmData.reason) {
      formData.append('Reason', confirmData.reason);
    }

    const response = await fetcher.patch(`/event/confirm/${eventId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Request to end event (requires Admin, Manager, Organizer roles)
  requestEndEvent: async (requestData) => {
    // Send JSON data with text/plain content type
    const response = await fetcher.post('/event/request-end', requestData, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Confirm end event (requires Admin, Manager roles)
  confirmEndEvent: async (requestData) => {
    // Create request data object with the correct field names
    const requestDataObj = {
      endEventRequestId: requestData.endEventRequestId,
      status: requestData.status,
      adminNote: requestData.adminNote || ''
    };
    
    // Use the correct endpoint from backend
    const response = await fetcher.patch('/event/confirm-end-event', requestDataObj, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Get end event request by ID (requires Admin, Manager, Organizer roles)
  getEndEventRequestById: async (endEventRequestId) => {
    const response = await fetcher.get(`/event/request-end/${endEventRequestId}`);
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Get end event requests with filters (requires Admin, Manager, Organizer roles)
  getEndEventRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.eventId) queryParams.append('eventId', params.eventId);
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const response = await fetcher.get(`/event/request-end?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    const data = response.data?.data || response.data;
    
    // Process dates for all events in the response
    if (data) {
      if (data.items) {
        // Paginated response
        data.items = processEventsArrayForDisplay(data.items);
      } else if (Array.isArray(data)) {
        // Array response
        return processEventsArrayForDisplay(data);
      }
    }
    
    return data;
  },
};

export default eventAPI;