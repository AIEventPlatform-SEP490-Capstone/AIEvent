import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import EventService from '../../api/services/EventService';

// Async thunks
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await EventService.getEvents(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch events');
    }
  }
);

export const fetchEventsForStaff = createAsyncThunk(
  'events/fetchEventsForStaff',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await EventService.getEventsForStaff(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch events for staff');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId, { rejectWithValue }) => {
    try {
      // Validate eventId before making the request
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        throw new Error('Invalid event ID provided');
      }
      
      const response = await EventService.getEventById(eventId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch event');
    }
  }
);

export const searchEvents = createAsyncThunk(
  'events/searchEvents',
  async (query, { rejectWithValue }) => {
    try {
      const response = await EventService.searchEvents(query);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to search events');
    }
  }
);

// Helper function to calculate display price
const calculateDisplayPrice = (eventData) => {
  // If we have ticket details, calculate from them
  if (eventData.ticketDetails && eventData.ticketDetails.length > 0) {
    const prices = eventData.ticketDetails.map(ticket => ticket.ticketPrice !== undefined ? ticket.ticketPrice : 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === 0 && maxPrice === 0) {
      return 'Miễn phí';
    } else if (minPrice === maxPrice) {
      return `${minPrice.toLocaleString('vi-VN')}đ`;
    } else {
      return `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
    }
  }
  
  // Check ticketPricingType
  if (eventData.ticketPricingType === 'Free' || eventData.ticketPricingType === 'free') {
    return 'Miễn phí';
  }
  
  // Default to Miễn phí if no price information
  return 'Miễn phí';
};

// Initial state
const initialState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  totalCount: 0,
};

// Slice
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearEvents: (state) => {
      state.events = [];
      state.totalCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          // Transform events to ensure consistent structure
          const transformedEvents = action.payload.data.map(event => ({
            id: event.eventId || event.EventId || event.id || 'unknown',
            eventId: event.eventId || event.EventId || event.id || 'unknown',
            title: event.title || event.Title || 'Chưa có tiêu đề',
            description: event.description || event.Description || 'Chưa có mô tả',
            date: event.startTime || event.StartTime ? 
              new Date(event.startTime || event.StartTime).toLocaleDateString('vi-VN') : 
              'Chưa xác định',
            time: event.startTime || event.StartTime ? 
              new Date(event.startTime || event.StartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
              'Chưa xác định',
            location: event.locationName || event.LocationName || 'Chưa xác định',
            rating: event.averageRating || 4.5,
            attendees: event.soldQuantity || event.SoldQuantity || 0,
            ticketPrice: event.ticketPrice !== undefined ? event.ticketPrice : 0,
            ticketPricingType: event.ticketPricingType || 'Free',
            price: calculateDisplayPrice(event), // Add calculated price
            image: event.imgListEvent && event.imgListEvent.length > 0 ? 
              { uri: event.imgListEvent[0] } : 
              'card1',
            category: event.eventCategoryName || event.EventCategoryName || 'Chưa phân loại',
            categoryId: event.eventCategoryId || event.EventCategoryId || null,
            isFavorite: event.isFavorite || false,
            totalTickets: event.totalTickets || event.TotalTickets || 0,
            tags: event.tags || event.Tags || [],
            ticketDetails: event.ticketDetails || event.TicketDetails || []
          }));
          
          state.events = transformedEvents;
          state.totalCount = action.payload.data?.length || 0;
        } else {
          state.error = action.payload?.message || 'Failed to fetch events';
        }
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch events for staff
      .addCase(fetchEventsForStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventsForStaff.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          // Transform events to ensure consistent structure
          const transformedEvents = action.payload.data.map(event => ({
            id: event.eventId || event.EventId || event.id || 'unknown',
            eventId: event.eventId || event.EventId || event.id || 'unknown',
            title: event.title || event.Title || 'Chưa có tiêu đề',
            description: event.description || event.Description || 'Chưa có mô tả',
            date: event.startTime || event.StartTime ? 
              new Date(event.startTime || event.StartTime).toLocaleDateString('vi-VN') : 
              'Chưa xác định',
            time: event.startTime || event.StartTime ? 
              new Date(event.startTime || event.StartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
              'Chưa xác định',
            location: event.locationName || event.LocationName || 'Chưa xác định',
            rating: event.averageRating || 4.5,
            attendees: event.soldQuantity || event.SoldQuantity || 0,
            ticketPrice: event.ticketPrice !== undefined ? event.ticketPrice : 0,
            ticketPricingType: event.ticketPricingType || 'Free',
            price: calculateDisplayPrice(event), // Add calculated price
            image: event.imgListEvent && event.imgListEvent.length > 0 ? 
              { uri: event.imgListEvent[0] } : 
              'card1',
            category: event.eventCategoryName || event.EventCategoryName || 'Chưa phân loại',
            categoryId: event.eventCategoryId || event.EventCategoryId || null,
            isFavorite: event.isFavorite || false,
            totalTickets: event.totalTickets || event.TotalTickets || 0,
            tags: event.tags || event.Tags || [],
            ticketDetails: event.ticketDetails || event.TicketDetails || []
          }));
          
          state.events = transformedEvents;
          state.totalCount = action.payload.data?.length || 0;
        } else {
          state.error = action.payload?.message || 'Failed to fetch events for staff';
        }
      })
      .addCase(fetchEventsForStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch event by ID
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          // Transform event to ensure consistent structure
          const eventData = action.payload.data;
          const transformedEvent = {
            id: eventData.eventId || eventData.EventId || eventData.id || 'unknown',
            eventId: eventData.eventId || eventData.EventId || eventData.id || 'unknown',
            title: eventData.title || eventData.Title || 'Chưa có tiêu đề',
            description: eventData.description || eventData.Description || 'Chưa có mô tả',
            detailedDescription: eventData.detailedDescription || eventData.DetailedDescription || '',
            date: eventData.startTime || eventData.StartTime ? 
              new Date(eventData.startTime || eventData.StartTime).toLocaleDateString('vi-VN') : 
              'Chưa xác định',
            time: eventData.startTime || eventData.StartTime ? 
              new Date(eventData.startTime || eventData.StartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
              'Chưa xác định',
            endTime: eventData.endTime || eventData.EndTime ? 
              new Date(eventData.endTime || eventData.EndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
              'Chưa xác định',
            location: eventData.locationName || eventData.LocationName || 'Chưa xác định',
            address: eventData.address || eventData.Address || '',
            rating: eventData.averageRating !== undefined ? eventData.averageRating : 4.5,
            attendees: eventData.soldQuantity || eventData.SoldQuantity || 0,
            ticketPrice: eventData.ticketDetails && eventData.ticketDetails.length > 0 ? 
              Math.min(...eventData.ticketDetails.map(t => t.ticketPrice || 0)) : 0,
            ticketPricingType: eventData.ticketPricingType || 'Free',
            image: eventData.imgListEvent && eventData.imgListEvent.length > 0 ? 
              { uri: eventData.imgListEvent[0] } : 
              'card1',
            category: eventData.eventCategory ? 
              (eventData.eventCategory.eventCategoryName || eventData.eventCategory.EventCategoryName) : 
              (eventData.eventCategoryName || eventData.EventCategoryName || 'Chưa phân loại'),
            categoryId: eventData.eventCategory ? 
              (eventData.eventCategory.eventCategoryId || eventData.eventCategory.EventCategoryId) : 
              (eventData.eventCategoryId || eventData.EventCategoryId || null),
            organizer: eventData.organizerEvent ? 
              (eventData.organizerEvent.companyName || eventData.organizerEvent.CompanyName || 'Nhà tổ chức') : 
              'Chưa xác định',
            isFavorite: eventData.isFavorite || false,
            totalTickets: eventData.totalTickets || eventData.TotalTickets || 0,
            remainingTickets: eventData.remainingTickets || 0,
            tags: eventData.eventTags || eventData.EventTags || eventData.tags || [],
            ticketDetails: eventData.ticketDetails || eventData.TicketDetails || []
          };
          
          state.currentEvent = transformedEvent;
        } else {
          state.error = action.payload?.message || 'Failed to fetch event';
        }
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search events
      .addCase(searchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          // Transform events to ensure consistent structure
          const transformedEvents = action.payload.data.map(event => ({
            id: event.eventId || event.EventId || event.id || 'unknown',
            eventId: event.eventId || event.EventId || event.id || 'unknown',
            title: event.title || event.Title || 'Chưa có tiêu đề',
            description: event.description || event.Description || 'Chưa có mô tả',
            date: event.startTime || event.StartTime ? 
              new Date(event.startTime || event.StartTime).toLocaleDateString('vi-VN') : 
              'Chưa xác định',
            time: event.startTime || event.StartTime ? 
              new Date(event.startTime || event.StartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
              'Chưa xác định',
            location: event.locationName || event.LocationName || 'Chưa xác định',
            rating: event.averageRating || 4.5,
            attendees: event.soldQuantity || event.SoldQuantity || 0,
            ticketPrice: event.ticketPrice !== undefined ? event.ticketPrice : 0,
            ticketPricingType: event.ticketPricingType || 'Free',
            price: calculateDisplayPrice(event), // Add calculated price
            image: event.imgListEvent && event.imgListEvent.length > 0 ? 
              { uri: event.imgListEvent[0] } : 
              'card1',
            category: event.eventCategoryName || event.EventCategoryName || 'Chưa phân loại',
            categoryId: event.eventCategoryId || event.EventCategoryId || null,
            isFavorite: event.isFavorite || false,
            totalTickets: event.totalTickets || event.TotalTickets || 0,
            tags: event.tags || event.Tags || [],
            ticketDetails: event.ticketDetails || event.TicketDetails || []
          }));
          
          state.events = transformedEvents;
          state.totalCount = action.payload.data?.length || 0;
        } else {
          state.error = action.payload?.message || 'Failed to search events';
        }
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearCurrentEvent, clearEvents } = eventsSlice.actions;

// Export selectors
export const selectEvents = (state) => state.events.events;
export const selectCurrentEvent = (state) => state.events.currentEvent;
export const selectEventsLoading = (state) => state.events.loading;
export const selectEventsError = (state) => state.events.error;
export const selectEventsTotalCount = (state) => state.events.totalCount;

export default eventsSlice.reducer;