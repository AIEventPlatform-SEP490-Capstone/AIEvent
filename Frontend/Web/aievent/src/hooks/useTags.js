import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTags,
  fetchPopularTags,
  createTag,
  updateTag,
  deleteTag,
  selectTag,
  unselectTag,
  clearSelectedTags,
  selectTags,
  selectPopularTags,
  selectTagsLoading,
  selectPopularTagsLoading,
  selectTagsError,
  selectSelectedTags,
  selectShouldFetchTags,
  selectShouldFetchPopularTags,
  selectTagById,
  clearError,
  invalidateTags,
  invalidatePopularTags,
  clearTags,
  clearPopularTags
} from '../store/slices/tagsSlice';

export const useTags = (userRole = null) => {
  const dispatch = useDispatch();
  const tags = useSelector(selectTags);
  const popularTags = useSelector(selectPopularTags);
  const selectedTags = useSelector(selectSelectedTags);
  const loading = useSelector(selectTagsLoading);
  const loadingPopular = useSelector(selectPopularTagsLoading);
  const creating = useSelector(state => state.tags.creating);
  const error = useSelector(selectTagsError);
  const shouldFetch = useSelector(selectShouldFetchTags);
  const shouldFetchPopular = useSelector(selectShouldFetchPopularTags);

  // Auto-fetch tags if needed
  useEffect(() => {
    if (shouldFetch) {
      dispatch(fetchTags(userRole));
    }
  }, [dispatch, shouldFetch, userRole]);

  const refreshTags = () => {
    dispatch(fetchTags(userRole));
  };

  const refreshPopularTags = (pageNumber = 1, pageSize = 10) => {
    dispatch(fetchPopularTags({ pageNumber, pageSize }));
  };

  const createNewTag = async (tagData) => {
    return dispatch(createTag(tagData));
  };

  const updateExistingTag = async (tagId, tagData) => {
    return dispatch(updateTag({ tagId, tagData }));
  };

  const removeTag = async (tagId) => {
    return dispatch(deleteTag(tagId));
  };

  const selectTagForForm = (tag) => {
    dispatch(selectTag(tag));
  };

  const unselectTagFromForm = (tagId) => {
    dispatch(unselectTag(tagId));
  };

  const clearAllSelectedTags = () => {
    dispatch(clearSelectedTags());
  };

  const clearTagsError = () => {
    dispatch(clearError());
  };

  const clearAllTags = () => {
    dispatch(clearTags());
  };

  // Refresh tags with cache invalidation
  const forceRefreshTags = () => {
    dispatch(invalidateTags());
    dispatch(fetchTags(userRole));
  };

  const forceRefreshPopularTags = (pageNumber = 1, pageSize = 10) => {
    dispatch(invalidatePopularTags());
    dispatch(fetchPopularTags({ pageNumber, pageSize }));
  };

  const getTagById = (tagId) => {
    return tags.find(tag => tag.tagId === tagId) || null;
  };

  const clearAllPopularTags = () => {
    dispatch(clearPopularTags());
  };

  return {
    tags,
    popularTags,
    selectedTags,
    loading: loading || creating, // Include creating state
    loadingPopular,
    error,
    refreshTags,
    refreshPopularTags,
    forceRefreshTags,
    forceRefreshPopularTags,
    clearAllTags,
    clearAllPopularTags,
    createNewTag,
    updateExistingTag,
    removeTag,
    selectTagForForm,
    unselectTagFromForm,
    clearAllSelectedTags,
    clearTagsError,
    getTagById
  };
};

export default useTags;