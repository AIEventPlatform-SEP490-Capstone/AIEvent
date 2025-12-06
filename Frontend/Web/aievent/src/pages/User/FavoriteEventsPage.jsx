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
  ChevronDown,
  ChevronLeft,
  ChevronRight
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
      {safeFavoriteEvents.length > 0 && (
        <div className="mb-6 text-sm text-gray-600">
          Tìm thấy <span className="font-bold text-gray-900">{totalResults}</span> sự kiện yêu thích
          {totalPages > 1 && <span className="ml-2">• Trang {currentPage}/{totalPages}</span>}
        </div>
      )}

      {/* Events Grid */}
      {paginatedFavoriteEvents.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedFavoriteEvents.map((event) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-8 mb-4">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isCurrentPage = pageNum === currentPage;
                  const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;
                  const isFirst = pageNum === 1;
                  const isLast = pageNum === totalPages;

                  if (!isCurrentPage && !isNearCurrent && !isFirst && !isLast) {
                    return null;
                  }

                  if (
                    !isCurrentPage &&
                    !isNearCurrent &&
                    !isFirst &&
                    !isLast &&
                    pageNum === (isNearCurrent ? currentPage + 2 : 2)
                  ) {
                    return (
                      <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={
                        isCurrentPage
                          ? "px-3 py-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium transition-all"
                          : "px-3 py-2 rounded hover:bg-gray-100 text-gray-700 transition-colors"
                      }
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Heart className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 text-center">
            {searchQuery || selectedCategory !== "all" 
              ? "Không tìm thấy sự kiện nào trong danh sách yêu thích của bạn." 
              : "Bạn chưa thêm sự kiện nào vào danh sách yêu thích."}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Khám phá các sự kiện và thêm chúng vào danh sách yêu thích của bạn
          </p>
        </div>
      )}
    </div>
  );
};

export default FavoriteEventsPage;