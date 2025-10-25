import fetcher from './fetcher';
import { ConfirmStatus } from '../constants/eventConstants';

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
    return response.data?.data || response.data;
  },

  // Get event by ID
  getEventById: async (eventId) => {
    const response = await fetcher.get(`/event/${eventId}`);
    // Return the actual event data from the response
    return response.data?.data || response.data;
  },

  // Get related events by event ID
  getRelatedEvents: async (eventId) => {
    const response = await fetcher.get(`/event/${eventId}/related`);
    // Return the actual related events data from the paginated response
    // The backend returns a paginated response, so we need to extract the items
    return response.data?.data?.items || response.data?.data || response.data || [];
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
    formData.append('RequireApproval', eventData.requireApproval || ConfirmStatus.NeedConfirm);
    formData.append('Publish', eventData.publish || false);
    
    // Optional fields
    if (eventData.isOnlineEvent !== undefined) {
      formData.append('IsOnlineEvent', eventData.isOnlineEvent);
    }
    if (eventData.locationName) {
      formData.append('LocationName', eventData.locationName);
    }
    if (eventData.detailedDescription) {
      formData.append('DetailedDescription', eventData.detailedDescription);
    }
    if (eventData.linkRef) {
      formData.append('LinkRef', eventData.linkRef);
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
    formData.append('TicketType', eventData.ticketType);
    formData.append('RequireApproval', eventData.requireApproval || ConfirmStatus.NeedConfirm);
    formData.append('Publish', eventData.publish || false);
    
    // Optional fields
    if (eventData.isOnlineEvent !== undefined) {
      formData.append('IsOnlineEvent', eventData.isOnlineEvent);
    }
    if (eventData.locationName) {
      formData.append('LocationName', eventData.locationName);
    }
    if (eventData.detailedDescription) {
      formData.append('DetailedDescription', eventData.detailedDescription);
    }
    if (eventData.linkRef) {
      formData.append('LinkRef', eventData.linkRef);
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
    if (eventData.saleStartTime) {
      formData.append('SaleStartTime', eventData.saleStartTime);
    }
    if (eventData.saleEndTime) {
      formData.append('SaleEndTime', eventData.saleEndTime);
    }
    if (eventData.eventCategoryId) {
      formData.append('EventCategoryId', eventData.eventCategoryId);
    }

    // Add new images if any
    if (eventData.images && eventData.images.length > 0) {
      eventData.images.forEach((image) => {
        formData.append('ImgListEvent', image);
      });
    }

    // Add existing images to keep (as URLs)
    if (eventData.existingImages && eventData.existingImages.length > 0) {
      eventData.existingImages.forEach((imageUrl) => {
        formData.append('ImgListEvent', imageUrl);
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
  deleteEvent: async (eventId) => {
    const response = await fetcher.delete(`/event/${eventId}`);
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Get draft events (requires Organizer role)
  getDraftEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const response = await fetcher.get(`/event/draft?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    return response.data?.data || response.data;
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
    return response.data?.data || response.data;
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
};

export default eventAPI;