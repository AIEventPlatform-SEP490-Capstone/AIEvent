import fetcher from './fetcher';

export const categoryAPI = {
  // Get all categories
  getCategories: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const response = await fetcher.get(`/category?${queryParams.toString()}`);
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    const response = await fetcher.get(`/category/${categoryId}`);
    return response.data;
  },
};

export default categoryAPI;
