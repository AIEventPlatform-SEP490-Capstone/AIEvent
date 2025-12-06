import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Clock, 
  Filter,
  Search,
  X,
  Sparkles,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useCategories } from "../../hooks/useCategories"; // Add this import
import { Input } from "../../components/ui/input";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { useSelector } from "react-redux";
import { SaleStatusBadge } from "../../components/HomePage/SaleStatusBadge";
import { EventCard } from "../../components/HomePage/EventCard";

const FavoriteEventsPage = () => {
  const navigate = useNavigate();
  const { favoriteEvents, loading, error, getFavoriteEvents } = useFavoriteEvents();
  const { categories, loading: categoriesLoading, refreshCategories } = useCategories(); // Add categories hook
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Ensure favoriteEvents is always an array
  const safeFavoriteEvents = Array.isArray(favoriteEvents) ? favoriteEvents : 
                          (favoriteEvents && Array.isArray(favoriteEvents.items) ? favoriteEvents.items : []);

  // Fetch categories once on component mount
  useEffect(() => {
    refreshCategories();
  }, []);

  // Fetch categories once on component mount
  useEffect(() => {
    refreshCategories();
  }, []);

  // If user is not authenticated, redirect to login page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, navigate]);

  const handleViewDetail = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleRemoveFavorite = async (eventId) => {
    // Remove the event from favorites
    await removeFavoriteEvent(eventId);
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

  // Prepare categories for display with fallback (same as SearchPage.jsx)
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

  // Define filter options
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

  // Create filter object with useMemo to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    searchQuery,
    selectedCategory,
    priceFilter,
    locationFilter,
    dateFilter
  }), [searchQuery, selectedCategory, priceFilter, locationFilter, dateFilter]);

  // Fetch favorite events when filters change
  useEffect(() => {
    let isMounted = true;
    
    const fetchFavoriteEventsData = async () => {
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
        
        const response = await getFavoriteEvents(params);
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Update the favorite events in Redux store
        }
      } catch (error) {
        console.error("Error fetching favorite events:", error);
      }
    };
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchFavoriteEventsData();
    }, 300);
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [filters]);

  // For display purposes, we'll use the already filtered events from Redux
  const filteredEvents = safeFavoriteEvents;

  // Show loading spinner while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading || categoriesLoading) { // Add categoriesLoading check
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => getFavoriteEvents()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Sự kiện yêu thích</h1>
        <p className="text-muted-foreground">
          Danh sách các sự kiện bạn đã lưu vào danh sách yêu thích
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Tìm kiếm sự kiện yêu thích..."
            className="pl-12 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
                {displayCategories.map((category) => ( // Use displayCategories instead of categories derived from events
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

      {/* Results Info */}
      <div className="mb-6">
        <p className="text-muted-foreground">
          {filteredEvents.length} sự kiện yêu thích
          {searchQuery && ` cho "${searchQuery}"`}
        </p>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.eventId} onClick={() => handleViewDetail(event.eventId)}>
              <EventCard
                event={event}
                isLiked={true}
                onLike={handleRemoveFavorite}
                onViewDetail={handleViewDetail}
                showReason={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Chưa có sự kiện yêu thích</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedCategory !== "all" || priceFilter !== "all" || locationFilter !== "all" || dateFilter !== "all"
              ? "Không tìm thấy sự kiện yêu thích phù hợp với tiêu chí tìm kiếm" 
              : "Hãy khám phá các sự kiện và lưu vào danh sách yêu thích"}
          </p>
          {!searchQuery && selectedCategory === "all" && priceFilter === "all" && locationFilter === "all" && dateFilter === "all" && (
            <Button onClick={() => navigate("/search")}>
              Khám phá sự kiện
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FavoriteEventsPage;