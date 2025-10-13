import fetcher from "./fetcher";

export const interestAPI = {
  // Get all interests
  getInterests: async (pageNumber = 1, pageSize = 50) => {
    const response = await fetcher.get(
      `/interest?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Get interest by ID
  getInterestById: async (interestId) => {
    const response = await fetcher.get(`/interest/${interestId}`);
    return response.data;
  },

  // Create new interest (Admin/Organizer only)
  createInterest: async (interestData) => {
    const response = await fetcher.post("/interest", {
      interestName: interestData.interestName,
    });
    return response.data;
  },

  // Update interest (Admin/Organizer only)
  updateInterest: async (interestId, interestData) => {
    const response = await fetcher.put(`/interest/${interestId}`, {
      interestName: interestData.interestName,
    });
    return response.data;
  },

  // Delete interest (Admin/Organizer only)
  deleteInterest: async (interestId) => {
    const response = await fetcher.delete(`/interest/${interestId}`);
    return response.data;
  },
};

export default interestAPI;
