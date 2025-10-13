import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  selectTag,
  unselectTag,
  clearSelectedTags,
  selectTags,
  selectTagsLoading,
  selectTagsError,
  selectSelectedTags,
  selectShouldFetchTags,
  selectTagById,
  clearError
} from '../store/slices/tagsSlice';

export const useTags = () => {
  const dispatch = useDispatch();
  const tags = useSelector(selectTags);
  const selectedTags = useSelector(selectSelectedTags);
  const loading = useSelector(selectTagsLoading);
  const creating = useSelector(state => state.tags.creating);
  const error = useSelector(selectTagsError);
  const shouldFetch = useSelector(selectShouldFetchTags);

  // Auto-fetch tags if needed
  useEffect(() => {
    if (shouldFetch) {
      dispatch(fetchTags());
    }
  }, [dispatch, shouldFetch]);

  const refreshTags = () => {
    dispatch(fetchTags());
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

  const getTagById = (tagId) => {
    return tags.find(tag => tag.tagId === tagId) || null;
  };

  return {
    tags,
    selectedTags,
    loading: loading || creating, // Include creating state
    error,
    refreshTags,
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
