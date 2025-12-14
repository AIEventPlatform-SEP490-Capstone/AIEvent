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
  ChevronDown,
  ChevronLeft,
  ChevronRight
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
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [ticketSaleStatus, setTicketSaleStatus] = useState("all");
  const [eventProgressStatus, setEventProgressStatus] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("NearestTime");
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [events, setEvents] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const pageSize = 12;

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
    locationFilter,
    dateFilter,
    ticketSaleStatus,
    eventProgressStatus,
    minPrice,
    maxPrice,
    sortBy
  }), [searchQuery, selectedCategory, locationFilter, dateFilter, ticketSaleStatus, eventProgressStatus, minPrice, maxPrice, sortBy]);

  // Fetch events when filters change or page changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchEventsData = async () => {
      try {
        const params = {
          pageNumber: currentPage,
          pageSize: pageSize
        };
        
        // Add search query if present
        if (filters.searchQuery) {
          params.search = filters.searchQuery;
        }
        
        // Add category filter if not "all"
        if (filters.selectedCategory !== "all") {
          params.eventCategoryId = filters.selectedCategory;
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
        
        // Add ticket sale status filter if not "all"
        if (filters.ticketSaleStatus !== "all") {
          params.ticketSaleStatus = filters.ticketSaleStatus;
        }
        
        // Add event progress status filter if not "all"
        if (filters.eventProgressStatus !== "all") {
          params.eventProgressStatus = filters.eventProgressStatus;
        }
        
        // Add price range filters
        if (filters.minPrice !== "" && !isNaN(parseFloat(filters.minPrice))) {
          params.minPrice = parseFloat(filters.minPrice);
        }
        if (filters.maxPrice !== "" && !isNaN(parseFloat(filters.maxPrice))) {
          params.maxPrice = parseFloat(filters.maxPrice);
        }
        
        // Add sort by
        if (filters.sortBy) {
          params.sortBy = filters.sortBy;
        }
        
        const response = await getEvents(params);
        
        // Handle different response structures
        let eventData = [];
        let total = 0;
        let pages = 1;
        
        if (response && response.data && response.data.items) {
          eventData = response.data.items;
          total = response.data.totalRecords || response.data.items.length;
          pages = Math.ceil(total / pageSize);
        } else if (response && response.items) {
          eventData = response.items;
          total = response.totalRecords || response.items.length;
          pages = Math.ceil(total / pageSize);
        } else if (response && Array.isArray(response)) {
          eventData = response;
          total = response.length;
          pages = Math.ceil(total / pageSize);
        } else if (response && response.data && Array.isArray(response.data)) {
          eventData = response.data;
          total = eventData.length;
          pages = Math.ceil(total / pageSize);
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          setEvents(eventData);
          setTotalResults(total);
          setTotalPages(Math.max(1, pages));
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
  }, [filters, currentPage, pageSize]);

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

  const ticketSaleStatusFilters = [
    { value: "all", label: "Tất cả" },
    { value: "NotStarted", label: "Chưa mở bán" },
    { value: "OnSale", label: "Đang bán" },
    { value: "SaleEnded", label: "Hết vé" },
  ];

  const eventProgressStatusFilters = [
    { value: "all", label: "Tất cả" },
    { value: "Upcoming", label: "Sắp diễn ra" },
    { value: "Ongoing", label: "Đang diễn ra" },
    { value: "Ended", label: "Đã kết thúc" },
  ];

  const sortByOptions = [
    { value: "NearestTime", label: "Gần nhất" },
    { value: "LatestTime", label: "Mới nhất" },
    { value: "LowestPrice", label: "Giá thấp nhất" },
    { value: "HighestPrice", label: "Giá cao nhất" },
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <div className="flex gap-2 flex-wrap">
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

              {/* Ticket Sale Status Filter */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Trạng thái vé:</span>
                <div className="flex gap-2 flex-wrap">
                  {ticketSaleStatusFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={ticketSaleStatus === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTicketSaleStatus(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Event Progress Status Filter */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Trạng thái sự kiện:</span>
                <div className="flex gap-2 flex-wrap">
                  {eventProgressStatusFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={eventProgressStatus === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEventProgressStatus(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Khoảng giá (VNĐ):</span>
                <div className="flex gap-2 items-center flex-wrap">
                  <Input
                    type="number"
                    placeholder="Giá tối thiểu"
                    className="w-36 h-9"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Giá tối đa"
                    className="w-36 h-9"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
                <div className="flex gap-2 flex-wrap">
                  {sortByOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={sortBy === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-6">
        <p className="text-muted-foreground font-medium">
          {(eventsLoading || categoriesLoading) ? (
            "Đang tải sự kiện..."
          ) : (
            <>Tìm thấy <span className="text-blue-600 font-bold">{totalResults}</span> sự kiện{searchQuery && ` cho "${searchQuery}"`}{totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}</>
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

      {/* Pagination */}
      {!(eventsLoading || categoriesLoading) && totalPages > 1 && (
        <div className="flex justify-center items-center mt-12 mb-8 space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Trước
          </Button>
          
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            if (
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNumber}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === pageNumber
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {pageNumber}
                </Button>
              );
            }
            
            if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
              return <span key={pageNumber} className="px-2 text-gray-400 font-semibold">…</span>;
            }
            
            return null;
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {!(eventsLoading || categoriesLoading) && events.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
          <p className="text-gray-600">Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc của bạn</p>
        </div>
      )}
    </div>
  );
}