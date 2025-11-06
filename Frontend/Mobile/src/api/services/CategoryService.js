import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class CategoryService {
  /**
   * Get all event categories
   */
  static async getCategories(params = {}) {
    try {
      const {
        pageNumber = 1,
        pageSize = 50
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (pageNumber) queryParams.append('pageNumber', pageNumber);
      if (pageSize) queryParams.append('pageSize', pageSize);

      const url = `${EndUrls.EVENT_CATEGORIES}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);
      
      // Extract data from the paginated response
      let data = response;
      
      // Handle different response structures
      if (response.data) {
        data = response.data;
      }
      
      // If we have a data wrapper, extract the actual data
      if (data.data) {
        data = data.data;
      }
      
      // Extract items from paginated response
      const items = data.items || data.Items || [];
      
      return {
        success: true,
        data: items,
        pagination: {
          currentPage: data.currentPage || data.CurrentPage || pageNumber,
          totalPages: data.totalPages || data.TotalPages || 1,
          totalItems: data.totalItems || data.TotalItems || items.length || 0,
          pageSize: data.pageSize || data.PageSize || pageSize
        },
        message: 'Categories fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: `Failed to fetch categories: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id) {
    try {
      const response = await BaseApiService.get(EndUrls.EVENT_CATEGORY_DETAIL(id));
      // Extract data from the response
      let data = response;
      
      // Handle different response structures
      if (response.data) {
        data = response.data;
      }
      
      // If we have a data wrapper, extract the actual data
      if (data.data) {
        data = data.data;
      }
      
      return {
        success: true,
        data: data,
        message: 'Category details fetched',
      };
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch category: ${error.message}`,
        error: error.message,
      };
    }
  }
}

export default CategoryService;