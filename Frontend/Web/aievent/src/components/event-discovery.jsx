import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Share2,
  Filter,
  Sparkles,
  TrendingUp,
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
} from "lucide-react";

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

const getAIRecommendationReasons = (eventId) => {
  const reasons = {
    1: "Phù hợp với sở thích công nghệ của bạn và các sự kiện tương tự bạn đã tham gia.",
    2: "Dựa trên lịch sử nghe nhạc rock và các buổi hòa nhạc trước đây.",
    3: "Gợi ý từ mạng lưới kết nối của bạn trên LinkedIn.",
    4: "Bạn đã like các sự kiện nghệ thuật gần đây.",
    5: "Dựa trên các workshop ẩm thực bạn đã đăng ký.",
    6: "Phù hợp với mục tiêu học tập trực tuyến của bạn.",
  };
  return reasons[eventId] || "Gợi ý dựa trên sở thích chung của bạn.";
};

export function EventDiscovery({ 
  allEvents = [], 
  recommendedEvents = [], 
  loading = false, 
  error = null,
  onRefresh 
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likedEvents, setLikedEvents] = useState(new Set([2, 4]));

  const toggleLike = (eventId) => {
    const newLikedEvents = new Set(likedEvents);
    if (newLikedEvents.has(eventId)) {
      newLikedEvents.delete(eventId);
    } else {
      newLikedEvents.add(eventId);
    }
    setLikedEvents(newLikedEvents);
  };

  const handleViewDetail = (eventId) => {
    // Navigation removed
    console.log(`View detail for event ${eventId}`);
  };

  const handleRegister = (eventId) => {
    // Navigation removed
    console.log(`Register for event ${eventId}`);
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
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl border border-blue-200/30">
            <Sparkles className="w-7 h-7 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-balance">
              Gợi ý từ AI dành cho bạn
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Được cá nhân hóa dựa trên sở thích của bạn
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/20 dark:via-indigo-950/15 dark:to-purple-950/20 rounded-3xl p-8 border border-blue-200/40 dark:border-blue-800/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-gray-900 bg-blue-100 dark:text-blue-900 dark:bg-blue-100 px-2 py-1 rounded-full">
                    AI Powered
                  </span>
                </div>
                <div className="h-1 w-1 bg-muted-foreground/40 rounded-full"></div>
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Cập nhật realtime
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">
                Tìm thấy{" "}
                <span className="text-blue-600">
                  {recommendedEvents.length}
                </span>{" "}
                sự kiện phù hợp
              </h3>
              <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                Dựa trên sở thích{" "}
                <span className="font-semibold text-blue-600">công nghệ</span>,
                <span className="font-semibold text-purple-600"> âm nhạc</span>{" "}
                và các hoạt động
                <span className="font-semibold text-indigo-600">
                  {" "}
                  networking
                </span>{" "}
                của bạn
              </p>
            </div>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 px-8"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Xem tất cả gợi ý
            </Button>
          </div>
        </div>
      </div>

      {recommendedEvents.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-foreground">
                Sự kiện AI gợi ý
              </h3>
            </div>
            <div className="h-px bg-gradient-to-r from-blue-200 to-transparent flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendedEvents.slice(0, 6).map((event) => (
              <Card
                key={event.eventId || event.id}
                className="group overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border-border/50 bg-card relative hover:-translate-y-1"
              >
                <div className="relative">
                  {/* Handle both mock and API image data */}
                  <img
                    src={
                      event.image || 
                      (event.imgListEvent && event.imgListEvent[0]) || 
                      "/placeholder.svg"
                    }
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white shadow-lg"
                      onClick={() => toggleLike(event.eventId || event.id)}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          likedEvents.has(event.eventId || event.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-800"
                        }`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white shadow-lg"
                      onClick={() => handleViewDetail(event.eventId || event.id)}
                    >
                      <MessageCircle className="w-4 h-4 text-gray-800" />
                    </Button>
                  </div>

                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white/95 backdrop-blur-sm text-gray-900 font-bold px-3 py-1.5 shadow-lg border border-white/20">
                      {formatPrice(event, event.ticketType === 1)}
                    </span>
                  </div>
                </div>

                <CardHeader className="pb-3 pt-5">
                  <h4 className="font-bold text-lg leading-tight text-balance text-card-foreground group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h4>
                  <p className="text-sm text-muted-foreground text-pretty leading-relaxed line-clamp-2">
                    {event.description}
                  </p>

                  {event.averageRating && event.totalRatings && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        {event.averageRating.toFixed(1)} ({event.totalRatings}{" "}
                        đánh giá)
                      </span>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200/30 dark:border-blue-800/20">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-1">
                          Tại sao phù hợp với bạn:
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                          {getAIRecommendationReasons(event.eventId || event.id)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-5">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-800 dark:text-gray-200">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")} •{" "}
                        {event.time || new Date(event.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-800 dark:text-gray-200">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{event.locationName || event.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{event.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{event.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        size="sm"
                        onClick={() => handleRegister(event.eventId || event.id)}
                      >
                        Đăng ký
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 hover:bg-blue-50 text-blue-600 bg-transparent hover:border-blue-300 transition-colors"
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
        </div>
      )}

      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-foreground">
              Tất cả sự kiện
            </h3>
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
        {filteredEvents.map((event) => (
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
                    {event.attendees || event.totalTickets} người tham gia
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