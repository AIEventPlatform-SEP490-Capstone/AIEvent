import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import FavoriteEventService from '../../api/services/FavoriteEventService';

// Async thunks
export const fetchFavoriteEvents = createAsyncThunk(
  'favoriteEvents/fetchFavoriteEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await FavoriteEventService.getFavoriteEvents(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch favorite events');
    }
  }
);

export const addFavoriteEvent = createAsyncThunk(
  'favoriteEvents/addFavoriteEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await FavoriteEventService.addFavoriteEvent(eventId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add favorite event');
    }
  }
);

export const removeFavoriteEvent = createAsyncThunk(
  'favoriteEvents/removeFavoriteEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await FavoriteEventService.removeFavoriteEvent(eventId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove favorite event');
    }
  }
);

// Helper function to calculate display price
const calculateDisplayPrice = (eventData) => {
  // If we have ticket details, calculate from them
  if (eventData.ticketDetails && eventData.ticketDetails.length > 0) {
    const prices = eventData.ticketDetails.map(ticket => ticket.ticketPrice || 0);
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
  
  // Fallback to direct ticketPrice property
  if (eventData.ticketPrice !== undefined && eventData.ticketPrice > 0) {
    return `${eventData.ticketPrice.toLocaleString('vi-VN')}đ`;
  }
  
  // Check ticketPricingType
  if (eventData.ticketPricingType === 'Free' || eventData.ticketPricingType === 'free') {
    return 'Miễn phí';
  }
  
  // Default to Miễn phí if no price information
  return 'Miễn phí';
};

// Helper function to transform tags
const transformTags = (tags) => {
  if (!tags || !Array.isArray(tags)) return [];
  return tags.map(tag => {
    if (typeof tag === 'object') {
      return tag.tagName || tag.name || tag.tagId || 'Tag';
    }
    return tag;
  });
};

// Initial state
const initialState = {
  events: [],
  loading: false,
  error: null,
  totalCount: 0,
};

// Slice
const favoriteEventsSlice = createSlice({
  name: 'favoriteEvents',
  initialState,
  reducers: {
    clearFavoriteEvents: (state) => {
      state.events = [];
      state.totalCount = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorite events
      .addCase(fetchFavoriteEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavoriteEvents.fulfilled, (state, action) => {
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
            isFavorite: true, // Since these are favorite events, they should all be marked as favorite
            totalTickets: event.totalTickets || event.TotalTickets || 0,
            tags: transformTags(event.tags || event.Tags || []),
            ticketDetails: event.ticketDetails || event.TicketDetails || []
          }));
          
          state.events = transformedEvents;
          state.totalCount = action.payload.data?.length || 0;
        } else {
          state.error = action.payload?.message || 'Failed to fetch favorite events';
        }
      })
      .addCase(fetchFavoriteEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add favorite event
      .addCase(addFavoriteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFavoriteEvent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          // Successfully added favorite, no need to update state here as it will be refreshed
        } else {
          state.error = action.payload?.message || 'Failed to add favorite event';
        }
      })
      .addCase(addFavoriteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove favorite event
      .addCase(removeFavoriteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFavoriteEvent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          // Successfully removed favorite, no need to update state here as it will be refreshed
        } else {
          state.error = action.payload?.message || 'Failed to remove favorite event';
        }
      })
      .addCase(removeFavoriteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearFavoriteEvents } = favoriteEventsSlice.actions;

// Export selectors
export const selectFavoriteEvents = (state) => state.favoriteEvents.events;
export const selectFavoriteEventsLoading = (state) => state.favoriteEvents.loading;
export const selectFavoriteEventsError = (state) => state.favoriteEvents.error;
export const selectFavoriteEventsTotalCount = (state) => state.favoriteEvents.totalCount;

export default favoriteEventsSlice.reducer;