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

  const filteredEvents =
    selectedCategory === "all"
      ? allEvents
      : allEvents.filter((event) => {
          // Handle both mock data and API data structure
          const categoryName = event.category || event.eventCategoryName;
          return categoryName === selectedCategory;
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
              <Card
                key={event.eventId || event.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-card"
              >
                <div className="relative">
                  <img
                    src={
                      event.image || 
                      (event.imgListEvent && event.imgListEvent[0]) || 
                      "/placeholder.svg"
                    }
                    alt={event.title}
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 p-0 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background"
                      onClick={() => toggleLike(event.eventId || event.id)}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          likedEvents.has(event.eventId || event.id)
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 p-0 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background"
                      onClick={() => handleViewDetail(event.eventId || event.id)}
                    >
                      <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-background/90 backdrop-blur-sm text-foreground font-semibold px-3 py-1">
                      {formatPrice(event, event.ticketPricingType === "Free")}
                    </span>
                  </div>
                </div>

                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-xl leading-tight text-balance text-card-foreground">
                      {event.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-pretty leading-relaxed mt-2">
                    {event.description}
                  </p>

                  {event.averageRating && event.totalRatings && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm text-muted-foreground">
                        {event.averageRating.toFixed(1)} ({event.totalRatings} đánh
                        giá)
                      </span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0 pb-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-5 h-5 mr-3 text-primary" />
                      <span className="font-medium">
                        {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")} •{" "}
                        {event.time || new Date(event.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                      <span className="truncate font-medium">
                        {event.locationName || event.location}
                      </span>
                    </div>

                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-5 h-5 mr-3 text-primary" />
                      <span className="font-medium">
                        {event.soldQuantity || 0} / {event.totalTickets} người tham gia
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{event.likesCount || 0} lượt thích</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{event.commentsCount || 0} bình luận</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        size="lg"
                        onClick={() => handleRegister(event.eventId || event.id)}
                      >
                        Đăng ký ngay
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-border hover:bg-muted text-foreground bg-transparent"
                        onClick={() => handleViewDetail(event.eventId || event.id)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </div>
      )}

      <div id="recommended-events-section" className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-sky-400 to-gray-300 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Tất cả sự kiện
            </h2>
            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-20"></div>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="border-border hover:bg-muted bg-transparent"
          >
            <Filter className="w-5 h-5 mr-2" />
            Bộ lọc nâng cao
          </Button>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-4">
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
                className={`whitespace-nowrap min-w-fit px-6 ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "border-border hover:bg-muted text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {paginatedEvents.map((event) => (
          <Card
            key={event.eventId || event.id}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-card"
          >
            <div className="relative">
              <img
                src={
                  event.image || 
                  (event.imgListEvent && event.imgListEvent[0]) || 
                  "/placeholder.svg"
                }
                alt={event.title}
                className="w-full h-56 object-cover"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-10 h-10 p-0 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background"
                  onClick={() => toggleLike(event.eventId || event.id)}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      likedEvents.has(event.eventId || event.id)
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-10 h-10 p-0 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background"
                >
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-10 h-10 p-0 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background"
                  onClick={() => handleViewDetail(event.eventId || event.id)}
                >
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-background/90 backdrop-blur-sm text-foreground font-semibold px-3 py-1">
                  {formatPrice(event, event.ticketType === 1)}
                </span>
              </div>
              {isEventPastAndAttended(event) && (
                <div className="absolute top-4 left-4">
                  <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 text-sm">
                    <Star className="w-3 h-3 mr-1 inline" />
                    Đã tham gia
                  </span>
                </div>
              )}
            </div>

            <CardHeader className="pb-4 pt-6">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-xl leading-tight text-balance text-card-foreground">
                  {event.title}
                </h3>
              </div>
              <p className="text-muted-foreground text-pretty leading-relaxed mt-2">
                {event.description}
              </p>

              {event.averageRating && event.totalRatings && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-muted-foreground">
                    {event.averageRating.toFixed(1)} ({event.totalRatings} đánh
                    giá)
                  </span>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0 pb-6">
              <div className="space-y-4">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  <span className="font-medium">
                    {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")} •{" "}
                    {event.time || new Date(event.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                  <span className="truncate font-medium">
                    {event.locationName || event.location}, {event.address}
                  </span>
                </div>

                <div className="flex items-center text-muted-foreground">
                  <Users className="w-5 h-5 mr-3 text-primary" />
                  <span className="font-medium">
                    {event.soldQuantity || 0} / {event.totalTickets} người tham gia
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border/50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{event.likesCount || 0} lượt thích</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{event.commentsCount || 0} bình luận</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  {isEventPastAndAttended(event) ? (
                    <Button
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                      size="lg"
                      onClick={() => console.log(`Rate event ${event.eventId || event.id}`)}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Đánh giá sự kiện
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        size="lg"
                        onClick={() => handleRegister(event.eventId || event.id)}
                      >
                        Đăng ký ngay
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-border hover:bg-muted text-foreground bg-transparent"
                        onClick={() => handleViewDetail(event.eventId || event.id)}
                      >
                        Chi tiết
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => onPageChange && onPageChange(page)}
                className={currentPage === page ? 'bg-blue-600' : ''}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      <div className="text-center mt-12">
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-3 border-border hover:bg-muted text-foreground font-semibold bg-transparent"
        >
          Xem thêm sự kiện thú vị ({allEvents.length - filteredEvents.length} sự
          kiện khác)
        </Button>
      </div>
    </div>
  );
}