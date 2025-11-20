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

export const useHomepageEvents = (initialPage = 1, pageSize = 6) => {
  const [allEvents, setAllEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const { getEvents } = useEvents();

  const loadEvents = async (page = currentPage, category = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare API parameters
      const params = {
        pageNumber: page,
        pageSize: pageSize
      };
      
      // Add category filter if not "all"
      if (category !== "all") {
        params.eventCategoryId = category;
      }
      
      // Fetch events from API
      const response = await getEvents(params);
      
      if (response) {
        const eventsData = response.items || response || [];
        const totalCount = response.totalCount || response.totalItems || eventsData.length;
        
        setAllEvents(eventsData);
        setTotalCount(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
        setCurrentPage(page);
        
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
    loadEvents(currentPage);
  }, [currentPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    allEvents,
    recommendedEvents,
    loading,
    error,
    refreshEvents: () => loadEvents(currentPage),
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    loadEvents // Expose loadEvents to allow filtering
  };
};

export default useHomepageEvents;