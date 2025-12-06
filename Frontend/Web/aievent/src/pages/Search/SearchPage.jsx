import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Heart,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useEvents } from "../../hooks/useEvents";
import { useCategories } from "../../hooks/useCategories";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useSelector } from "react-redux";
import { SaleStatusBadge } from "../../components/HomePage/SaleStatusBadge";
import { EventCard } from "../../components/HomePage/EventCard";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getEvents, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading, refreshCategories } = useCategories();
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [events, setEvents] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState(new Set());

  // Fetch favorite events only when user is authenticated
  useEffect(() => {
    const loadFavoriteEvents = async () => {
      // Only load favorite events if user is authenticated
      if (isAuthenticated) {
        try {
          const favorites = await getFavoriteEvents();
          const favoriteIds = new Set(favorites.map(event => event.eventId));
          setFavoriteEvents(favoriteIds);
        } catch (err) {
          console.error("Error loading favorite events:", err);
        }
      } else {
        // Clear favorite events if user is not authenticated
        setFavoriteEvents(new Set());
      }
    };
    
    loadFavoriteEvents();
  }, [isAuthenticated]);

  // Fetch categories once on component mount
  useEffect(() => {
    refreshCategories();
    
    // Set initial search query from URL params
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(decodeURIComponent(query));
    }
  }, []);

  // Create filter object with useMemo to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    searchQuery,
    selectedCategory,
    priceFilter,
    locationFilter,
    dateFilter
  }), [searchQuery, selectedCategory, priceFilter, locationFilter, dateFilter]);

  // Fetch events when filters change
  useEffect(() => {
    let isMounted = true;
    
    const fetchEventsData = async () => {
      try {
        const params = {
          pageNumber: 1,
          pageSize: 50
        };
        
        // Add search query if present
        if (filters.searchQuery) {
          params.search = filters.searchQuery;
        }
        
        // Add category filter if not "all"
        if (filters.selectedCategory !== "all") {
          params.eventCategoryId = filters.selectedCategory;
        }
        
        // Add price filter if not "all"
        if (filters.priceFilter !== "all") {
          params.ticketType = filters.priceFilter === "free" ? "free" : "paid"; // "free" = Free, "paid" = Paid
        }
        
        // Add district filter if not "all"
        if (filters.locationFilter !== "all") {
          params.district = filters.locationFilter;
        }
        
        // Add date filter if not "all"
        if (filters.dateFilter !== "all") {
          // Map frontend filter values to backend enum values
          const timeLineMap = {
            "today": "Today",
            "tomorrow": "Tomorrow",
            "this_week": "ThisWeek",
            "this_month": "ThisMonth"
          };
          params.timeLine = timeLineMap[filters.dateFilter] || filters.dateFilter;
        }
        
        const response = await getEvents(params);
        
        // Handle different response structures
        let eventData = [];
        if (response && response.data && response.data.items) {
          eventData = response.data.items;
        } else if (response && response.items) {
          eventData = response.items;
        } else if (response && Array.isArray(response)) {
          eventData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          eventData = response.data;
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          setEvents(eventData);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        if (isMounted) {
          setEvents([]);
        }
      }
    };
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchEventsData();
    }, 300);
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [filters]);

  const handleViewDetail = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const toggleLike = async (eventId) => {
    // Only allow toggling favorites if user is authenticated
    if (!isAuthenticated) {
      // Optionally redirect to login or show a message
      return;
    }
    
    try {
      const isCurrentlyLiked = favoriteEvents.has(eventId);
      
      // Update UI immediately for better UX
      const newFavoriteEvents = new Set(favoriteEvents);
      if (isCurrentlyLiked) {
        newFavoriteEvents.delete(eventId);
      } else {
        newFavoriteEvents.add(eventId);
      }
      setFavoriteEvents(newFavoriteEvents);
      
      // Call API to update server
      if (isCurrentlyLiked) {
        await removeFavoriteEvent(eventId);
      } else {
        await addFavoriteEvent(eventId);
      }
    } catch (err) {
      // Revert UI change if API call fails
      const newFavoriteEvents = new Set(favoriteEvents);
      if (favoriteEvents.has(eventId)) {
        newFavoriteEvents.delete(eventId);
      } else {
        newFavoriteEvents.add(eventId);
      }
      setFavoriteEvents(newFavoriteEvents);
      
      console.error("Error toggling favorite:", err);
    }
  };

  const formatPrice = (event) => {
    const price = event.ticketPrice || 0;
    
    if (price === 0) {
      return "0đ";
    }
    
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const priceFilters = [
    { value: "all", label: "Tất cả" },
    { value: "free", label: "Miễn phí" },
    { value: "paid", label: "Có phí" },
  ];

  const allLocationFilters = [
    { value: "all", label: "Tất cả quận" },
    { value: "Quận 1", label: "Quận 1" },
    { value: "Quận 2", label: "Quận 2" },
    { value: "Quận 3", label: "Quận 3" },
    { value: "Quận 4", label: "Quận 4" },
    { value: "Quận 5", label: "Quận 5" },
    { value: "Quận 6", label: "Quận 6" },
    { value: "Quận 7", label: "Quận 7" },
    { value: "Quận 8", label: "Quận 8" },
    { value: "Quận 9", label: "Quận 9" },
    { value: "Quận 10", label: "Quận 10" },
    { value: "Quận 11", label: "Quận 11" },
    { value: "Quận 12", label: "Quận 12" },
    { value: "Thủ Đức", label: "Thủ Đức" },
    { value: "Bình Thạnh", label: "Bình Thạnh" },
    { value: "Phú Nhuận", label: "Phú Nhuận" },
    { value: "Tân Bình", label: "Tân Bình" },
    { value: "Gò Vấp", label: "Gò Vấp" },
    { value: "Bình Tân", label: "Bình Tân" },
  ];

  const dateFilters = [
    { value: "all", label: "Tất cả thời gian" },
    { value: "today", label: "Hôm nay" },
    { value: "tomorrow", label: "Ngày mai" },
    { value: "this_week", label: "Tuần này" },
    { value: "this_month", label: "Tháng này" },
  ];

  // Prepare categories for display with fallback
  const displayCategories = categories && categories.length > 0 
    ? [
        { id: "all", name: "Tất cả" },
        ...categories
          .filter(cat => {
            // Check for valid category ID and name using various possible property names
            const categoryId = cat.eventCategoryId || cat.id || cat.EventCategoryId;
            const categoryName = cat.eventCategoryName || cat.EventCategoryName || cat.name;
            return categoryId && categoryName;
          })
          .map(cat => ({ 
            id: cat.eventCategoryId || cat.id || cat.EventCategoryId, 
            name: cat.eventCategoryName || cat.EventCategoryName || cat.name || "Không có tên"
          }))
      ]
     : [
        { id: "all", name: "Tất cả" },
        { id: "Technology", name: "Công nghệ" },
        { id: "Music", name: "Âm nhạc" },
        { id: "Networking", name: "Giao lưu" },
        { id: "Workshop", name: "Workshop" },
        { id: "Conference", name: "Hội nghị" }
      ];

  // Move selected location to the top of the list
  const getLocationFilters = () => {
    if (locationFilter === "all") {
      return allLocationFilters;
    }
    
    const selected = allLocationFilters.find(loc => loc.value === locationFilter);
    const others = allLocationFilters.filter(loc => loc.value !== locationFilter);
    
    if (selected) {
      return [selected, ...others];
    }
    
    return allLocationFilters;
  };
  
  const locationFilters = getLocationFilters();
  
  // Function to get category name by ID or name
  const getCategoryName = (event) => {
    // Events have EventCategoryName directly
    if (event.eventCategoryName) {
      return event.eventCategoryName;
    }
    
    // If event has a category ID, try to find the name in our categories list
    const categoryId = event.eventCategoryId || event.category || event.EventCategoryId;
    if (categoryId) {
      const category = categories.find(cat => 
        (cat.eventCategoryId && cat.eventCategoryId.toString() === categoryId.toString()) ||
        (cat.id && cat.id.toString() === categoryId.toString()) ||
        (cat.EventCategoryId && cat.EventCategoryId.toString() === categoryId.toString())
      );
      
      if (category) {
        return category.eventCategoryName || category.EventCategoryName || category.name || "Không có tên";
      }
    }
    
    // Fallback
    return "Khác";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Tìm kiếm sự kiện</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Tìm kiếm theo tên sự kiện, mô tả, địa điểm..."
            className="pl-12 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-0 hover:bg-transparent"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Bộ lọc:</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>

          {showFilters && (
            <>
              {/* Category Filter */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Danh mục:</span>
                <div className="flex flex-wrap gap-2">
                  {displayCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Filter
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Giá vé:</span>
                <div className="flex gap-2">
                  {priceFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={priceFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriceFilter(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div> */}

              {/* Location Filter */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Địa điểm:</span>
                <div className="flex gap-2 flex-wrap">
                  {(showAllLocations ? locationFilters : locationFilters.slice(0, 5)).map((filter) => (
                    <Button
                      key={filter.value}
                      variant={locationFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLocationFilter(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                  {locationFilters.length > 5 && !showAllLocations && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllLocations(true)}
                    >
                      +{locationFilters.length - 5}
                    </Button>
                  )}
                  {showAllLocations && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllLocations(false)}
                    >
                      Thu gọn
                    </Button>
                  )}
                </div>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Thời gian:</span>
                <div className="flex gap-2">
                  {dateFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={dateFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateFilter(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-muted-foreground">
          {(eventsLoading || categoriesLoading) ? (
            "Đang tải sự kiện..."
          ) : (
            <>Tìm thấy {events.length} sự kiện{searchQuery && ` cho "${searchQuery}"`}</>
          )}
        </p>
      </div>

      {/* Loading State */}
      {(eventsLoading || categoriesLoading) && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Event Grid */}
      {!(eventsLoading || categoriesLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.eventId || event.id}
              event={event}
              isLiked={favoriteEvents.has(event.eventId || event.id)}
              onLike={toggleLike}
              onViewDetail={handleViewDetail}
              showReason={false}
            />
          ))}
        </div>
      )}

      {!(eventsLoading || categoriesLoading) && events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Không tìm thấy sự kiện nào phù hợp với tiêu chí tìm kiếm</p>
        </div>
      )}
    </div>
  );
}