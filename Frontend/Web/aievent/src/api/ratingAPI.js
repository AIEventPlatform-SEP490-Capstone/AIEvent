import fetcher from "./fetcher";

export const ratingAPI = {
  getEventRatings: async (eventId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.pageNumber) queryParams.append("pageNumber", params.pageNumber);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);

    const response = await fetcher.get(
      `/rating/${eventId}/event?${queryParams.toString()}`
    );
    return response.data;
  },

  createEventRating: async (eventId, ratingData) => {
    const response = await fetcher.post(`/rating/${eventId}/event`, ratingData);
    return response.data;
  },

  updateRating: async (ratingId, ratingData) => {
    const response = await fetcher.patch(`/rating/${ratingId}`, ratingData);
    return response.data;
  },

  deleteRating: async (ratingId) => {
    const response = await fetcher.delete(`/rating/${ratingId}`);
    return response.data;
  },
};

export default ratingAPI;
