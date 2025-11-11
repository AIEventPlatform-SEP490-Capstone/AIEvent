import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class RatingService {
  /**
   * Get ratings by event id with optional pagination
   */
  static async getRatingsByEvent(eventId, params = {}) {
    try {
      const {pageNumber = 1, pageSize = 5} = params;
      const queryParams = new URLSearchParams();
      if (pageNumber) queryParams.append('pageNumber', pageNumber);
      if (pageSize) queryParams.append('pageSize', pageSize);

      const url = `${EndUrls.RATINGS_BY_EVENT(eventId)}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);

      let data = response;
      if (response.data) data = response.data;
      if (data.data) data = data.data;

      const items = data.items || data.Items || [];

      return {
        success: true,
        data: items,
        pagination: {
          currentPage: data.currentPage || data.CurrentPage || pageNumber,
          totalPages: data.totalPages || data.TotalPages || 1,
          totalItems: data.totalItems || data.TotalItems || items.length || 0,
          pageSize: data.pageSize || data.PageSize || pageSize,
        },
        message: 'Ratings fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: `Failed to fetch ratings: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Post a rating for an event
   */
  static async postRating(eventId, rating) {
    try {
      const response = await BaseApiService.post(
        EndUrls.RATINGS_BY_EVENT(eventId),
        rating,
      );
      return {
        success: true,
        data: response,
        message: 'Rating posted successfully',
      };
    } catch (error) {
      const res = error?.response?.data;
      console.error('Error posting rating:', res || error);

      return {
        success: false,
        data: null,
        message: res?.message || error.message || 'Failed to post rating',
        statusCode: res?.statusCode || error.statusCode,
        errors: res?.errors || error.errors,
      };
    }
  }

  /**
   * Patch (update) a rating by rating id
   */
  static async patchRating(ratingId, body) {
    try {
      const response = await BaseApiService.patch(
        EndUrls.RATING(ratingId),
        body,
      );
      return {
        success: true,
        data: response,
        message: 'Rating updated successfully',
      };
    } catch (error) {
      const res = error?.response?.data;
      console.error('Error updating rating:', res || error);

      return {
        success: false,
        data: null,
        message: res?.message || error.message || 'Failed to update rating',
        statusCode: res?.statusCode || error.statusCode,
        errors: res?.errors || error.errors,
      };
    }
  }

  /**
   * Delete a rating by id
   */
  static async deleteRating(ratingId) {
    try {
      const response = await BaseApiService.delete(EndUrls.RATING(ratingId));
      return {
        success: true,
        data: response,
        message: 'Rating deleted successfully',
      };
    } catch (error) {
      const res = error?.response?.data;
      console.error('Error deleting rating:', res || error);

      return {
        success: false,
        data: null,
        message: res?.message || error.message || 'Failed to delete rating',
        statusCode: res?.statusCode || error.statusCode,
        errors: res?.errors || error.errors,
      };
    }
  }
}

export default RatingService;
