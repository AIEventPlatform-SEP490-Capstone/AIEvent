import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { EventCard } from "./EventCard";
import {
  Calendar,
  MapPin,
  Heart,
  Music,
  Briefcase,
  Coffee,
  Palette,
  Utensils,
  GraduationCap,
  Dumbbell,
  Leaf,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Bot,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  Grid3X3,
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useSelector } from "react-redux";
import { useCategories } from "../../hooks/useCategories";
import { eventAPI } from "../../api/eventAPI";

const categoryIconMap = {
  technology: Briefcase,
  "công nghệ": Briefcase,
  music: Music,
  "âm nhạc": Music,
  networking: Coffee,
  "giao lưu": Coffee,
  arts: Palette,
  culture: Palette,
  "nghệ thuật": Palette,
  "văn hóa": Palette,
  food: Utensils,
  drink: Utensils,
  "ẩm thực": Utensils,
  education: GraduationCap,
  "giáo dục": GraduationCap,
  sports: Dumbbell,
  fitness: Dumbbell,
  "thể thao": Dumbbell,
  health: Stethoscope,
  wellness: Stethoscope,
  "sức khỏe": Stethoscope,
  environment: Leaf,
  "môi trường": Leaf,
  business: Briefcase,
  "kinh doanh": Briefcase,
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return Tag;
  const lowerName = categoryName.toLowerCase();
  for (const [keyword, icon] of Object.entries(categoryIconMap)) {
    if (lowerName.includes(keyword)) return icon;
  }
  return Tag;
};

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
  filters = {},
  onFiltersChange,
}) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(filters.selectedCategory || "all");
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || "");
  const [minPrice, setMinPrice] = useState(filters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || "");
  const [eventProgressStatus, setEventProgressStatus] = useState(filters.eventProgressStatus || "all");
  const [ticketSaleStatus, setTicketSaleStatus] = useState(filters.ticketSaleStatus || "all");
  const [sortBy, setSortBy] = useState(filters.sortBy || "NearestTime");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [likedEvents, setLikedEvents] = useState(new Set([2, 4]));
  const [isAIEventsExpanded, setIsAIEventsExpanded] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { categories: dbCategories } = useCategories();

  // Fetch featured events (events that are currently on sale)
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setLoadingFeatured(true);
        const response = await eventAPI.getEvents({
          ticketSaleStatus: "OnSale",
          pageNumber: 1,
          pageSize: 10,
          sortBy: "NearestTime",
        });
        const events = response?.items || response || [];
        setFeaturedEvents(events);
      } catch (err) {
        console.error("Error fetching featured events:", err);
        setFeaturedEvents([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  const categoryScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = useCallback((e) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeft(categoryScrollRef.current.scrollLeft);
    categoryScrollRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (categoryScrollRef.current) categoryScrollRef.current.style.cursor = "grab";
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    categoryScrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (categoryScrollRef.current) categoryScrollRef.current.style.cursor = "grab";
    }
  }, [isDragging]);

  const eventProgressStatusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "Upcoming", label: "Sắp diễn ra" },
    { value: "Ongoing", label: "Đang diễn ra" },
    { value: "Ended", label: "Đã kết thúc" },
  ];

  const ticketSaleStatusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "NotStarted", label: "Chưa mở bán" },
    { value: "OnSale", label: "Đang bán" },
    { value: "SaleEnded", label: "Hết vé" },
  ];

  const sortByOptions = [
    { value: "NearestTime", label: "Gần nhất" },
    { value: "LatestTime", label: "Mới nhất" },
    { value: "LowestPrice", label: "Giá thấp" },
    { value: "HighestPrice", label: "Giá cao" },
  ];

  const categories = useMemo(() => {
    const allOption = { id: "all", name: "Tất cả", icon: Grid3X3 };
    if (!dbCategories || dbCategories.length === 0) return [allOption];
    const mappedCategories = dbCategories.map((cat) => ({
      id: cat.eventCategoryId,
      name: cat.name || cat.categoryName || cat.eventCategoryName || "",
      icon: getCategoryIcon(cat.name || cat.categoryName || cat.eventCategoryName),
    }));
    return [allOption, ...mappedCategories];
  }, [dbCategories]);

  useEffect(() => {
    const loadFavoriteEvents = async () => {
      if (isAuthenticated) {
        try {
          const favorites = await getFavoriteEvents();
          const favoriteIds = new Set(favorites.map((event) => event.eventId));
          setLikedEvents(favoriteIds);
        } catch (err) {
          console.error("Error loading favorite events:", err);
        }
      } else {
        setLikedEvents(new Set());
      }
    };
    loadFavoriteEvents();
  }, [isAuthenticated]);

  useEffect(() => {
    if (featuredEvents.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(featuredEvents.length / 3)));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredEvents.length]);

  const toggleLike = async (eventId) => {
    if (!isAuthenticated) return;
    try {
      const isCurrentlyLiked = likedEvents.has(eventId);
      const newLikedEvents = new Set(likedEvents);
      if (isCurrentlyLiked) newLikedEvents.delete(eventId);
      else newLikedEvents.add(eventId);
      setLikedEvents(newLikedEvents);

      if (isCurrentlyLiked) await removeFavoriteEvent(eventId);
      else await addFavoriteEvent(eventId);
    } catch (err) {
      const newLikedEvents = new Set(likedEvents);
      if (likedEvents.has(eventId)) newLikedEvents.delete(eventId);
      else newLikedEvents.add(eventId);
      setLikedEvents(newLikedEvents);
      console.error("Error toggling favorite:", err);
    }
  };

  const handleViewDetail = (eventId) => navigate(`/event/${eventId}`);
  const handleRegister = (eventId) => navigate(`/booking/${eventId}`);

  const applyFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({
        selectedCategory,
        searchQuery,
        minPrice,
        maxPrice,
        eventProgressStatus,
        ticketSaleStatus,
        sortBy,
      });
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    if (onFiltersChange) {
      onFiltersChange({
        selectedCategory: categoryId,
        searchQuery,
        minPrice,
        maxPrice,
        eventProgressStatus,
        ticketSaleStatus,
        sortBy,
      });
    }
  };

  const hasActiveFilters = () => {
    return (
      searchQuery !== "" ||
      eventProgressStatus !== "all" ||
      ticketSaleStatus !== "all" ||
      minPrice !== "" ||
      maxPrice !== "" ||
      sortBy !== "NearestTime"
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setEventProgressStatus("all");
    setTicketSaleStatus("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("NearestTime");
    if (onFiltersChange) {
      onFiltersChange({
        selectedCategory,
        searchQuery: "",
        minPrice: "",
        maxPrice: "",
        eventProgressStatus: "all",
        ticketSaleStatus: "all",
        sortBy: "NearestTime",
      });
    }
  };

  const removeFilter = (filterName) => {
    let newSearchQuery = searchQuery;
    let newEventProgressStatus = eventProgressStatus;
    let newTicketSaleStatus = ticketSaleStatus;
    let newMinPrice = minPrice;
    let newMaxPrice = maxPrice;
    let newSortBy = sortBy;

    switch (filterName) {
      case "searchQuery":
        newSearchQuery = "";
        setSearchQuery("");
        break;
      case "eventProgressStatus":
        newEventProgressStatus = "all";
        setEventProgressStatus("all");
        break;
      case "ticketSaleStatus":
        newTicketSaleStatus = "all";
        setTicketSaleStatus("all");
        break;
      case "price":
        newMinPrice = "";
        newMaxPrice = "";
        setMinPrice("");
        setMaxPrice("");
        break;
      case "sortBy":
        newSortBy = "NearestTime";
        setSortBy("NearestTime");
        break;
    }

    if (onFiltersChange) {
      onFiltersChange({
        selectedCategory,
        searchQuery: newSearchQuery,
        minPrice: newMinPrice,
        maxPrice: newMaxPrice,
        eventProgressStatus: newEventProgressStatus,
        ticketSaleStatus: newTicketSaleStatus,
        sortBy: newSortBy,
      });
    }
  };

  const formatNumberInput = (value) => {
    if (!value) return "";
    const numericValue = value.toString().replace(/\D/g, "");
    return new Intl.NumberFormat("vi-VN").format(numericValue);
  };

  const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return "";
    return formattedValue.replace(/\./g, "");
  };

  const handlePriceInputChange = (setter, value) => {
    const rawValue = parseFormattedNumber(value);
    setter(rawValue);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(featuredEvents.length / 3)));
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) =>
        (prev - 1 + Math.max(1, Math.ceil(featuredEvents.length / 3))) %
        Math.max(1, Math.ceil(featuredEvents.length / 3))
    );
  };

  // Loading skeleton cho phần events grid
  const EventsLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Error component inline
  const ErrorDisplay = () => (
    <div className="flex justify-center items-center py-16">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-red-600 mb-6 font-medium text-lg">{error}</p>
        <Button onClick={onRefresh} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-8 py-3">
          Thử lại
        </Button>
      </div>
    </div>
  );

  const paginatedEvents = allEvents;

  return (
    <div className="space-y-16">
      {/* AI Recommended Section */}
      {showAIRecommendedSection && (
        <section className="relative">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gợi ý cho bạn</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">AI chọn riêng dựa trên sở thích của bạn</p>
              </div>
            </div>
            <button
              onClick={() => setIsAIEventsExpanded(!isAIEventsExpanded)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isAIEventsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              <span className="text-sm font-medium">{isAIEventsExpanded ? "Ẩn" : "Hiện"}</span>
            </button>
          </div>

          {isAIEventsExpanded && (
            <>
              {recommendedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có gợi ý</h3>
                  <p className="text-gray-500 dark:text-gray-400">Cập nhật sở thích để nhận gợi ý phù hợp hơn</p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Featured Events Carousel - Events currently on sale */}
      {!loadingFeatured && featuredEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sự kiện nổi bật</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Được quan tâm nhiều nhất</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={featuredEvents.length <= 3}
                className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-violet-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={nextSlide}
                disabled={featuredEvents.length <= 3}
                className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-violet-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
            >
              {featuredEvents.map((event) => (
                <div key={event.eventId || event.id} className="flex-shrink-0 w-1/3 px-3">
                  <div
                    className="relative group cursor-pointer rounded-3xl overflow-hidden h-80"
                    onClick={() => handleViewDetail(event.eventId || event.id)}
                  >
                    <img
                      src={event.image || (event.imgListEvent && event.imgListEvent[0]) || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Gradient overlay - appears on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content - appears on hover */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                      <span className="inline-flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit mb-3">
                        {event.category || event.eventCategoryName || "Event"}
                      </span>
                      <h3 className="text-white font-bold text-xl mb-2 line-clamp-2">{event.title}</h3>
                      <div className="flex items-center gap-4 text-white/80 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.startTime || event.date).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[120px]">{event.locationName || event.location}</span>
                        </span>
                      </div>
                    </div>

                    {/* Like button - always visible on hover */}
                    <button
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(event.eventId || event.id);
                      }}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          likedEvents.has(event.eventId || event.id) ? "fill-red-500 text-red-500" : "text-white"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {[...Array(Math.ceil(featuredEvents.length / 3))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === i ? "w-8 bg-violet-500" : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-violet-300"
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discovery Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Khám phá sự kiện</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Tìm sự kiện phù hợp với bạn</p>
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
              showAdvancedFilters || hasActiveFilters()
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-violet-300 hover:shadow-md"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
            {hasActiveFilters() && (
              <span className="w-5 h-5 rounded-full bg-white text-violet-600 text-xs flex items-center justify-center font-bold">
                {[searchQuery, eventProgressStatus !== "all", ticketSaleStatus !== "all", minPrice || maxPrice, sortBy !== "NearestTime"].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
              {searchQuery && (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-medium">
                  "{searchQuery}"
                  <button onClick={() => removeFilter("searchQuery")} className="hover:text-violet-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {eventProgressStatus !== "all" && (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-medium">
                  {eventProgressStatusOptions.find((o) => o.value === eventProgressStatus)?.label}
                  <button onClick={() => removeFilter("eventProgressStatus")} className="hover:text-green-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {ticketSaleStatus !== "all" && (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-medium">
                  {ticketSaleStatusOptions.find((o) => o.value === ticketSaleStatus)?.label}
                  <button onClick={() => removeFilter("ticketSaleStatus")} className="hover:text-purple-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  {formatNumberInput(minPrice) || "0"} - {formatNumberInput(maxPrice) || "∞"} đ
                  <button onClick={() => removeFilter("price")} className="hover:text-amber-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {sortBy !== "NearestTime" && (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">
                  {sortByOptions.find((o) => o.value === sortBy)?.label}
                  <button onClick={() => removeFilter("sortBy")} className="hover:text-gray-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-violet-600 font-medium underline underline-offset-2 transition-colors"
              >
                Xóa tất cả
              </button>
          </div>
        )}

        {/* Filter Panel */}
        {showAdvancedFilters && (
          <div className="mb-8 p-6 bg-white rounded-3xl border border-gray-200 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tên sự kiện..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-gray-50 transition-all placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Sắp xếp
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-gray-50 appearance-none cursor-pointer transition-all"
                >
                  {sortByOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Trạng thái
                </label>
                <select
                  value={eventProgressStatus}
                  onChange={(e) => setEventProgressStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-gray-50 appearance-none cursor-pointer transition-all"
                >
                  {eventProgressStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Trạng thái vé
                </label>
                <select
                  value={ticketSaleStatus}
                  onChange={(e) => setTicketSaleStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-gray-50 appearance-none cursor-pointer transition-all"
                >
                  {ticketSaleStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Khoảng giá (VNĐ)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Từ"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-gray-50 transition-all placeholder:text-gray-400"
                    value={formatNumberInput(minPrice)}
                    onChange={(e) => handlePriceInputChange(setMinPrice, e.target.value)}
                  />
                  <span className="text-gray-400 font-medium">—</span>
                  <input
                    type="text"
                    placeholder="Đến"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-gray-50 transition-all placeholder:text-gray-400"
                    value={formatNumberInput(maxPrice)}
                    onChange={(e) => handlePriceInputChange(setMaxPrice, e.target.value)}
                  />
                </div>
              </div>

              {/* Apply Button */}
              <div className="md:col-span-2 flex items-end">
                <Button
                  onClick={() => {
                    applyFilters();
                    setShowAdvancedFilters(false);
                  }}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20"
                >
                  Áp dụng bộ lọc
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div
          ref={categoryScrollRef}
          className="flex gap-3 overflow-x-auto pb-6 mb-8 select-none scrollbar-hide"
          style={{ cursor: "grab", scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => !isDragging && handleCategoryChange(category.id)}
                className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                  isSelected
                    ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-500 hover:shadow-md"
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Events Grid */}
        {loading ? (
          <EventsLoadingSkeleton />
        ) : error ? (
          <ErrorDisplay />
        ) : paginatedEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-16">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  ← Trước
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => onPageChange(pageNumber)}
                          className={`w-11 h-11 rounded-xl text-sm font-semibold transition-all ${
                            currentPage === pageNumber
                              ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                      return (
                        <span key={pageNumber} className="px-2 text-gray-400">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-8">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Không tìm thấy sự kiện</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để khám phá thêm sự kiện
            </p>
            <Button
              onClick={onRefresh}
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-violet-500/20"
            >
              Tải lại
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
