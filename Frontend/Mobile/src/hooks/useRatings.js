import {useState, useEffect, useCallback} from 'react';
import RatingService from '../api/services/RatingService';
import BookingService from '../api/services/BookingService';

export const useRatings = (eventId, initialPageSize = 5) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [pagination, setPagination] = useState(null);
  const [hasPurchasedTicket, setHasPurchasedTicket] = useState(false);

  const loadRatings = useCallback(
    async (page = 1) => {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await RatingService.getRatingsByEvent(eventId, {
          pageNumber: page,
          pageSize,
        });
        if (res && res.success) {
          setRatings(res.data || []);
          setPagination(res.pagination || null);
        } else {
          setRatings([]);
          setPagination(null);
        }
      } catch (err) {
        console.error('useRatings.loadRatings error:', err);
        setRatings([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [eventId, pageSize],
  );

  const refreshRatings = useCallback(async () => {
    await loadRatings(pageNumber);
  }, [loadRatings, pageNumber]);

  const createNewRating = async payload => {
    if (!eventId) throw new Error('No eventId');
    try {
      const res = await RatingService.postRating(eventId, payload);
      if (!res.success) {
        const error = new Error(res.message || 'Create rating failed');
        error.statusCode = res.statusCode;
        error.errors = res.errors;
        throw error;
      }
      await refreshRatings();
      return res;
    } catch (err) {
      console.error('Error in createNewRating:', err);
      throw err;
    }
  };

  const updateExistingRating = async (ratingId, payload) => {
    if (!ratingId) throw new Error('No ratingId');
    try {
      const res = await RatingService.patchRating(ratingId, payload);
      if (!res.success) {
        const error = new Error(res.message || 'Update rating failed');
        error.statusCode = res.statusCode;
        error.errors = res.errors;
        throw error;
      }
      await refreshRatings();
      return res;
    } catch (err) {
      console.error('Error in updateExistingRating:', err);
      throw err;
    }
  };

  const deleteExistingRating = async ratingId => {
    if (!ratingId) throw new Error('No ratingId');
    try {
      const res = await RatingService.deleteRating(ratingId);
      if (!res.success) {
        const error = new Error(res.message || 'Delete rating failed');
        error.statusCode = res.statusCode;
        error.errors = res.errors;
        throw error;
      }
      await refreshRatings();
      return res;
    } catch (err) {
      console.error('Error in deleteExistingRating:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadRatings(pageNumber);
  }, [eventId, loadRatings, pageNumber]);

  // Check if current user has purchased ticket for this event
  useEffect(() => {
    const checkPurchased = async () => {
      if (!eventId) {
        setHasPurchasedTicket(false);
        return;
      }
      try {
        const result = await BookingService.getBookedEvents({
          pageNumber: 1,
          pageSize: 500,
        });
        if (result && result.success && Array.isArray(result.data)) {
          // Normalize comparison by converting to string (ids may be numbers or UUIDs)
          const found = result.data.some(e => {
            const candidateIds = [
              e.id,
              e.eventId,
              e.raw?.eventId,
              e.raw?.id,
              e.bookingId,
              e.rawData?.eventId,
            ].filter(Boolean);
            return candidateIds.map(String).includes(String(eventId));
          });
          setHasPurchasedTicket(found);
        } else {
          setHasPurchasedTicket(false);
        }
      } catch (err) {
        console.error('useRatings.checkPurchased error:', err);
        setHasPurchasedTicket(false);
      }
    };

    checkPurchased();
  }, [eventId]);

  return {
    ratings,
    loading,
    pageNumber,
    setPageNumber,
    pageSize,
    pagination,
    hasPurchasedTicket,
    refreshRatings,
    createNewRating,
    updateExistingRating,
    deleteExistingRating,
  };
};

export default useRatings;
