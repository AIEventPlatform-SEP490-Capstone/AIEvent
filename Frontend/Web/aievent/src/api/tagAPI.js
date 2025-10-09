import fetcher from './fetcher';

export const tagAPI = {
  // Get all tags
  getTags: async (pageNumber = 1, pageSize = 50) => {
    const response = await fetcher.get(`/tag?pageNumber=${pageNumber}&pageSize=${pageSize}`);
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
    const response = await fetcher.put(`/tag/${tagId}`, {
      nameTag: tagData.nameTag,
    });
    return response.data;
  },

  // Delete tag (Admin/Organizer only)
  deleteTag: async (tagId) => {
    const response = await fetcher.delete(`/tag/${tagId}`);
    return response.data;
  },
};

export default tagAPI;
