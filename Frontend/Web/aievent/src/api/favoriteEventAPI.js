import fetcher from './fetcher';

export const favoriteEventAPI = {
  // Get favorite events
  getFavoriteEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.eventCategoryId) queryParams.append('eventCategoryId', params.eventCategoryId);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    
    const response = await fetcher.get(`/favorite-event?${queryParams.toString()}`);
    return response.data?.data || response.data;
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