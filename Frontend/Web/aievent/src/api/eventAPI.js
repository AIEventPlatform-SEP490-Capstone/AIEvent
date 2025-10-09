import fetcher from './fetcher';

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
        queryParams.append(`tags[${index}].TagId`, tag.TagId);
      });
    }

    const response = await fetcher.get(`/event?${queryParams.toString()}`);
    return response.data;
  },

  // Get event by ID
  getEventById: async (eventId) => {
    const response = await fetcher.get(`/event/${eventId}`);
    return response.data;
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
    formData.append('TicketType', eventData.ticketType);
    formData.append('RequireApproval', eventData.requireApproval || false);
    formData.append('Publish', eventData.publish || false);
    
    // Optional fields
    if (eventData.isOnlineEvent !== undefined) {
      formData.append('isOnlineEvent', eventData.isOnlineEvent);
    }
    if (eventData.locationName) {
      formData.append('LocationName', eventData.locationName);
    }
    if (eventData.detailedDescription) {
      formData.append('DetailedDescription', eventData.detailedDescription);
    }
    if (eventData.city) {
      formData.append('City', eventData.city);
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
    if (eventData.eventCategoryId) {
      formData.append('EventCategoryId', eventData.eventCategoryId);
    }

    // Add images
    if (eventData.images && eventData.images.length > 0) {
      eventData.images.forEach((image, index) => {
        formData.append(`ImgListEvent`, image);
      });
    }

    // Add ticket details
    if (eventData.ticketDetails && eventData.ticketDetails.length > 0) {
      eventData.ticketDetails.forEach((ticket, index) => {
        formData.append(`TicketDetails[${index}].TicketName`, ticket.ticketName);
        formData.append(`TicketDetails[${index}].TicketPrice`, ticket.ticketPrice);
        formData.append(`TicketDetails[${index}].TicketQuantity`, ticket.ticketQuantity);
        if (ticket.ticketDescription) {
          formData.append(`TicketDetails[${index}].TicketDescription`, ticket.ticketDescription);
        }
        formData.append(`TicketDetails[${index}].RuleRefundRequestId`, ticket.ruleRefundRequestId);
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
    return response.data;
  },

  // Get events by organizer (requires Organizer role)
  getEventsByOrganizer: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.eventCategoryId) queryParams.append('eventCategoryId', params.eventCategoryId);
    if (params.ticketType) queryParams.append('ticketType', params.ticketType);
    if (params.city) queryParams.append('city', params.city);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    
    // Handle tags array
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach((tag, index) => {
        queryParams.append(`tags[${index}].TagId`, tag.TagId);
      });
    }

    const response = await fetcher.get(`/event/organizer?${queryParams.toString()}`);
    return response.data;
  },

  // Delete event (requires Organizer role)
  deleteEvent: async (eventId) => {
    const response = await fetcher.delete(`/event?eventId=${eventId}`);
    return response.data;
  },
};

export default eventAPI;
