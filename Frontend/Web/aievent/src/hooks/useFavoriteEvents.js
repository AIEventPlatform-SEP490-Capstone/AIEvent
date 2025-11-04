import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { favoriteEventAPI } from '../api/favoriteEventAPI';
import { useSelector } from 'react-redux';

export const useFavoriteEvents = () => {
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Get favorite events
  const getFavoriteEvents = async (params = {}) => {
    // Only fetch favorite events if user is authenticated
    if (!isAuthenticated) {
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await favoriteEventAPI.getFavoriteEvents(params);
      
      if (response) {
        const eventsData = response.items || response || [];
        setFavoriteEvents(eventsData);
        return eventsData;
      }
      
      return [];
    } catch (err) {
      setError('Không thể tải danh sách sự kiện yêu thích');
      console.error('Error fetching favorite events:', err);
      toast.error('Không thể tải danh sách sự kiện yêu thích');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add event to favorites
  const addFavoriteEvent = async (eventId) => {
    // Only allow adding favorites if user is authenticated
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sự kiện yêu thích');
      return false;
    }
    
    try {
      const response = await favoriteEventAPI.addFavoriteEvent(eventId);
      
      if (response) {
        // Refresh the favorite events list
        await getFavoriteEvents();
        toast.success('Đã thêm vào danh sách yêu thích');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error adding favorite event:', err);
      toast.error('Không thể thêm sự kiện vào danh sách yêu thích');
      return false;
    }
  };

  // Remove event from favorites
  const removeFavoriteEvent = async (eventId) => {
    // Only allow removing favorites if user is authenticated
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sự kiện yêu thích');
      return false;
    }
    
    try {
      const response = await favoriteEventAPI.removeFavoriteEvent(eventId);
      
      if (response) {
        // Refresh the favorite events list
        await getFavoriteEvents();
        toast.success('Đã xóa khỏi danh sách yêu thích');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error removing favorite event:', err);
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
      return await removeFavoriteEvent(eventId);
    } else {
      return await addFavoriteEvent(eventId);
    }
  };

  return {
    favoriteEvents,
    loading,
    error,
    getFavoriteEvents,
    addFavoriteEvent,
    removeFavoriteEvent,
    toggleFavorite
  };
};

export default useFavoriteEvents;