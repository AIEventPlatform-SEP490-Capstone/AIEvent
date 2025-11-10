import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRatings,
  createRating,
  updateRating,
  deleteRating,
  selectRatings,
  selectRatingsLoading,
  selectRatingsError,
  clearError,
} from "../store/slices/ratingsSlice";

export const useRatings = (eventId) => {
  const dispatch = useDispatch();
  const ratings = useSelector(selectRatings);
  const loading = useSelector(selectRatingsLoading);
  const error = useSelector(selectRatingsError);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchRatings(eventId));
    }
  }, [dispatch, eventId]);

  const refreshRatings = () => {
    if (eventId) dispatch(fetchRatings(eventId));
  };

  const createNewRating = async (ratingData) => {
    try {
      const res = await dispatch(createRating({ eventId, ratingData }));
      // unwrap để lấy payload thật (rejectWithValue)
      const data = res.payload || res;
      // Nếu payload có statusCode từ server
      if (data?.statusCode === "AIE40001") {
        const error = new Error(data.message);
        error.code = "AIE40001";
        throw error;
      }
      return data;
    } catch (error) {
      // nếu API trả mã lỗi trong response
      if (
        error?.code === "AIE40001" ||
        error?.message?.includes("already rated")
      ) {
        throw {
          code: "AIE40001",
          message: "You have already rated this event.",
        };
      }
      throw error;
    }
  };

  const updateExistingRating = (ratingId, ratingData) => {
    return dispatch(updateRating({ ratingId, ratingData }));
  };

  const deleteExistingRating = (ratingId) => {
    return dispatch(deleteRating(ratingId));
  };

  const clearRatingsError = () => dispatch(clearError());

  return {
    ratings,
    loading,
    error,
    refreshRatings,
    createNewRating,
    updateExistingRating,
    deleteExistingRating,
    clearRatingsError,
  };
};

export default useRatings;
