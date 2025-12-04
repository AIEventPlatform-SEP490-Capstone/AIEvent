import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Heart, 
  ChevronLeft, 
  Search, 
  Filter,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useFavoriteEvents } from '../../hooks/useFavoriteEvents';

export default function OrganizerEventsPage() {
  const { organizerId } = useParams();
  const navigate = useNavigate();
  const { getEventsByOrganizer, loading: eventsLoading } = useEvents();
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, price
  const [showFilters, setShowFilters] = useState(true);
  const [favoriteEvents, setFavoriteEvents] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getEventsByOrganizer({ organizerId, pageNumber: 1, pageSize: 50 });
        let eventData = [];
        if (res && res.data && res.data.items) eventData = res.data.items;
        else if (res && res.items) eventData = res.items;
        else if (Array.isArray(res)) eventData = res;
        else if (res && res.data && Array.isArray(res.data)) eventData = res.data;
        setEvents(eventData);
        setFilteredEvents(eventData);
        
        // Load favorite events
        const favorites = await getFavoriteEvents();
        const favoriteIds = new Set(favorites.map(event => event.eventId));
        setFavoriteEvents(favoriteIds);
      } catch (err) {
        console.error('Error loading organizer events', err);
        setEvents([]);
        setFilteredEvents([]);
      }
    };
    load();
  }, [organizerId]);

  // Filter and sort events
  useEffect(() => {
    let result = [...events];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        break;
      case 'price':
        result.sort((a, b) => (a.ticketPrice || 0) - (b.ticketPrice || 0));
        break;
      default:
        break;
    }
    
    setFilteredEvents(result);
  }, [searchTerm, sortBy, events]);

  const handleViewDetail = (eventId) => navigate(`/event/${eventId}`);

  const toggleLike = async (eventId) => {
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
    // Updated to use ticketPrice field from the API response
    const price = event.ticketPrice !== undefined ? event.ticketPrice : null;
    
    if (price === null) {
      return 'Liên hệ';
    } else if (price === 0) {
      return 'Miễn phí';
    } else {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryName = (event) => {
    if (event.eventCategoryName) {
      return event.eventCategoryName;
    }
    return "Khác";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="text-sm">Quay lại</span>
            </button>
            <h1 className="text-3xl font-bold text-foreground">Sự kiện của nhà tổ chức</h1>
            <p className="text-muted-foreground mt-1">Khám phá tất cả các sự kiện được tổ chức bởi nhà tổ chức này</p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
              className="pl-10 pr-4 py-2 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <select
                    className="appearance-none pl-3 pr-8 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date">Sắp xếp theo ngày</option>
                    <option value="price">Sắp xếp theo giá</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {eventsLoading ? (
              "Đang tải sự kiện..."
            ) : (
              <>Tìm thấy {filteredEvents.length} sự kiện</>
            )}
          </p>
        </div>

        {/* Loading State */}
        {eventsLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Đang tải sự kiện...</p>
          </div>
        )}

        {/* Empty State */}
        {!eventsLoading && filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-xl border border-dashed border-border">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy sự kiện</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Hiện tại chưa có sự kiện nào từ nhà tổ chức này. Vui lòng quay lại sau!
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!eventsLoading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card 
                key={event.eventId || event.id} 
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer"
                onClick={() => handleViewDetail(event.eventId || event.id)}
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
                  {event.ticketPrice === 0 && (
                    <Badge className="absolute top-4 left-4 bg-success text-success-foreground shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Miễn phí
                    </Badge>
                  )}
                  
                  {/* Category Badge at bottom */}
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm shadow-md"
                  >
                    {getCategoryName(event)}
                  </Badge>
                  
                  {/* Like Button */}
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="absolute top-4 right-4 h-9 w-9 rounded-full shadow-lg backdrop-blur-sm bg-card/80 hover:bg-card transition-all hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(event.eventId || event.id);
                    }}
                  >
                    <Heart 
                      className={`w-4 h-4 transition-all ${
                        favoriteEvents.has(event.eventId || event.id)
                          ? "fill-red-500 text-red-500 scale-110"
                          : "text-muted-foreground"
                      }`} 
                    />
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
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-secondary" />
                        <span>
                          {formatTime(event.startTime)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="line-clamp-1 text-xs">
                        {event.locationName || event.location || event.address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {event.soldQuantity || 0}/{event.totalTickets} người
                            </span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                                style={{ width: `${event.totalTickets ? (event.soldQuantity || 0) / event.totalTickets * 100 : 0}%` }}
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
                        handleViewDetail(event.eventId || event.id);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}