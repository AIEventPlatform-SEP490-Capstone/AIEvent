import {useState, useEffect, useCallback} from 'react';
import RatingService from '../api/services/RatingService';
import BookingService from '../api/services/BookingService';
import AuthService from '../api/services/AuthService';
import { isStaffUser } from '../utils/jwtUtils';
import {useSelector} from 'react-redux';

export const useRatings = (eventId, initialPageSize = 5) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [pagination, setPagination] = useState(null);
  const [hasPurchasedTicket, setHasPurchasedTicket] = useState(false);
  
  // Get auth state from Redux
  const auth = useSelector(state => state.auth || {});
  const isLoggedIn = !!auth.isLoggedIn;
  const accessToken = auth.accessToken || null;

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
  }, [eventId, pageNumber]); // Remove loadRatings from dependencies to prevent infinite loops

  // Check if current user has purchased ticket for this event
  useEffect(() => {
    let isMounted = true;
    
    const checkPurchased = async () => {
      // Reset purchased ticket status when eventId changes or user logs out
      if (isMounted) {
        setHasPurchasedTicket(false);
      }
      
      if (!eventId || !isLoggedIn) {
        return;
      }
      
      // Check if user is staff - staff users don't have access to booked events
      try {
        const token = accessToken || await AuthService.getAccessToken();
        // Handle case where token is null/undefined after logout
        if (!token) {
          return;
        }
        
        const isStaff = isStaffUser(token);
        if (isStaff) {
          return;
        }
      } catch (error) {
        console.error('Error checking user role:', error);
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
          if (isMounted) {
            setHasPurchasedTicket(found);
          }
        }
      } catch (err) {
        console.error('useRatings.checkPurchased error:', err);
      }
    };

    checkPurchased();
    
    return () => {
      isMounted = false;
    };
  }, [eventId, isLoggedIn, accessToken]); // Add auth-related dependencies

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