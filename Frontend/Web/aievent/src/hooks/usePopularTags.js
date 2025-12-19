import { useSelector, useDispatch } from 'react-redux';
import {
  fetchPopularTags,
  selectPopularTags,
  selectPopularTagsLoading,
  selectShouldFetchPopularTags,
  invalidatePopularTags,
  clearPopularTags,
} from '../store/slices/tagsSlice';

/**
 * Hook riêng cho popular tags - không cần authentication
 * Tách biệt với useTags để tránh trigger các API cần quyền
 */
export const usePopularTags = () => {
  const dispatch = useDispatch();
  const popularTags = useSelector(selectPopularTags);
  const loading = useSelector(selectPopularTagsLoading);
  const shouldFetch = useSelector(selectShouldFetchPopularTags);

  const refreshPopularTags = (pageNumber = 1, pageSize = 15) => {
    dispatch(fetchPopularTags({ pageNumber, pageSize }));
  };

  const forceRefreshPopularTags = (pageNumber = 1, pageSize = 15) => {
    dispatch(invalidatePopularTags());
    dispatch(fetchPopularTags({ pageNumber, pageSize }));
  };

  const clearAllPopularTags = () => {
    dispatch(clearPopularTags());
  };

  return {
    popularTags,
    loading,
    shouldFetch,
    refreshPopularTags,
    forceRefreshPopularTags,
    clearAllPopularTags,
  };
};

export default usePopularTags;
