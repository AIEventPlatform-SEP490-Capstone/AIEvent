import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  Search, 
  Filter, 
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  RotateCcw
} from "lucide-react";
import { useEvents } from "../../hooks/useEvents";
import { useCategories } from "../../hooks/useCategories";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useSelector } from "react-redux";
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
  const [sortBy, setSortBy] = useState("LatestTime");
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, locationFilter, dateFilter, ticketSaleStatus, eventProgressStatus, minPrice, maxPrice, sortBy]);

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
        
        let eventData = [];
        let total = 0;
        let pages = 1;
        
        if (response && response.items) {
          // Paginated response: { items: [], totalRecords: N, totalPages: N }
          eventData = response.items;
          total = response.totalRecords || response.totalCount || response.total || response.items.length;
          pages = response.totalPages || Math.ceil(total / pageSize);
        } else if (response && Array.isArray(response)) {
          // Array response (no pagination info from API)
          eventData = response;
          total = response.length;
          pages = Math.ceil(total / pageSize);
        } else if (response && response.data && response.data.items) {
          // Nested data structure
          eventData = response.data.items;
          total = response.data.totalRecords || response.data.totalCount || response.data.items.length;
          pages = response.data.totalPages || Math.ceil(total / pageSize);
        } else if (response && response.data && Array.isArray(response.data)) {
          eventData = response.data;
          total = response.totalRecords || response.totalCount || eventData.length;
          pages = response.totalPages || Math.ceil(total / pageSize);
        }

        if (isMounted) {
          setEvents(eventData);
          setTotalResults(total);
          setTotalPages(Math.max(1, pages));
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        if (isMounted) {
          setEvents([]);
          setTotalResults(0);
          setTotalPages(1);
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

  // Format number with thousand separators (e.g., 100000 -> 100.000)
  const formatNumberInput = (value) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('vi-VN').format(numericValue);
  };

  // Parse formatted number back to raw number (e.g., 100.000 -> 100000)
  const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return '';
    return formattedValue.replace(/\./g, '');
  };

  // Handle price input change
  const handlePriceInputChange = (setter, value) => {
    const rawValue = parseFormattedNumber(value);
    setter(rawValue);
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

  // Count active filters
  const activeFilterCount = [
    selectedCategory !== "all",
    locationFilter !== "all",
    dateFilter !== "all",
    ticketSaleStatus !== "all",
    eventProgressStatus !== "all",
    minPrice !== "",
    maxPrice !== ""
  ].filter(Boolean).length;

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory("all");
    setLocationFilter("all");
    setDateFilter("all");
    setTicketSaleStatus("all");
    setEventProgressStatus("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("LatestTime");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 pt-12 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Khám phá sự kiện
            </h1>
            <p className="text-blue-100 text-lg">
              Tìm kiếm và tham gia những sự kiện hấp dẫn nhất
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                placeholder="Tìm kiếm theo tên sự kiện, mô tả, địa điểm..."
                className="pl-14 pr-5 h-14 text-lg rounded-2xl border-0 shadow-xl bg-white/95 backdrop-blur-sm focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8">
        {/* Filter Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          {/* Filter Header */}
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                <p className="text-sm text-gray-500">
                  {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc đang áp dụng` : "Tùy chỉnh kết quả tìm kiếm"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                  className="text-gray-500 hover:text-red-500"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Đặt lại
                </Button>
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showFilters ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {showFilters ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>
          </div>

          {/* Filter Content */}
          {showFilters && (
            <div className="border-t border-gray-100 p-5 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
              {/* Category Filter */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Danh mục
                </label>
                <div className="flex flex-wrap gap-2">
                  {displayCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Địa điểm
                </label>
                <div className="flex flex-wrap gap-2">
                  {(showAllLocations ? locationFilters : locationFilters.slice(0, 6)).map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setLocationFilter(filter.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        locationFilter === filter.value
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                  {locationFilters.length > 6 && (
                    <button
                      onClick={() => setShowAllLocations(!showAllLocations)}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                    >
                      {showAllLocations ? 'Thu gọn' : `+${locationFilters.length - 6}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Date Filter */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Thời gian
                </label>
                <div className="flex flex-wrap gap-2">
                  {dateFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setDateFilter(filter.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        dateFilter === filter.value
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Layout for Status Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ticket Sale Status */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Trạng thái vé
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ticketSaleStatusFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setTicketSaleStatus(filter.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          ticketSaleStatus === filter.value
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Progress Status */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    Trạng thái sự kiện
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eventProgressStatusFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setEventProgressStatus(filter.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          eventProgressStatus === filter.value
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-200'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-cyan-300 hover:text-cyan-600'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Range & Sort */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Khoảng giá (VNĐ)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="text"
                      placeholder="Từ"
                      className="h-11 rounded-xl border-gray-200 focus:border-rose-300 focus:ring-rose-200"
                      value={formatNumberInput(minPrice)}
                      onChange={(e) => handlePriceInputChange(setMinPrice, e.target.value)}
                    />
                    <span className="text-gray-400 font-medium">—</span>
                    <Input
                      type="text"
                      placeholder="Đến"
                      className="h-11 rounded-xl border-gray-200 focus:border-rose-300 focus:ring-rose-200"
                      value={formatNumberInput(maxPrice)}
                      onChange={(e) => handlePriceInputChange(setMaxPrice, e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Sắp xếp theo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sortByOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          sortBy === option.value
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            {(eventsLoading || categoriesLoading) ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-gray-600">Đang tìm kiếm...</span>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Tìm thấy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{totalResults}</span> sự kiện
                </h2>
                {searchQuery && (
                  <p className="text-gray-500 text-sm mt-1">Kết quả cho "{searchQuery}"</p>
                )}
              </div>
            )}
          </div>
          {totalPages > 1 && !eventsLoading && (
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              Trang <span className="font-semibold text-gray-700">{currentPage}</span> / {totalPages}
            </div>
          )}
        </div>

        {/* Loading State */}
        {(eventsLoading || categoriesLoading) && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 animate-pulse">
              <Search className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-500">Đang tải sự kiện...</p>
          </div>
        )}

        {/* Event Grid */}
        {!(eventsLoading || categoriesLoading) && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="flex justify-center items-center mt-12 mb-8">
            <div className="inline-flex items-center gap-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-all ${
                          currentPage === pageNumber
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                  
                  if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={pageNumber} className="px-1 text-gray-400">•••</span>;
                  }
                  
                  return null;
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!(eventsLoading || categoriesLoading) && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc để tìm được sự kiện phù hợp
            </p>
            <Button
              onClick={resetFilters}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-6 py-2.5 hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Đặt lại bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}