import { useState, useEffect } from 'react';
import { useEvents } from './useEvents';

const getRecommendedEvents = (allEvents) => {
  // Mock AI recommendations based on user interests
  // In a real implementation, this would be replaced with actual AI logic
  return allEvents
    .filter((event) => {
      // Simple filter for demo purposes
      const categoryName = event.category || event.eventCategoryName;
      return ["Technology", "Music", "Networking"].includes(categoryName);
    })
    .slice(0, 6);
};

export const useHomepageEvents = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { getEvents } = useEvents();

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch events from API
      const response = await getEvents({
        pageNumber: 1,
        pageSize: 20,
      });
      
      if (response) {
        const eventsData = response.items || response || [];
        setAllEvents(eventsData);
        
        // Set recommended events
        const recommended = getRecommendedEvents(eventsData);
        setRecommendedEvents(recommended);
      }
    } catch (err) {
      setError("Không thể tải danh sách sự kiện");
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  return {
    allEvents,
    recommendedEvents,
    loading,
    error,
    refreshEvents: loadEvents
  };
};

export default useHomepageEvents;