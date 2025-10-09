import fetcher from './fetcher';

export const eventCategoryAPI = {
  // Get all event categories
  getEventCategories: async (pageNumber = 1, pageSize = 50) => {
    const response = await fetcher.get(`/event-category?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },

  // Get event category by ID
  getEventCategoryById: async (categoryId) => {
    const response = await fetcher.get(`/event-category/${categoryId}`);
    return response.data;
  },

  // Create new event category (Admin/Manager only)
  createEventCategory: async (categoryData) => {
    const response = await fetcher.post('/event-category', categoryData);
    return response.data;
  },

  // Update event category (Admin/Manager only)
  updateEventCategory: async (categoryId, categoryData) => {
    const response = await fetcher.put(`/event-category/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete event category (Admin/Manager only)
  deleteEventCategory: async (categoryId) => {
    const response = await fetcher.delete(`/event-category/${categoryId}`);
    return response.data;
  },
};

export default eventCategoryAPI;
