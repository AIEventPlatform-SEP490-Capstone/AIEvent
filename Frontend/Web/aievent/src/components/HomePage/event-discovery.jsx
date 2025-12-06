import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { EventCard } from "./EventCard";
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
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useSelector } from "react-redux";
import { SaleStatusBadge } from "./SaleStatusBadge";

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
  pageSize = 6,
  onCategoryChange // Prop for handling category change
}) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likedEvents, setLikedEvents] = useState(new Set([2, 4]));
  const [isAIEventsExpanded, setIsAIEventsExpanded] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // Auto slide for featured events
  useEffect(() => {
    if (allEvents.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % Math.max(1, Math.ceil(allEvents.length / 3)));
      }, 5000); // Change slide every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [allEvents.length]);

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

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };

  const formatPrice = (price) => {
    // Handle both mock data and API data structure
    const actualPrice = price?.ticketPrice !== undefined ? price.ticketPrice : price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(actualPrice);
  };

  // Get featured events (first 10 events)
  const featuredEvents = allEvents.slice(0, Math.min(10, allEvents.length));

  // Handle slide navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(featuredEvents.length / 3)));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, Math.ceil(featuredEvents.length / 3))) % Math.max(1, Math.ceil(featuredEvents.length / 3)));
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

  // Use allEvents directly since they are already paginated from the server
  const paginatedEvents = allEvents;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* AI Recommended Events Section */}
      {showAIRecommendedSection && (
        <div id="ai-recommended-events-section" className="mb-16">
          <div className="flex items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Sự kiện được AI gợi ý
                </h2>
                <p className="text-sm text-gray-600 mt-1">Được chọn riêng dành cho bạn</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAIEventsExpanded(!isAIEventsExpanded)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2 transition-all"
            >
              {isAIEventsExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">Ẩn</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-sm font-semibold">Hiện</span>
                </>
              )}
            </Button>
          </div>

          {isAIEventsExpanded && (
            <>
              {recommendedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recommendedEvents.map((event) => (
                    <EventCard
                      key={event.eventId || event.id}
                      event={event}
                      isLiked={likedEvents.has(event.eventId || event.id)}
                      onLike={toggleLike}
                      onViewDetail={handleViewDetail}
                      onRegister={handleRegister}
                      showReason={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sự kiện được đề xuất</h3>
                  <p className="text-gray-500">Hãy cập nhật sở thích của bạn để nhận được gợi ý tốt hơn</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && selectedCategory === "all" && (
        <div className="mb-16">
          <div className="flex items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Sự kiện nổi bật
                </h2>
                <p className="text-sm text-gray-600 mt-1">Những sự kiện được chú ý nhất</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                className="w-10 h-10 p-0 rounded-full hover:bg-orange-50 hover:border-orange-300 transition-all"
                disabled={featuredEvents.length <= 3}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
                className="w-10 h-10 p-0 rounded-full hover:bg-orange-50 hover:border-orange-300 transition-all"
                disabled={featuredEvents.length <= 3}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 p-1">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
            >
              {featuredEvents.map((event, index) => (
                <div 
                  key={event.eventId || event.id}
                  className="flex-shrink-0 w-1/3 px-2 py-1"
                >
                  <div 
                    className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-400 h-72"
                    onClick={() => handleViewDetail(event.eventId || event.id)}
                  >
                    <img
                      src={
                        event.image || 
                        (event.imgListEvent && event.imgListEvent[0]) || 
                        "/placeholder.svg"
                      }
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-120"
                    />
                    {/* Hover overlay with event info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-5">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{event.title}</h3>
                      <div className="flex items-center text-white/95 text-sm mb-1.5">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center text-white/95 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="truncate font-medium">
                          {event.locationName || event.location}
                        </span>
                      </div>
                    </div>
                    
                    {/* Like button - Enhanced */}
                    <button
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/50 hover:bg-white/50 shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(event.eventId || event.id);
                      }}
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${
                          likedEvents.has(event.eventId || event.id)
                            ? "fill-red-500 text-red-500 scale-125"
                            : "text-white"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div id="recommended-events-section" className="mb-14">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Khám phá sự kiện
            </h2>
            <p className="text-sm text-gray-600 mt-1">Tìm những sự kiện phù hợp với bạn</p>
          </div>
        </div>

        {/* Category Filter Chips - Modern Style */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-10 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`whitespace-nowrap min-w-fit px-5 py-2.5 rounded-full font-semibold transition-all duration-300 flex-shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700"
                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Icon className="w-4 h-4" />
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
              <EventCard
                key={event.eventId || event.id}
                event={event}
                isLiked={likedEvents.has(event.eventId || event.id)}
                onLike={toggleLike}
                onViewDetail={handleViewDetail}
                onRegister={handleRegister}
                showReason={false}
              />
            ))}
          </div>
          
          {/* Pagination - Modern Style */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-16 space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Trước
              </Button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Only show first, last, current, and nearby pages
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={pageNumber}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
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
                
                // Show ellipsis for skipped pages
                if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                  return <span key={pageNumber} className="px-2 text-gray-400 font-semibold">…</span>;
                }
                
                return null;
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau →
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
          <p className="text-gray-600 mb-6">Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc của bạn</p>
          <Button onClick={onRefresh} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6">
            ↺ Tải lại
          </Button>
        </div>
      )}
    </div>
  );
}