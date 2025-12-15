import { useState, useEffect, useRef } from 'react';
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
  const [filters, setFilters] = useState({
    selectedCategory: 'all',
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    eventProgressStatus: 'all',
    ticketSaleStatus: 'all',
    sortBy: 'LatestTime'
  });
  
  const { getEvents } = useEvents();

  const loadEvents = async (page = currentPage, newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update filters
      if (newFilters !== filters) {
        setFilters(newFilters);
      }
      
      // Prepare API parameters
      const params = {
        pageNumber: page,
        pageSize: pageSize
      };
      
      // Add search query if present
      if (newFilters.searchQuery) {
        params.search = newFilters.searchQuery;
      }
      
      // Add category filter if not "all"
      if (newFilters.selectedCategory !== "all") {
        params.eventCategoryId = newFilters.selectedCategory;
      }
      
      // Add price range filters
      if (newFilters.minPrice !== '' && !isNaN(parseFloat(newFilters.minPrice))) {
        params.minPrice = parseFloat(newFilters.minPrice);
      }
      if (newFilters.maxPrice !== '' && !isNaN(parseFloat(newFilters.maxPrice))) {
        params.maxPrice = parseFloat(newFilters.maxPrice);
      }
      
      // Add event progress status filter
      if (newFilters.eventProgressStatus !== 'all') {
        params.eventProgressStatus = newFilters.eventProgressStatus;
      }
      
      // Add ticket sale status filter
      if (newFilters.ticketSaleStatus !== 'all') {
        params.ticketSaleStatus = newFilters.ticketSaleStatus;
      }
      
      // Add sort by
      if (newFilters.sortBy) {
        params.sortBy = newFilters.sortBy;
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

  // Load events on mount only
  useEffect(() => {
    loadEvents(1, filters);
  }, []);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadEvents(page, filters);
    }
  };

  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadEvents(1, updatedFilters); // Reset to page 1 when filters change
  };

  return {
    allEvents,
    recommendedEvents,
    loading,
    error,
    refreshEvents: () => loadEvents(currentPage, filters),
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    loadEvents,
    filters,
    updateFilters
  };
};

export default useHomepageEvents;