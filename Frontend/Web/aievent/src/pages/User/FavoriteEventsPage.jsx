import { useState, useEffect } from "react";
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
  ChevronDown
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useCategories } from "../../hooks/useCategories"; // Add this import
import { Input } from "../../components/ui/input";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { useSelector } from "react-redux";

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

  // Ensure favoriteEvents is always an array
  const safeFavoriteEvents = Array.isArray(favoriteEvents) ? favoriteEvents : 
                          (favoriteEvents && Array.isArray(favoriteEvents.items) ? favoriteEvents.items : []);

  useEffect(() => {
    // Only fetch favorite events if user is authenticated
    if (isAuthenticated) {
      getFavoriteEvents();
    }
  }, [isAuthenticated]);

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

  // Filter events based on all filters
  const filteredEvents = safeFavoriteEvents.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      event.eventCategoryName === selectedCategory;
    
    // Price filter
    let matchesPrice = true;
    if (priceFilter !== "all") {
      if (priceFilter === "free") {
        matchesPrice = event.ticketType === 1 || event.ticketType === "free" || event.ticketPrice === 0;
      } else if (priceFilter === "paid") {
        matchesPrice = event.ticketType !== 1 && event.ticketType !== "free" && event.ticketPrice > 0;
      }
    }
    
    // Location filter
    let matchesLocation = true;
    if (locationFilter !== "all") {
      matchesLocation = event.locationName === locationFilter || event.location === locationFilter || event.district === locationFilter;
    }
    
    // Date filter - simplified for client-side filtering
    let matchesDate = true;
    if (dateFilter !== "all") {
      const eventDate = new Date(event.startTime || event.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (dateFilter) {
        case "today":
          matchesDate = eventDate.toDateString() === today.toDateString();
          break;
        case "tomorrow":
          matchesDate = eventDate.toDateString() === tomorrow.toDateString();
          break;
        case "this_week":
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          matchesDate = eventDate >= firstDayOfWeek && eventDate <= lastDayOfWeek;
          break;
        case "this_month":
          matchesDate = eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesCategory && matchesPrice && matchesLocation && matchesDate;
  });

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

            {/* Price Filter */}
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
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer"
              onClick={() => handleViewDetail(event.eventId)}
            >
              {/* Image Container */}
              <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                <img 
                  src={event.image || (event.imgListEvent && event.imgListEvent[0]) || "/placeholder.svg"} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                
                {/* Free Badge */}
                {/* {(event.ticketType === 1 || event.ticketPrice === 0) && (
                  <Badge className="absolute top-4 left-4 bg-success text-success-foreground shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Miễn phí
                  </Badge>
                )} */}
                
                {/* Category Badge at bottom */}
                <Badge 
                  variant="secondary" 
                  className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm shadow-md"
                >
                  {event.eventCategoryName || "Khác"}
                </Badge>
                
                {/* Remove Favorite Button */}
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute top-4 right-4 h-9 w-9 rounded-full shadow-lg backdrop-blur-sm bg-card/80 hover:bg-red-50 transition-all hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(event.eventId);
                  }}
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </Button>
              </div>

              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                <div className="space-y-2.5 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatDate(event.startTime || event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-secondary" />
                      <span>{formatTime(event.startTime || event.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="line-clamp-1 text-xs">
                      {event.locationName || event.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {event.soldQuantity || 0}/{event.totalTickets || event.maxAttendees} người
                          </span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                              style={{ width: `${(event.totalTickets || event.maxAttendees) ? (event.soldQuantity || 0) / (event.totalTickets || event.maxAttendees) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">
                        {event.favoriteCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-xl font-bold text-primary">
                    {formatPrice(event)}
                  </div>
                  <Button 
                    size="sm"
                    className="shadow-sm"
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
            {searchQuery || selectedCategory !== "all" || priceFilter !== "all" || locationFilter !== "all" || dateFilter !== "all"
              ? "Không tìm thấy sự kiện yêu thích phù hợp với tiêu chí tìm kiếm" 
              : "Hãy khám phá các sự kiện và lưu vào danh sách yêu thích"}
          </p>
          {!searchQuery && selectedCategory === "all" && priceFilter === "all" && locationFilter === "all" && dateFilter === "all" && (
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