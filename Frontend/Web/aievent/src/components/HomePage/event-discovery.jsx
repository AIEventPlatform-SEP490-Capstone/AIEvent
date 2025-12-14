import React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { EventCard } from "./EventCard";
import {
  Calendar,
  MapPin,
  Heart,
  Filter,
  Music,
  Briefcase,
  Coffee,
  Palette,
  Utensils,
  GraduationCap,
  Dumbbell,
  Leaf,
  Stethoscope,
  Star,
  Loader2,
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
} from "lucide-react";
import { useFavoriteEvents } from "../../hooks/useFavoriteEvents";
import { useSelector } from "react-redux";
import { useCategories } from "../../hooks/useCategories";

// Icon mapping based on category name keywords
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
    if (lowerName.includes(keyword)) {
      return icon;
    }
  }
  return Tag;
};

const userAttendedEvents = new Set([1, 2, 3]);

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
  const { getFavoriteEvents, addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { categories: dbCategories } = useCategories();

  // Drag to scroll
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
    if (categoryScrollRef.current) {
      categoryScrollRef.current.style.cursor = "grab";
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !categoryScrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoryScrollRef.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      categoryScrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (categoryScrollRef.current) {
        categoryScrollRef.current.style.cursor = "grab";
      }
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
    { value: "LowestPrice", label: "Giá thấp nhất" },
    { value: "HighestPrice", label: "Giá cao nhất" },
  ];

  const categories = useMemo(() => {
    const allOption = { id: "all", name: "Tất cả", icon: Filter };
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
    if (allEvents.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(allEvents.length / 3)));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [allEvents.length]);

  const toggleLike = async (eventId) => {
    if (!isAuthenticated) return;
    try {
      const isCurrentlyLiked = likedEvents.has(eventId);
      const newLikedEvents = new Set(likedEvents);
      if (isCurrentlyLiked) {
        newLikedEvents.delete(eventId);
      } else {
        newLikedEvents.add(eventId);
      }
      setLikedEvents(newLikedEvents);

      if (isCurrentlyLiked) {
        await removeFavoriteEvent(eventId);
      } else {
        await addFavoriteEvent(eventId);
      }
    } catch (err) {
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

  const handleViewDetail = (eventId) => navigate(`/event/${eventId}`);
  const handleRegister = (eventId) => navigate(`/booking/${eventId}`);

  const handleFilterChange = (filterName, value) => {
    const setters = {
      selectedCategory: setSelectedCategory,
      searchQuery: setSearchQuery,
      minPrice: setMinPrice,
      maxPrice: setMaxPrice,
      eventProgressStatus: setEventProgressStatus,
      ticketSaleStatus: setTicketSaleStatus,
      sortBy: setSortBy,
    };
    if (setters[filterName]) setters[filterName](value);
  };

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

  const featuredEvents = allEvents.slice(0, Math.min(10, allEvents.length));

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang tải sự kiện...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <Button onClick={onRefresh} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const paginatedEvents = allEvents;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* AI Recommended Section */}
      {showAIRecommendedSection && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gợi ý cho bạn</h2>
                <p className="text-gray-500 text-sm mt-0.5">Được AI chọn riêng dựa trên sở thích</p>
              </div>
            </div>
            <button
              onClick={() => setIsAIEventsExpanded(!isAIEventsExpanded)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
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
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có gợi ý</h3>
                  <p className="text-gray-500 text-sm">Cập nhật sở thích để nhận gợi ý phù hợp hơn</p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Featured Events Carousel */}
      {featuredEvents.length > 0 && selectedCategory === "all" && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nổi bật</h2>
                <p className="text-gray-500 text-sm mt-0.5">Sự kiện được quan tâm nhất</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={featuredEvents.length <= 3}
                className="w-10 h-10 rounded-full border border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </button>
              <button
                onClick={nextSlide}
                disabled={featuredEvents.length <= 3}
                className="w-10 h-10 rounded-full border border-blue-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
            >
              {featuredEvents.map((event) => (
                <div key={event.eventId || event.id} className="flex-shrink-0 w-1/3 px-2">
                  <div
                    className="relative group cursor-pointer rounded-2xl overflow-hidden h-80"
                    onClick={() => handleViewDetail(event.eventId || event.id)}
                  >
                    <img
                      src={event.image || (event.imgListEvent && event.imgListEvent[0]) || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Content overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <span className="inline-block text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-md w-fit mb-3">
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

                    {/* Like button */}
                    <button
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(event.eventId || event.id);
                      }}
                    >
                      <Heart
                        className={`w-5 h-5 ${
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

          {/* Slide indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(Math.ceil(featuredEvents.length / 3))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  currentSlide === i ? "w-8 bg-blue-500" : "w-1.5 bg-gray-300 hover:bg-blue-300"
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discovery Section */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Khám phá</h2>
            <p className="text-gray-500 text-sm mt-0.5">Tìm sự kiện phù hợp với bạn</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showAdvancedFilters || hasActiveFilters()
                ? "bg-blue-500 text-white"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            <Search className="w-4 h-4" />
            Tìm kiếm & Lọc
            {hasActiveFilters() && (
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-xs flex items-center justify-center font-bold">
                {[searchQuery, eventProgressStatus !== "all", ticketSaleStatus !== "all", minPrice || maxPrice, sortBy !== "NearestTime"].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Active filter tags */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                  "{searchQuery}"
                  <button onClick={() => removeFilter("searchQuery")} className="hover:text-blue-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {eventProgressStatus !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
                  {eventProgressStatusOptions.find((o) => o.value === eventProgressStatus)?.label}
                  <button onClick={() => removeFilter("eventProgressStatus")} className="hover:text-green-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {ticketSaleStatus !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                  {ticketSaleStatusOptions.find((o) => o.value === ticketSaleStatus)?.label}
                  <button onClick={() => removeFilter("ticketSaleStatus")} className="hover:text-purple-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                  {formatNumberInput(minPrice) || "0"} - {formatNumberInput(maxPrice) || "∞"} đ
                  <button onClick={() => removeFilter("price")} className="hover:text-amber-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {sortBy !== "NearestTime" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                  {sortByOptions.find((o) => o.value === sortBy)?.label}
                  <button onClick={() => removeFilter("sortBy")} className="hover:text-gray-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium underline underline-offset-2"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>


        {/* Filter Panel */}
        {showAdvancedFilters && (
          <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tên sự kiện..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Sắp xếp
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none bg-white appearance-none cursor-pointer"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Trạng thái
                </label>
                <select
                  value={eventProgressStatus}
                  onChange={(e) => setEventProgressStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none bg-white appearance-none cursor-pointer"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Trạng thái vé
                </label>
                <select
                  value={ticketSaleStatus}
                  onChange={(e) => setTicketSaleStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none bg-white appearance-none cursor-pointer"
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Khoảng giá (VNĐ)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Từ"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none bg-white"
                    value={formatNumberInput(minPrice)}
                    onChange={(e) => handlePriceInputChange(setMinPrice, e.target.value)}
                  />
                  <span className="flex items-center text-gray-400">—</span>
                  <input
                    type="text"
                    placeholder="Đến"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:ring-0 outline-none bg-white"
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
                  className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl"
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
          className="flex gap-2 overflow-x-auto pb-6 mb-8 select-none"
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
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm"
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Events Grid */}
        {paginatedEvents.length > 0 ? (
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
              <div className="flex justify-center items-center gap-2 mt-16">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-blue-200 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                            currentPage === pageNumber
                              ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                              : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
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
                  className="px-4 py-2 rounded-xl border border-blue-200 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để khám phá thêm sự kiện
            </p>
            <Button
              onClick={onRefresh}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 rounded-xl"
            >
              Tải lại
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
