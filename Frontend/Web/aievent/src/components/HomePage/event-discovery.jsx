import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Share2,
  Filter,
  Sparkles,
  Music,
  Briefcase,
  Coffee,
  Palette,
  Utensils,
  GraduationCap,
  Dumbbell,
  Leaf,
  Stethoscope,
  MessageCircle,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bot,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useSelector } from "react-redux";

const categories = [
  { id: "all", name: "Tất cả", icon: Sparkles },
  { id: "Technology", name: "Công nghệ", icon: Briefcase },
  { id: "Music", name: "Âm nhạc", icon: Music },
  { id: "Networking", name: "Giao lưu", icon: Coffee },
  { id: "Arts & Culture", name: "Nghệ thuật", icon: Palette },
  { id: "Food & Drink", name: "Ẩm thực", icon: Utensils },
  { id: "Education", name: "Giáo dục", icon: GraduationCap },
  { id: "Sports & Fitness", name: "Thể thao", icon: Dumbbell },
  { id: "Health & Wellness", name: "Sức khỏe", icon: Stethoscope },
  { id: "Environment", name: "Môi trường", icon: Leaf },
  { id: "Business", name: "Kinh doanh", icon: Briefcase },
];

const userAttendedEvents = new Set([1, 2, 3]); // Event IDs that user has attended

