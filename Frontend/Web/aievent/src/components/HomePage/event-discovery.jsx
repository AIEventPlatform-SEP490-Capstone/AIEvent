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
  ChevronLeft,
  ChevronRight,
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
                        Mua vé
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

      {/* Featured Events Section - Simplified Carousel */}
      {featuredEvents.length > 0 && selectedCategory === "all" && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Sự kiện nổi bật
              </h2>
            </div>
            <div className="h-px bg-gradient-to-r from-orange-200 to-transparent flex-1"></div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                className="w-8 h-8 p-0"
                disabled={featuredEvents.length <= 3}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
                className="w-8 h-8 p-0"
                disabled={featuredEvents.length <= 3}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
            >
              {featuredEvents.map((event, index) => (
                <div 
                  key={event.eventId || event.id}
                  className="flex-shrink-0 w-1/3 px-2"
                >
                  <div 
                    className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => handleViewDetail(event.eventId || event.id)}
                  >
                    <img
                      src={
                        event.image || 
                        (event.imgListEvent && event.imgListEvent[0]) || 
                        "/placeholder.svg"
                      }
                      alt={event.title}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Hover overlay with event info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="text-white font-bold text-lg mb-1">{event.title}</h3>
                      <div className="flex items-center text-white/90 text-sm mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                          {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center text-white/90 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">
                          {event.locationName || event.location}
                        </span>
                      </div>
                    </div>
                    
                    {/* Like button */}
                    <button
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(event.eventId || event.id);
                      }}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedEvents.has(event.eventId || event.id)
                            ? "fill-red-500 text-red-500"
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
                onClick={() => handleCategoryChange(category.id)}
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
                className="card bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="card-image relative w-full h-40 overflow-hidden">
                  <img
                    src={
                      event.image || 
                      (event.imgListEvent && event.imgListEvent[0]) || 
                      "/placeholder.svg"
                    }
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="tag absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-2xl text-sm font-medium">
                    {event.category || event.eventCategoryName || "Event"}
                  </div>
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

                <div className="card-content p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="title font-semibold text-[17px] leading-tight text-gray-900 line-clamp-2">
                      {event.title}
                    </h3>
                  </div>
                  <div className="info space-y-2 text-gray-600 text-[13px] leading-relaxed mb-4 line-clamp-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")} •{" "}
                        {event.time || new Date(event.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="truncate">
                        {event.locationName || event.location}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="logo w-9 h-9 bg-gray-900 text-white rounded-full flex justify-center items-center font-bold text-sm mr-2">
                        {event.organizerName ? event.organizerName.charAt(0).toUpperCase() : "O"}
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                        {event.organizerName || "Organizer"}
                      </div>
                    </div>
                    <div className="share w-9 h-9 bg-[#e8f7ff] text-[#00aaff] rounded-lg flex justify-center items-center">
                      <Share2 className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
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

                  <div className="flex space-x-2 pt-3">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm py-2"
                      size="sm"
                      onClick={() => handleRegister(event.eventId || event.id)}
                    >
                      Mua vé
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
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4"
              >
                Trước
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
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                      className={`px-4 ${currentPage === pageNumber ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : ''}`}
                    >
                      {pageNumber}
                    </Button>
                  );
                }
                
                // Show ellipsis for skipped pages
                if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                  return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                }
                
                return null;
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4"
              >
                Sau
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
          <p className="text-gray-500">Hãy thử thay đổi bộ lọc</p>
        </div>
      )}
    </div>
  );
}