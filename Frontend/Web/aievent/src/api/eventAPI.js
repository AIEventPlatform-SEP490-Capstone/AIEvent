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
    if (params.district) queryParams.append('district', params.district);
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
    let data = response.data?.data || response.data;
    
    // Process dates for all events in the response
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
    // Prepare data object for JSON submission
    const data = {
      Title: eventData.title,
      Description: eventData.description,
      StartTime: eventData.startTime,
      EndTime: eventData.endTime,
      TotalTickets: eventData.totalTickets,
      RequireApproval: eventData.requireApproval || EventStatus.PendingApproval,
      Publish: eventData.publish !== undefined ? eventData.publish : false,
      LocationName: eventData.locationName,
      DetailedDescription: eventData.detailedDescription,
      LinkRef: eventData.linkRef,
      District: eventData.district,
      Address: eventData.address,
      Latitude: eventData.latitude,
      Longitude: eventData.longitude,
      SaleStartTime: eventData.saleStartTime,
      SaleEndTime: eventData.saleEndTime,
      EventCategoryId: eventData.eventCategoryId,
      ImgListEvent: eventData.images || [],
      ImgListEvidences: eventData.evidenceImages || [],
      TicketTypes: eventData.ticketTypes || [],
      Tags: eventData.tags || []
    };

    // Remove undefined properties
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const response = await fetcher.post('/event', data);
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Update event (requires Organizer role)
  updateEvent: async (eventData) => {
    // Prepare data object for JSON submission
    const data = {
      Title: eventData.title,
      Description: eventData.description,
      StartTime: eventData.startTime,
      EndTime: eventData.endTime,
      TotalTickets: eventData.totalTickets,
      Publish: eventData.publish !== undefined ? eventData.publish : false,
      LocationName: eventData.locationName,
      DetailedDescription: eventData.detailedDescription,
      LinkRef: eventData.linkRef,
      District: eventData.district,
      Address: eventData.address,
      Latitude: eventData.latitude,
      Longitude: eventData.longitude,
      SaleStartTime: eventData.saleStartTime,
      SaleEndTime: eventData.saleEndTime,
      EventCategoryId: eventData.eventCategoryId,
      ImgListEvent: eventData.images || [],
      ImgListEvidences: eventData.evidenceImages || [],
      RemoveImageUrls: eventData.removeImageUrls || [],
      RemoveImageEvidenceUrls: eventData.removeEvidenceImageUrls || [],
      TicketTypes: eventData.ticketTypes?.map(ticket => ({
        Id: ticket.id || null,
        TicketName: ticket.ticketName,
        TicketPrice: ticket.ticketPrice,
        TicketQuantity: ticket.ticketQuantity,
        TicketDescription: ticket.ticketDescription || ""
      })) || [],
      RemoveTicketTypeIds: eventData.removeTicketTypeIds || [],
      AddTagIds: eventData.addTagIds || [],
      RemoveTagIds: eventData.removeTagIds || []
    };

    // Remove undefined properties
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const response = await fetcher.patch(`/event/${eventData.eventId}`, data);
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

  // Cancel event (requires Manager role)
  cancelEvent: async (eventId, reasonCancel) => {
    const response = await fetcher.patch(`/event/${eventId}/cancel`, {
      reasonCancel: reasonCancel
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Get draft events (requires Organizer role)
  getDraftEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetcher.get(`/event/draft?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    let data = response.data?.data || response.data;
    
    // Process dates for all events in the response
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

  // Get events by status (requires Admin, Manager, Organizer roles)
  getEventsByStatus: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.organizerId) queryParams.append('organizerId', params.organizerId);

    const response = await fetcher.get(`/event/status?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    let data = response.data?.data || response.data;
    
    // Process dates for all events in the response
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

  // Cancel event by manager for violations (requires Manager role)
  cancelEventByManager: async (eventId, reasonCancel) => {
    const payload = {
      reasonCancel,
    };

    const response = await fetcher.patch(`/event/${eventId}/cancel`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

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
    let data = response.data?.data || response.data;
    
    // Process dates for all events in the response
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

  // Get AI recommended events
  getAIRecommendedEvents: async (pageNumber = 1, pageSize = 5) => {
    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', pageNumber);
    queryParams.append('pageSize', pageSize);

    const response = await fetcher.get(`/ai/event?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    let data = response.data?.data || response.data;
    
    // Process dates for all events in the response
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

  // Get AI recommended friends by event
  getAIRecommendedFriendsByEvent: async (eventId, pageNumber = 1, pageSize = 5) => {
    const queryParams = new URLSearchParams();
    queryParams.append('pageNumber', pageNumber);
    queryParams.append('pageSize', pageSize);

    const response = await fetcher.get(`/ai/friend/event/${eventId}?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    return response.data?.data || response.data;
  },
  // Invite friends to event
  inviteFriends: async (eventId, invitationData) => {
    const response = await fetcher.post(`/event/${eventId}/invite-friends`, invitationData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Confirm event invitation (Accept/Reject)
  confirmInvitation: async (invitationId, confirmData) => {
    const response = await fetcher.put(`/event/invitations/${invitationId}/confirm`, confirmData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Return the actual response data
    return response.data?.data || response.data;
  },

  // Get invitations status (paginated)
  getInvitationsStatus: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.status) queryParams.append('status', params.status);

    const response = await fetcher.get(`/event/invitations-status?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    let data = response.data?.data || response.data;
    
    // Process dates for invitations if needed
    if (data && data.items) {
      data.items = data.items.map(invitation => ({
        ...invitation,
        createdAt: invitation.createdAt ? convertUTCToUTC7ISOString(invitation.createdAt) : null,
        respondedAt: invitation.respondedAt ? convertUTCToUTC7ISOString(invitation.respondedAt) : null,
      }));
    }
    
    return data;
  },

  reportEvent: async ({ eventId, type, reason, attachmentUrl }) => {
    const params = new URLSearchParams();
    if (eventId) params.append("EventId", eventId);
    if (type) params.append("Type", type);
    if (reason) params.append("Reason", reason);
    if (attachmentUrl) params.append("AttachmentUrl", attachmentUrl);

    const response = await fetcher.post(`/event/report?${params.toString()}`);
    return response.data?.data ?? response.data;
  },

  getUserReports: async (eventId) => {
    const response = await fetcher.get(`/event/${eventId}/report/user`);
    const data = response.data?.data;

    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  },

  getEventReports: async (eventId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.type) queryParams.append("type", params.type);
    if (params.pageNumber) queryParams.append("pageNumber", params.pageNumber);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);

    const queryString = queryParams.toString();
    const url = queryString ? `/event/${eventId}/report?${queryString}` : `/event/${eventId}/report`;

    const response = await fetcher.get(url);
    const data = response.data?.data ?? response.data ?? {};

    const items = Array.isArray(data.items) ? data.items : [];
    const totalItems = data.totalItems ?? items.length ?? 0;

    return {
      items,
      totalItems,
      currentPage: data.currentPage ?? params.pageNumber ?? 1,
      totalPages: data.totalPages ?? 1,
      pageSize: data.pageSize ?? params.pageSize ?? 10,
      hasPreviousPage: data.hasPreviousPage ?? false,
      hasNextPage: data.hasNextPage ?? false,
    };
  },

  getEventReportDetail: async (reportId) => {
    const response = await fetcher.get(`/event/report/${reportId}`);
    return response.data?.data ?? response.data;
  },

  replyEventReport: async (reportId, replyText) => {
    const trimmedReply = replyText?.trim();
    if (!trimmedReply) {
      throw new Error("Reply text is required");
    }

    const response = await fetcher.patch(
      `/event/report/${reportId}/reply`,
      null,
      {
        params: { Reply: trimmedReply },
      }
    );

    return response.data?.data || response.data;
  },

  // Get events by radius
  getEventsByRadius: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.latitude !== undefined && params.latitude !== null) {
      queryParams.append('latitude', params.latitude);
    }
    if (params.longitude !== undefined && params.longitude !== null) {
      queryParams.append('longitude', params.longitude);
    }
    if (params.radius !== undefined && params.radius !== null) {
      queryParams.append('radius', params.radius);
    }
    if (params.categoryld) {
      queryParams.append('categoryld', params.categoryld);
    }
    if (params.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber);
    }
    if (params.pageSize) {
      queryParams.append('pageSize', params.pageSize);
    }

    const response = await fetcher.get(`/event/radius?${queryParams.toString()}`);
    // Return the actual data from the paginated response
    let data = response.data?.data || response.data;
    
    // Process dates for all events in the response
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

  // Get events by organizer
  getEventsByOrganizer: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.organizerId) queryParams.append('organizerId', params.organizerId);
    if (params.search) queryParams.append('search', params.search);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const response = await fetcher.get(`/event/by-organizer?${queryParams.toString()}`);
    let data = response.data?.data || response.data;

    if (data) {
      if (data.items) {
        data.items = processEventsArrayForDisplay(data.items);
      } else if (Array.isArray(data)) {
        data = processEventsArrayForDisplay(data);
      }
    }

    return data;
  },

  // Resolve error payment (requires Admin, Manager roles)
  resolveErrorPayment: async (eventId) => {
    const response = await fetcher.patch(`/event/${eventId}/resolve-error-payment`);
    // Return the actual response data
    return response.data?.data || response.data;
  },
  
};

export default eventAPI;
