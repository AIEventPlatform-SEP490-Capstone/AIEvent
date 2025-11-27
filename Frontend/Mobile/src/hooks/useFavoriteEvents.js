import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchFavoriteEvents, 
  addFavoriteEvent, 
  removeFavoriteEvent,
  selectFavoriteEvents,
  selectFavoriteEventsLoading,
  selectFavoriteEventsError
} from '../redux/slices/favoriteEventsSlice';

export const useFavoriteEvents = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const favoriteEvents = useSelector(selectFavoriteEvents);
  const loading = useSelector(selectFavoriteEventsLoading);
  const error = useSelector(selectFavoriteEventsError);
  
  // Functions
  const getFavoriteEvents = useCallback(async (params = {}) => {
    try {
      const result = await dispatch(fetchFavoriteEvents(params)).unwrap();
      return result;
    } catch (err) {
      console.error('Error fetching favorite events:', err);
      throw err;
    }
  }, [dispatch]);
  
  const addFavoriteEventHandler = useCallback(async (eventId) => {
    try {
      const result = await dispatch(addFavoriteEvent(eventId)).unwrap();
      // Refresh the favorite events list after adding
      await dispatch(fetchFavoriteEvents()).unwrap();
      return result;
    } catch (err) {
      console.error('Error adding favorite event:', err);
      throw err;
    }
  }, [dispatch]);
  
  const removeFavoriteEventHandler = useCallback(async (eventId) => {
    try {
      const result = await dispatch(removeFavoriteEvent(eventId)).unwrap();
      // Refresh the favorite events list after removing
      await dispatch(fetchFavoriteEvents()).unwrap();
      return result;
    } catch (err) {
      console.error('Error removing favorite event:', err);
      throw err;
    }
  }, [dispatch]);
  
  // Toggle favorite status
  const toggleFavorite = useCallback(async (eventId, isCurrentlyFavorite) => {
    if (isCurrentlyFavorite) {
      return await removeFavoriteEventHandler(eventId);
    } else {
      return await addFavoriteEventHandler(eventId);
    }
  }, [addFavoriteEventHandler, removeFavoriteEventHandler]);
  
  return {
    favoriteEvents,
    loading,
    error,
    getFavoriteEvents,
    addFavoriteEvent: addFavoriteEventHandler,
    removeFavoriteEvent: removeFavoriteEventHandler,
    toggleFavorite
  };
};