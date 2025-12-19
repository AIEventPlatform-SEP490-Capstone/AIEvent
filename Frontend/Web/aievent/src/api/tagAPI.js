import fetcher from './fetcher';

export const tagAPI = {
  // Get all tags
  getTags: async (pageNumber = 1, pageSize = 50) => {
    const response = await fetcher.get(`/tag?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    // Return the full response to handle pagination in the slice
    return response.data;
  },

  // Get popular tags (sorted by usage count)
  // Falls back to /tag endpoint and sorts by quantityUsed if /tag/popular is not available
  getPopularTags: async (pageNumber = 1, pageSize = 10) => {
    try {
      // Try the popular endpoint first
      const response = await fetcher.get(
        `/tag/popular?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      );
      return response.data;
    } catch (error) {
      // Fallback: use regular tags endpoint and sort by quantityUsed
      if (error.response?.status === 403 || error.response?.status === 404) {
        const response = await fetcher.get(`/tag?pageNumber=1&pageSize=100`);
        const data = response.data;

        // Sort by quantityUsed and take top N
        let tags = data?.items || data || [];
        tags = tags
          .sort((a, b) => (b.quantityUsed || 0) - (a.quantityUsed || 0))
          .slice(0, pageSize);

        return { items: tags };
      }
      throw error;
    }
  },

  // Get tags created by the current user (organizer/manager)
  getUserTags: async (pageNumber = 1, pageSize = 50) => {
    const response = await fetcher.get(`/tag/user?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    // Return the full response to handle pagination in the slice
    return response.data;
  },

  // Get tag by ID
  getTagById: async (tagId) => {
    const response = await fetcher.get(`/tag/${tagId}`);
    return response.data;
  },

  // Create new tag (Admin/Organizer only)
  createTag: async (tagData) => {
    const response = await fetcher.post('/tag', {
      nameTag: tagData.nameTag,
    });
    return response.data;
  },

  // Update tag (Admin/Organizer only)
  updateTag: async (tagId, tagData) => {
    // Send the complete tag object with all fields
    const response = await fetcher.put(`/tag/${tagId}`, tagData);
    return response.data;
  },

  // Delete tag (Admin/Organizer only)
  deleteTag: async (tagId) => {
    const response = await fetcher.delete(`/tag/${tagId}`);
    return response.data;
  },
};

export default tagAPI;