export function EventDiscovery({ 
  allEvents = [], 
  recommendedEvents = [], 
  loading = false, 
  error = null,
  onRefresh,
  showAIRecommendedSection = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 12
}) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likedEvents, setLikedEvents] = useState(new Set([2, 4]));
  const [isAIEventsExpanded, setIsAIEventsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Load favorite events only when user is authenticated
  useEffect(() => {
    const loadFavoriteEvents = async () => {
      // Only load favorite events if user is authenticated
      if (isAuthenticated) {
        try {
          const favorites = await getFavoriteEvents();
          const favoriteIds = new Set(favorites.map(event => event.eventId));
          setLikedEvents(favoriteIds);
        } catch (err) {
          console.error("Error loading favorite events:", err);
        }
      } else {
        // Clear favorite events if user is not authenticated
        setLikedEvents(new Set());
      }
    };
    
    loadFavoriteEvents();
  }, [isAuthenticated]);

  const toggleLike = async (eventId) => {
    // Only allow toggling favorites if user is authenticated
    if (!isAuthenticated) {
      return;
    }
    
    try {
      const isCurrentlyLiked = likedEvents.has(eventId);
      
      // Update UI immediately for better UX
      const newLikedEvents = new Set(likedEvents);
      if (isCurrentlyLiked) {
        newLikedEvents.delete(eventId);
      } else {
        newLikedEvents.add(eventId);
      }
      setLikedEvents(newLikedEvents);
      
      // Call API to update server
      if (isCurrentlyLiked) {
        await removeFavoriteEvent(eventId);
      } else {
        await addFavoriteEvent(eventId);
      }
    } catch (err) {
      // Revert UI change if API call fails
      const newLikedEvents = new Set(likedEvents);
      if (likedEvents.has(eventId)) {
        newLikedEvents.delete(eventId);
      } else {
        newLikedEvents.add(eventId);
      }
      setLikedEvents(newLikedEvents);
      
      console.error("Error toggling favorite:", err);
    }
  };

  const handleViewDetail = (eventId) => {
    // Navigate to guest event detail page
    navigate(`/event/${eventId}`);
  };

  const handleRegister = (eventId) => {
    // Navigate to booking page (requires authentication)
    navigate(`/booking/${eventId}`);
  };

  const isEventPastAndAttended = (event) => {
    const eventDate = new Date(event.date || event.startTime);
    const today = new Date();
    return (
      eventDate < today && userAttendedEvents.has(Number.parseInt(event.id || event.eventId))
    );
  };

  // Filter events based on category and search query
  const filteredEvents = allEvents.filter((event) => {
    // Category filter
    const matchesCategory = selectedCategory === "all" || 
      (event.category || event.eventCategoryName) === selectedCategory;
    
    // Search filter
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.locationName || event.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Pagination for filtered events
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  const formatPrice = (price, isFree) => {
    // Handle both mock data and API data structure
    const ticketType = isFree !== undefined ? (isFree ? 1 : 2) : price?.ticketType;
    const actualPrice = price?.ticketPrice !== undefined ? price.ticketPrice : price;
    
    if (ticketType === 1 || actualPrice === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(actualPrice);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-gray-600">Đang tải sự kiện...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={onRefresh}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* AI Recommended Events Section */}
      {showAIRecommendedSection && recommendedEvents.length > 0 && (
        <div id="ai-recommended-events-section" className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-sky-400 to-gray-300 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Sự kiện AI gợi ý
              </h2>
            </div>
            <div className="h-px bg-gradient-to-r from-blue-200 to-transparent flex-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAIEventsExpanded(!isAIEventsExpanded)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              {isAIEventsExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-sm">Ẩn</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-sm">Hiện</span>
                </>
              )}
            </Button>
          </div>

          {isAIEventsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendedEvents.map((event) => (
              <div 
                key={event.eventId || event.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative">
                  <img
                    src={
                      event.image || 
                      (event.imgListEvent && event.imgListEvent[0]) || 
                      "/placeholder.svg"
                    }
                    alt={event.title}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm flex items-center justify-center transition-all"
                      onClick={() => toggleLike(event.eventId || event.id)}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedEvents.has(event.eventId || event.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                    <button
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm flex items-center justify-center transition-all"
                      onClick={() => handleViewDetail(event.eventId || event.id)}
                    >
                      <MessageCircle className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-900 font-bold px-3 py-1 rounded-full text-sm shadow-sm">
                      {formatPrice(event, event.ticketPricingType === "Free")}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg leading-tight text-gray-900 line-clamp-2">
                      {event.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")} •{" "}
                        {event.time || new Date(event.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="truncate">
                        {event.locationName || event.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {event.soldQuantity || 0}/{event.totalTickets}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {event.likesCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm py-2"
                        size="sm"
                        onClick={() => handleRegister(event.eventId || event.id)}
                      >
                        Đăng ký
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2"
                        onClick={() => handleViewDetail(event.eventId || event.id)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      <div id="recommended-events-section" className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-sky-400 to-gray-300 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Tất cả sự kiện
            </h2>
            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-20"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              className="border-border hover:bg-muted bg-transparent whitespace-nowrap"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Bộ lọc
            </Button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex space-x-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="lg"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap min-w-fit px-6 transition-all duration-300 flex-shrink-0 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl"
                    : "border-border hover:bg-muted text-foreground hover:shadow-md"
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Events Grid */}
      {paginatedEvents.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedEvents.map((event) => (
              <div 
                key={event.eventId || event.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative">
                  <img
                    src={
                      event.image || 
                      (event.imgListEvent && event.imgListEvent[0]) || 
                      "/placeholder.svg"
                    }
                    alt={event.title}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm flex items-center justify-center transition-all"
                      onClick={() => toggleLike(event.eventId || event.id)}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedEvents.has(event.eventId || event.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                    <button
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm flex items-center justify-center transition-all"
                      onClick={() => handleViewDetail(event.eventId || event.id)}
                    >
                      <MessageCircle className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-900 font-bold px-3 py-1 rounded-full text-sm shadow-sm">
                      {formatPrice(event, event.ticketType === 1)}
                    </span>
                  </div>
                  {isEventPastAndAttended(event) && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 text-xs rounded-full flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        Đã tham gia
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg leading-tight text-gray-900 line-clamp-2">
                      {event.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")} •{" "}
                        {event.time || new Date(event.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="truncate">
                        {event.locationName || event.location}, {event.address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {event.soldQuantity || 0}/{event.totalTickets}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {event.likesCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      {isEventPastAndAttended(event) ? (
                        <Button
                          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-sm py-2"
                          size="sm"
                          onClick={() => console.log(`Rate event ${event.eventId || event.id}`)}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Đánh giá
                        </Button>
                      ) : (
                        <>
                          <Button
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm py-2"
                            size="sm"
                            onClick={() => handleRegister(event.eventId || event.id)}
                          >
                            Đăng ký
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2"
                            onClick={() => handleViewDetail(event.eventId || event.id)}
                          >
                            Chi tiết
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <Button
                variant="outline"
                onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2"
              >
                Trước
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    onClick={() => onPageChange && onPageChange(page)}
                    className={`w-10 h-10 rounded-full ${
                      currentPage === page 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                        : ''
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2"
              >
                Sau
              </Button>
            </div>
          )}

          <div className="text-center mt-10">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-3 border-border hover:bg-muted text-foreground font-semibold bg-transparent"
            >
              Xem thêm sự kiện thú vị ({allEvents.length - filteredEvents.length} sự
              kiện khác)
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">Không tìm thấy sự kiện</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Không có sự kiện nào phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc tìm kiếm khác.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}>
              Xóa bộ lọc
            </Button>
            <Button variant="outline" onClick={onRefresh}>
              Làm mới
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}