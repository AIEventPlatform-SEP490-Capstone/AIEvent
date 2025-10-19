import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  selectCategories,
  selectCategoriesLoading,
  selectCategoriesError,
  selectShouldFetchCategories,
  selectCategoryById,
  clearError,
} from "../store/slices/categoriesSlice";

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

  const createNewCategory = async (categoryData) => {
    return dispatch(createCategory(categoryData));
  };
  const updateExistingCategory = async (categoryId, categoryData) => {
    return dispatch(updateCategory({ categoryId, categoryData }));
  };

  const deleteExistingCategory = async (categoryId) => {
    return dispatch(deleteCategory(categoryId));
  };
  const clearCategoriesError = () => {
    dispatch(clearError());
  };

  const getCategoryById = (categoryId) => {
    return (
      categories.find((category) => category.eventCategoryId === categoryId) ||
      null
    );
  };

  return {
    categories,
    loading,
    error,
    refreshCategories,
    createNewCategory,
    updateExistingCategory,
    deleteExistingCategory,
    clearCategoriesError,
    getCategoryById,
  };
};

export default useCategories;
