import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { 
  Heart, 
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useCategories } from "../../hooks/useCategories";
import { Input } from "../../components/ui/input";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { useSelector } from "react-redux";
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
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // Ensure favoriteEvents is always an array
  const safeFavoriteEvents = Array.isArray(favoriteEvents) ? favoriteEvents : 
                          (favoriteEvents && Array.isArray(favoriteEvents.items) ? favoriteEvents.items : []);

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

  // Calculate pagination for favorite events
  const totalResults = safeFavoriteEvents.length;
  const totalPageCount = Math.ceil(totalResults / pageSize);
  
  useEffect(() => {
    setTotalPages(Math.max(1, totalPageCount));
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [filters, safeFavoriteEvents.length]);

  // Get paginated events for current page
  const paginatedFavoriteEvents = safeFavoriteEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count active filters
  const activeFilterCount = [
    selectedCategory !== "all",
    locationFilter !== "all",
    dateFilter !== "all",
    priceFilter !== "all"
  ].filter(Boolean).length;

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory("all");
    setLocationFilter("all");
    setDateFilter("all");
    setPriceFilter("all");
    setSearchQuery("");
  };

  // Show loading spinner while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500">Đang tải sự kiện yêu thích...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => getFavoriteEvents()}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl px-6 py-2.5"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 pt-12 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Sự kiện yêu thích
            </h1>
            <p className="text-rose-100 text-lg">
              Danh sách các sự kiện bạn đã lưu
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                placeholder="Tìm kiếm trong sự kiện yêu thích..."
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
                <p className="text-sm text-gray-500">
                  {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc đang áp dụng` : "Lọc sự kiện yêu thích"}
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showFilters ? 'bg-rose-100' : 'bg-gray-100'}`}>
                {showFilters ? (
                  <ChevronUp className="w-5 h-5 text-rose-600" />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Danh mục
                </label>
                <div className="flex flex-wrap gap-2">
                  {displayCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600'
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
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Địa điểm
                </label>
                <div className="flex flex-wrap gap-2">
                  {(showAllLocations ? locationFilters : locationFilters.slice(0, 6)).map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setLocationFilter(filter.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        locationFilter === filter.value
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600'
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
            </div>
          )}
        </div>

        {/* Results Header */}
        {safeFavoriteEvents.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">{totalResults}</span> sự kiện yêu thích
              </h2>
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                Trang <span className="font-semibold text-gray-700">{currentPage}</span> / {totalPages}
              </div>
            )}
          </div>
        )}

        {/* Events Grid */}
        {paginatedFavoriteEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {paginatedFavoriteEvents.map((event) => (
                <EventCard
                  key={event.eventId || event.id}
                  event={event}
                  isLiked={true}
                  onLike={handleRemoveFavorite}
                  onViewDetail={handleViewDetail}
                  showReason={false}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isCurrentPage = pageNum === currentPage;
                      const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;
                      const isFirst = pageNum === 1;
                      const isLast = pageNum === totalPages;

                      if (!isCurrentPage && !isNearCurrent && !isFirst && !isLast) {
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="px-1 text-gray-400">•••</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-all ${
                            isCurrentPage
                              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || selectedCategory !== "all" 
                ? "Không tìm thấy sự kiện" 
                : "Chưa có sự kiện yêu thích"}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              {searchQuery || selectedCategory !== "all" 
                ? "Thử thay đổi bộ lọc để tìm sự kiện phù hợp" 
                : "Khám phá và thêm sự kiện vào danh sách yêu thích của bạn"}
            </p>
            {(searchQuery || selectedCategory !== "all") ? (
              <Button
                onClick={resetFilters}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl px-6 py-2.5 hover:shadow-lg hover:shadow-rose-200 transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Đặt lại bộ lọc
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/search')}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl px-6 py-2.5 hover:shadow-lg hover:shadow-rose-200 transition-all"
              >
                <Search className="w-4 h-4 mr-2" />
                Khám phá sự kiện
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteEventsPage;