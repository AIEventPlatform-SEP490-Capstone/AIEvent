import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Clock, 
  Filter,
  Search,
  X
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { Input } from "../../components/ui/input";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { useSelector } from "react-redux";

const FavoriteEventsPage = () => {
  const navigate = useNavigate();
  const { favoriteEvents, loading, error, getFavoriteEvents, removeFavoriteEvent } = useFavoriteEvents();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    // Only fetch favorite events if user is authenticated
    if (isAuthenticated) {
      getFavoriteEvents();
    }
  }, [isAuthenticated]);

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
    // Refresh the list after removal
    getFavoriteEvents();
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
    const ticketType = event.ticketType;
    const price = event.ticketPrice || 0;
    
    if (ticketType === 1 || ticketType === "free" || price === 0) {
      return "Miễn phí";
    }
    
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Get unique categories from favorite events
  const categories = [
    { id: "all", name: "Tất cả" },
    ...Array.from(
      new Set(
        favoriteEvents
          .map(event => event.eventCategoryName)
          .filter(name => name)
      )
    ).map(name => ({ id: name, name }))
  ];

  // Filter events based on search and category
  const filteredEvents = favoriteEvents.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      event.eventCategoryName === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Show loading spinner while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading) {
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

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
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
            <Card 
              key={event.eventId} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img 
                  src={event.image || (event.imgListEvent && event.imgListEvent[0]) || "/placeholder.svg"} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(event.eventId);
                    }}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm border border-white/20"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </Button>
                </div>
                {(event.ticketType === 1 || event.ticketPrice === 0) && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Miễn phí
                    </span>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {event.eventCategoryName || "Khác"}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.startTime || event.date)}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{formatTime(event.startTime || event.date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">
                      {event.locationName || event.location}, {event.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {event.soldQuantity || 0}/{event.totalTickets || event.maxAttendees} người tham gia
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-primary">
                    {formatPrice(event)}
                  </div>
                  <Button 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(event.eventId);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Chưa có sự kiện yêu thích</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedCategory !== "all" 
              ? "Không tìm thấy sự kiện yêu thích phù hợp với tiêu chí tìm kiếm" 
              : "Hãy khám phá các sự kiện và lưu vào danh sách yêu thích"}
          </p>
          {!searchQuery && selectedCategory === "all" && (
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