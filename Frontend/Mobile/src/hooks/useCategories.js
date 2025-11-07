import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCategories,
  fetchCategoryById,
  selectCategories,
  selectCategoriesLoading,
  selectCategoriesError,
  selectShouldFetchCategories,
  selectCategoryById,
  clearCategoriesError,
} from '../redux/slices/categoriesSlice';

export const useCategories = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectCategoriesLoading);
  const error = useSelector(selectCategoriesError);
  const shouldFetch = useSelector(selectShouldFetchCategories);

  // Auto-fetch categories if needed
  useEffect(() => {
    if (shouldFetch) {
      dispatch(fetchCategories());
    }
  }, [dispatch, shouldFetch]);

  const refreshCategories = () => {
    dispatch(fetchCategories());
  };

  const getCategoryById = async (categoryId) => {
    try {
      const response = await dispatch(fetchCategoryById(categoryId)).unwrap();
      return response;
    } catch (err) {
      console.error('Failed to fetch category:', err);
      return null;
    }
  };

  const clearCategoriesErrorState = () => {
    dispatch(clearCategoriesError());
  };

  return {
    categories,
    loading,
    error,
    refreshCategories,
    getCategoryById,
    clearCategoriesError: clearCategoriesErrorState,
  };
};

export default useCategories;