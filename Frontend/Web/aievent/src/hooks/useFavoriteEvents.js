import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  fetchFavoriteEvents,
  addFavoriteEvent,
  removeFavoriteEvent,
  selectFavoriteEvents,
  selectFavoriteEventsLoading,
  selectFavoriteEventsError
} from '../store/slices/favoriteEventsSlice';
import { useSelector as useAuthSelector } from 'react-redux';

export const useFavoriteEvents = () => {
  const dispatch = useDispatch();
  const favoriteEvents = useSelector(selectFavoriteEvents);
  const loading = useSelector(selectFavoriteEventsLoading);
  const error = useSelector(selectFavoriteEventsError);
  const { isAuthenticated } = useAuthSelector((state) => state.auth);

  // Automatically fetch favorite events when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavoriteEvents());
    }
  }, [isAuthenticated, dispatch]);

  // Get favorite events
  const getFavoriteEvents = async (params = {}) => {
    // Only fetch favorite events if user is authenticated
    if (!isAuthenticated) {
      return [];
    }
    
    try {
      const result = await dispatch(fetchFavoriteEvents(params)).unwrap();
      // Ensure we always return an array
      return Array.isArray(result) ? result : [];
    } catch (err) {
      toast.error('Không thể tải danh sách sự kiện yêu thích');
      return [];
    }
  };

  // Add event to favorites
  const addFavoriteEventHandler = async (eventId) => {
    // Only allow adding favorites if user is authenticated
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sự kiện yêu thích');
      return false;
    }
    
    try {
      await dispatch(addFavoriteEvent(eventId)).unwrap();
      toast.success('Đã thêm vào danh sách yêu thích');
      return true;
    } catch (err) {
      toast.error('Không thể thêm sự kiện vào danh sách yêu thích');
      return false;
    }
  };

  // Remove event from favorites
  const removeFavoriteEventHandler = async (eventId) => {
    // Only allow removing favorites if user is authenticated
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sự kiện yêu thích');
      return false;
    }
    
    try {
      await dispatch(removeFavoriteEvent(eventId)).unwrap();
      toast.success('Bỏ yêu thích sự kiện thành công');
      return true;
    } catch (err) {
      toast.error('Không thể xóa sự kiện khỏi danh sách yêu thích');
      return false;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (eventId, isCurrentlyFavorite) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sự kiện yêu thích');
      return false;
    }
    
    if (isCurrentlyFavorite) {
      return await removeFavoriteEventHandler(eventId);
    } else {
      return await addFavoriteEventHandler(eventId);
    }
  };

  // Ensure favoriteEvents is always an array
  const safeFavoriteEvents = Array.isArray(favoriteEvents) ? favoriteEvents : [];

  return {
    favoriteEvents: safeFavoriteEvents,
    loading,
    error,
    getFavoriteEvents,
    addFavoriteEvent: addFavoriteEventHandler,
    removeFavoriteEvent: removeFavoriteEventHandler,
    toggleFavorite
  };
};

export default useFavoriteEvents;