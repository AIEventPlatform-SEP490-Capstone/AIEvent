import React, { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay, parseISO, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, Ticket, ChevronLeft, ChevronRight, Search, Sparkles, TrendingUp, Clock, ChevronDown, Eye, Heart, MessageCircle, Share2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { bookingAPI } from "../../api/bookingAPI";
import { eventAPI } from "../../api/eventAPI";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../../components/ui/dialog";
import MapDirection from "../../components/Event/MapDirection";
import GoogleCalendarButton from "../../components/Event/GoogleCalendarButton";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { PATH } from "../../routes/path";
import pushpinImage from "../../assets/pushpin.png";

const TimelinePage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [qrLoadingId, setQrLoadingId] = useState(null);
  const [qrByTicketId, setQrByTicketId] = useState({});
  const [filterTab, setFilterTab] = useState("all");
  const [eventDetail, setEventDetail] = useState(null);
  const [viewMode, setViewMode] = useState("month");
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(new Date());
  const [displayLimit, setDisplayLimit] = useState(20); // Giới hạn số lượng events hiển thị ban đầu
  const [ticketDisplayLimit, setTicketDisplayLimit] = useState(10); // Giới hạn số lượng tickets hiển thị ban đầu cho mỗi ticket type
  const [dayEventLimits, setDayEventLimits] = useState({}); // Giới hạn số lượng events hiển thị cho mỗi ngày trong Month View
  const [weekDayEventLimits, setWeekDayEventLimits] = useState({}); // Giới hạn số lượng events hiển thị cho mỗi ngày trong Week View
  const [dayViewLimit, setDayViewLimit] = useState(20); // Giới hạn số lượng events hiển thị trong Day View
  const [activeTab, setActiveTab] = useState("info"); // Tab state: "info", "tickets", "actions"
  const [isMapModalOpen, setIsMapModalOpen] = useState(false); // State for map modal

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await bookingAPI.getBookedEvents({ pageNumber: 1, pageSize: 100 });
        const items = res?.items || [];
        setEvents(items);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const monthMatrix = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const weekMatrix = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [currentWeek]);

  const dayMatrix = useMemo(() => {
    return [startOfDay(currentDay)];
  }, [currentDay]);

  const filteredEvents = useMemo(() => {
    let list = events;
    const now = new Date();
    if (filterTab === "upcoming") {
      list = list.filter((e) => new Date(e.startTime) >= now);
    } else if (filterTab === "attended") {
      list = list.filter((e) => new Date(e.endTime) < now);
    }
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((e) =>
      (e.title || "").toLowerCase().includes(q) || (e.address || "").toLowerCase().includes(q)
    );
  }, [events, search, filterTab]);

  // Giới hạn số lượng events hiển thị để tối ưu performance
  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, displayLimit);
  }, [filteredEvents, displayLimit]);

  // Reset display limit khi filter hoặc search thay đổi
  useEffect(() => {
    setDisplayLimit(20);
  }, [filterTab, search]);

  // Reset day view limit khi chuyển ngày
  useEffect(() => {
    setDayViewLimit(20);
  }, [currentDay]);

  const eventsByDay = useMemo(() => {
    const map = {};
    filteredEvents.forEach((e) => {
      const dateKey = format(parseISO(e.startTime), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    return map;
  }, [filteredEvents]);

  const stats = useMemo(() => {
    const now = new Date();
    const attended = events.filter((e) => new Date(e.endTime) < now).length;
    const upcoming = events.filter((e) => new Date(e.startTime) >= now).length;
    return { attended, upcoming, total: events.length };
  }, [events]);

  const loadTickets = async (event) => {
    setSelectedEvent(event);
    setLoadingTickets(true);
    setTicketDisplayLimit(10); // Reset limit khi load tickets mới
    setActiveTab("info"); // Reset to info tab when opening dialog
    try {
      try {
        const detail = await eventAPI.getEventById(event.eventId);
        setEventDetail(detail || null);
      } catch (e) {
        console.error('Error loading event detail:', e);
        setEventDetail(null);
      }
      const res = await bookingAPI.getEventTickets(event.eventId, { pageNumber: 1, pageSize: 100 });
      setTickets(res?.items || []);
      setTicketDialogOpen(true);
    } finally {
      setLoadingTickets(false);
    }
  };

  const viewQR = async (ticketId) => {
    try {
      setQrLoadingId(ticketId);
      const res = await bookingAPI.getTicketQR(ticketId);
      const qr = res?.qrCode;
      setQrByTicketId((prev) => ({ ...prev, [ticketId]: qr }));
    } finally {
      setQrLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header with Animated Background */}
      <div className="container mx-auto px-4 pt-6 max-w-7xl">
        <div className="relative text-white overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(to right, rgb(30 41 59) 0%, rgb(55 65 81) 30%, rgb(75 85 99) 50%, rgb(29 78 216) 100%)' }}>
          {/* Animated Background Patterns */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-slate-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative px-4 py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  <h1 className="text-4xl font-bold tracking-tight">Timeline Sự Kiện</h1>
                </div>
                <p className="text-blue-100 text-lg">Khám phá và quản lý các sự kiện của bạn một cách dễ dàng</p>

                {/* Enhanced Stats Cards */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:rotate-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <TrendingUp className="w-5 h-5 relative z-10" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-blue-100">Tổng sự kiện</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:rotate-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-transparent"></div>
                        <CalendarIcon className="w-5 h-5 relative z-10" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.attended}</div>
                        <div className="text-xs text-blue-100">Đã tham gia</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:rotate-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-500/30 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/30 to-transparent"></div>
                        <Clock className="w-5 h-5 relative z-10" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.upcoming}</div>
                        <div className="text-xs text-blue-100">Sắp diễn ra</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Search Bar with Glassmorphism */}
        <div className="mb-8 space-y-4 animate-slide-up">
          <div className="relative backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Input
              placeholder="Tìm kiếm sự kiện theo tên, địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="relative pl-12 h-14 text-lg bg-transparent border-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Enhanced Filter Tabs with Sliding Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 shadow-inner">
              <div className="flex flex-wrap items-center gap-1 relative z-10">
                <Button
                  variant={filterTab === "all" ? "default" : "ghost"}
                  onClick={() => setFilterTab("all")}
                  className={`rounded-xl transition-all duration-300 ${filterTab === "all" ? "shadow-lg" : "hover:bg-white/50"}`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tất cả
                </Button>
                <Button
                  variant={filterTab === "upcoming" ? "default" : "ghost"}
                  onClick={() => setFilterTab("upcoming")}
                  className={`rounded-xl transition-all duration-300 ${filterTab === "upcoming" ? "shadow-lg" : "hover:bg-white/50"}`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Sắp tới
                </Button>
                <Button
                  variant={filterTab === "attended" ? "default" : "ghost"}
                  onClick={() => setFilterTab("attended")}
                  className={`rounded-xl transition-all duration-300 ${filterTab === "attended" ? "shadow-lg" : "hover:bg-white/50"}`}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Đã tham gia
                </Button>
              </div>
            </div>

            {/* Enhanced Navigation Controls */}
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-lg border border-gray-200 rounded-2xl p-2 shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md"
                onClick={() => {
                  if (viewMode === "month") setCurrentMonth(addMonths(currentMonth, -1));
                  else if (viewMode === "week") setCurrentWeek(addWeeks(currentWeek, -1));
                  else if (viewMode === "day") setCurrentDay(addDays(currentDay, -1));
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-sm font-semibold px-4 min-w-[180px] text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {viewMode === "month" && format(currentMonth, "MMMM yyyy", { locale: vi })}
                {viewMode === "week" && (
                  <>
                    {format(weekMatrix[0], "dd/MM", { locale: vi })} - {format(weekMatrix[6], "dd/MM yyyy", { locale: vi })}
                  </>
                )}
                {viewMode === "day" && format(currentDay, "dd MMMM yyyy", { locale: vi })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md"
                onClick={() => {
                  if (viewMode === "month") setCurrentMonth(addMonths(currentMonth, 1));
                  else if (viewMode === "week") setCurrentWeek(addWeeks(currentWeek, 1));
                  else if (viewMode === "day") setCurrentDay(addDays(currentDay, 1));
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Events List with Skeleton Loading */}
          <div className="lg:col-span-1 space-y-4 max-h-[72vh] overflow-auto pr-2 pt-4 pb-2 custom-scrollbar">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse rounded-2xl border-2">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg bg-[length:200%_100%] animate-shimmer"></div>
                          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded bg-[length:200%_100%] animate-shimmer w-3/4"></div>
                          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded bg-[length:200%_100%] animate-shimmer w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="rounded-2xl border-2 border-dashed overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full animate-pulse"></div>
                    <CalendarIcon className="relative w-24 h-24 text-blue-400 mx-auto top-12" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Chưa có sự kiện nào</h3>
                  <p className="text-gray-500 mb-6">Hãy bắt đầu khám phá và đặt vé ngay!</p>
                  <Button
                    size="lg"
                    className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    onClick={() => navigate(PATH.HOME)}
                  >
                    Khám phá sự kiện →
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {displayedEvents.map((e, idx) => (
                  <Card
                    key={e.eventId}
                    className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-fade-in group overflow-hidden ${selectedEvent?.eventId === e.eventId
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:border-blue-300"
                      }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => loadTickets(e)}
                  >
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>

                    <CardContent className="relative p-5 bg-white rounded-2xl">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">{e.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {format(parseISO(e.startTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mb-3">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{e.address || "Chưa có địa chỉ"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                              <Ticket className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-medium text-blue-600">{e.totalTickets} vé</span>
                            </div>
                            {new Date(e.endTime) < new Date() && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                Đã tham gia
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 via-blue-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex items-end p-5">
                      <div className="text-white text-sm font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Nhấn để xem chi tiết →
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Enhanced Load More Button */}
                {displayedEvents.length < filteredEvents.length && (
                  <div className="pt-4 pb-2">
                    <Button
                      variant="outline"
                      onClick={() => setDisplayLimit(prev => Math.min(prev + 20, filteredEvents.length))}
                      className="w-full rounded-xl transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:shadow-lg group"
                    >
                      <ChevronDown className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                      Hiển thị thêm ({filteredEvents.length - displayedEvents.length} sự kiện còn lại)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Enhanced Calendar View */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden rounded-2xl border-2 shadow-2xl bg-white">
              <CardContent className="p-0">
                {/* Enhanced View Mode Tabs */}
                <div className="flex items-center justify-between p-5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 shadow-sm">
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="font-medium text-emerald-700">{stats.attended} đã tham gia</span>
                    </span>
                    <span className="inline-flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                      </span>
                      <span className="font-medium text-sky-700">{stats.upcoming} sắp tới</span>
                    </span>
                  </div>
                  <div className="hidden sm:flex gap-2 bg-gray-100 rounded-xl p-1">
                    <Button
                      size="sm"
                      variant={viewMode === "month" ? "default" : "ghost"}
                      onClick={() => {
                        setViewMode("month");
                        setCurrentMonth(selectedDate);
                      }}
                      className={`rounded-lg transition-all duration-300 ${viewMode === "month" ? "shadow-md" : "hover:bg-white/70"}`}
                    >
                      Tháng
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "week" ? "default" : "ghost"}
                      onClick={() => {
                        setViewMode("week");
                        setCurrentWeek(selectedDate);
                      }}
                      className={`rounded-lg transition-all duration-300 ${viewMode === "week" ? "shadow-md" : "hover:bg-white/70"}`}
                    >
                      Tuần
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "day" ? "default" : "ghost"}
                      onClick={() => {
                        setViewMode("day");
                        setCurrentDay(selectedDate);
                      }}
                      className={`rounded-lg transition-all duration-300 ${viewMode === "day" ? "shadow-md" : "hover:bg-white/70"}`}
                    >
                      Ngày
                    </Button>
                  </div>
                </div>

                {/* Month View - Enhanced */}
                {viewMode === "month" && (
                  <>
                    <div className="grid grid-cols-7 text-sm font-bold text-gray-700 border-b-2 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 shadow-sm">
                      {"T2 T3 T4 T5 T6 T7 CN".split(" ").map((d) => (
                        <div key={d} className="p-4 text-center border-r border-gray-200 last:border-r-0">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-[1px] bg-gray-300 p-[1px]">
                      {monthMatrix.map((day, idx) => {
                        const key = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDay[key] || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const selected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const hasEvents = dayEvents.length > 0;
                        return (
                          <div
                            key={idx}
                            className={`min-h-[110px] cursor-pointer transition-all duration-300 relative group border border-gray-200 ${
                              hasEvents 
                                ? "bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 border-l-4 border-l-blue-500 shadow-sm" 
                                : "bg-white"
                            } ${!isCurrentMonth ? "opacity-40 bg-gray-50" : ""} ${
                              selected ? "ring-2 ring-blue-500 shadow-lg z-10 bg-blue-50" : ""
                            } hover:shadow-lg hover:z-10 hover:scale-[1.01]`}
                            onClick={() => setSelectedDate(day)}
                          >
                            {/* Glow effect for days with events */}
                            {hasEvents && (
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-sky-400/5 to-transparent pointer-events-none rounded-sm"></div>
                            )}
                            
                            {/* Paper texture effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>

                            <div className="relative p-2 text-sm flex items-center justify-between z-10">
                              <div className={`font-semibold transition-all duration-300 ${isToday ? "w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg" : hasEvents ? "text-blue-700 font-bold" : ""}`}>
                                {format(day, "d")}
                              </div>
                            </div>
                            {dayEvents.length > 0 && (
                              <img 
                                src={pushpinImage} 
                                alt="pushpin" 
                                className="absolute bottom-19 left-15 w-15 h-15 object-contain drop-shadow-xl z-20"
                                style={{ 
                                  transform: 'rotate(-11deg)',
                                  filter: 'brightness(1) contrast(1.2) saturate(1.2)'
                                }}
                              />
                            )}
                            <div className="relative px-2 pb-2 space-y-1 overflow-y-auto max-h-[calc(110px-40px)]">
                              {(() => {
                                const MAX_DISPLAY = 3; // Giới hạn hiển thị 3 sự kiện đầu tiên trong Month View
                                const dayKey = format(day, "yyyy-MM-dd");
                                const limit = dayEventLimits[dayKey] || MAX_DISPLAY;
                                const displayedEvents = dayEvents.slice(0, limit);
                                const remaining = dayEvents.length - limit;

                                return (
                                  <>
                                    {displayedEvents.map((e) => (
                                      <div
                                        key={e.eventId}
                                        className="rounded-lg bg-gradient-to-r from-slate-500 via-purple-500 to-purple-200 text-white border-0 px-2 py-1.5 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 flex-shrink-0 shadow-md"
                                        onClick={(evt) => {
                                          evt.stopPropagation();
                                          loadTickets(e);
                                        }}
                                        title={e.title}
                                      >
                                        <div className="font-bold text-[10px] text-white mb-0.5 line-clamp-2 leading-tight drop-shadow-sm">
                                          {e.title}
                                        </div>
                                        <div className="text-[9px] text-purple-100 font-semibold flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          {format(parseISO(e.startTime), "HH:mm", { locale: vi })}
                                        </div>
                                      </div>
                                    ))}
                                    {remaining > 0 && (
                                      <div
                                        className="text-[9px] text-blue-600 font-bold px-2 py-1 cursor-pointer hover:bg-blue-200 rounded-lg transition-all bg-blue-100 border border-blue-300 shadow-sm"
                                        onClick={(evt) => {
                                          evt.stopPropagation();
                                          setDayEventLimits(prev => ({
                                            ...prev,
                                            [dayKey]: Math.min(limit + 5, dayEvents.length)
                                          }));
                                        }}
                                        title={`Xem thêm ${remaining} sự kiện`}
                                      >
                                        +{remaining} sự kiện
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Week View - Enhanced */}
                {viewMode === "week" && (
                  <>
                    <div className="grid grid-cols-7 text-sm font-bold text-gray-700 border-b-2 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 shadow-sm">
                      {"T2 T3 T4 T5 T6 T7 CN".split(" ").map((d) => (
                        <div key={d} className="p-4 text-center border-r border-gray-200 last:border-r-0">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-[1px] bg-gray-300 p-[1px]">
                      {weekMatrix.map((day, idx) => {
                        const key = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDay[key] || [];
                        const selected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const hasEvents = dayEvents.length > 0;
                        return (
                          <div
                            key={idx}
                            className={`min-h-[450px] cursor-pointer transition-all duration-300 relative group border border-gray-200 ${
                              hasEvents 
                                ? "bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 border-l-4 border-l-blue-500 shadow-sm" 
                                : "bg-white"
                            } ${selected ? "ring-2 ring-blue-500 shadow-lg z-10 bg-blue-50" : ""} hover:shadow-lg hover:z-10`}
                            onClick={() => setSelectedDate(day)}
                          >
                            {/* Glow effect for days with events */}
                            {hasEvents && (
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-sky-400/5 to-transparent pointer-events-none rounded-sm"></div>
                            )}
                            
                            {/* Paper texture effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>

                            <div className={`relative p-4 flex items-center justify-between border-b-2 z-10 ${
                              hasEvents 
                                ? "border-blue-200 bg-gradient-to-b from-blue-100/50 to-white" 
                                : "border-gray-200 bg-gradient-to-b from-gray-50 to-white"
                            }`}>
                              <div className={`text-lg font-bold transition-all duration-300 ${isToday ? "w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg" : hasEvents ? "text-blue-700" : ""}`}>
                                {format(day, "d")}
                              </div>
                            </div>
                            {dayEvents.length > 0 && (
                              <img 
                                src={pushpinImage} 
                                alt="pushpin" 
                                className="absolute top-2 right-2 w-10 h-10 object-contain drop-shadow-xl z-20"
                                style={{ 
                                  transform: 'rotate(-15deg)',
                                  filter: 'brightness(1.1) contrast(1.2) saturate(1.3)'
                                }}
                              />
                            )}
                            <div className="relative p-3 space-y-2 overflow-y-auto max-h-[calc(450px-80px)]">
                              {(() => {
                                const MAX_DISPLAY = 10; // Giới hạn hiển thị 10 sự kiện đầu tiên trong Week View
                                const dayKey = format(day, "yyyy-MM-dd");
                                const limit = weekDayEventLimits[dayKey] || MAX_DISPLAY;
                                const displayedEvents = dayEvents.slice(0, limit);
                                const remaining = dayEvents.length - limit;

                                if (dayEvents.length === 0) {
                                  return (
                                    <div className="text-xs text-muted-foreground text-center py-8 opacity-60">Không có sự kiện</div>
                                  );
                                }

                                return (
                                  <>
                                    {displayedEvents.map((e) => (
                                      <div
                                        key={e.eventId}
                                        className="rounded-xl bg-gradient-to-r from-slate-500 via-purple-500 to-red-500 text-white border-0 px-4 py-3 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 shadow-lg"
                                        onClick={(evt) => {
                                          evt.stopPropagation();
                                          loadTickets(e);
                                        }}
                                        title={e.title}
                                      >
                                        <div className="font-bold text-sm text-white mb-1.5 line-clamp-2 leading-tight drop-shadow-sm">
                                          {e.title}
                                        </div>
                                        <div className="text-xs text-purple-100 font-semibold flex items-center gap-1.5">
                                          <Clock className="w-3 h-3" />
                                          {format(parseISO(e.startTime), "HH:mm", { locale: vi })}
                                        </div>
                                      </div>
                                    ))}
                                    {remaining > 0 && (
                                      <div
                                        className="text-xs text-blue-700 font-bold px-4 py-2.5 cursor-pointer hover:bg-blue-200 rounded-xl transition-all text-center border-2 border-blue-300 bg-blue-100 shadow-md hover:shadow-lg"
                                        onClick={(evt) => {
                                          evt.stopPropagation();
                                          setWeekDayEventLimits(prev => ({
                                            ...prev,
                                            [dayKey]: Math.min(limit + 10, dayEvents.length)
                                          }));
                                        }}
                                        title={`Xem thêm ${remaining} sự kiện`}
                                      >
                                        +{remaining} sự kiện khác
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Day View - Enhanced */}
                {viewMode === "day" && (
                  <>
                    <div className="border-b p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-purple-400/10"></div>
                      <div className="relative text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {format(currentDay, "EEEE, dd MMMM yyyy", { locale: vi })}
                      </div>
                    </div>
                    <div className="p-6">
                      {(() => {
                        const key = format(currentDay, "yyyy-MM-dd");
                        const dayEvents = eventsByDay[key] || [];
                        const displayedEvents = dayEvents.slice(0, dayViewLimit);
                        const remaining = dayEvents.length - dayViewLimit;

                        return (
                          <div className="space-y-4">
                            {dayEvents.length === 0 ? (
                              <div className="text-center py-16">
                                <div className="relative w-48 h-48 mx-auto mb-6">
                                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full animate-pulse"></div>
                                  <CalendarIcon className="relative w-24 h-24 text-gray-400 mx-auto top-12" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Không có sự kiện trong ngày này</h3>
                                <p className="text-muted-foreground">Hãy khám phá các sự kiện khác!</p>
                              </div>
                            ) : (
                              <>
                                {displayedEvents.map((e, idx) => (
                                  <Card
                                    key={e.eventId}
                                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-2 animate-fade-in"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                    onClick={() => loadTickets(e)}
                                  >
                                    <CardContent className="p-6">
                                      <div className="flex items-start gap-5">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                          <CalendarIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-bold text-xl mb-3">{e.title}</div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                                            <CalendarIcon className="w-4 h-4" />
                                            {format(parseISO(e.startTime), "HH:mm", { locale: vi })} - {format(parseISO(e.endTime), "HH:mm", { locale: vi })}
                                          </div>
                                          {e.address && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                                              <MapPin className="w-4 h-4" />
                                              <span className="truncate">{e.address}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2 mt-3">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                              <Ticket className="w-3 h-3 mr-1" />
                                              {e.totalTickets} vé
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                                {remaining > 0 && (
                                  <div className="pt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => setDayViewLimit(prev => Math.min(prev + 20, dayEvents.length))}
                                      className="w-full rounded-xl transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:shadow-lg group"
                                    >
                                      <ChevronDown className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                                      Hiển thị thêm {remaining} sự kiện ({dayEvents.length} tổng cộng)
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ticket Detail Modal */}
        <Dialog open={ticketDialogOpen} onOpenChange={(open) => {
          setTicketDialogOpen(open);
          if (!open) {
            setIsMapModalOpen(false); // Reset map modal when ticket dialog closes
          }
        }}>
          <DialogContent className="max-w-7xl max-h-[90vh] p-0 rounded-xl overflow-hidden border-2">
            {/* Header với Gradient và Overlay Image */}
            <div className="relative h-36 overflow-hidden">
              {/* Background Image với Overlay */}
              <div className="absolute inset-0">
                {eventDetail?.imgListEvent && eventDetail.imgListEvent.length > 0 ? (
                  <img
                    src={eventDetail.imgListEvent[0]}
                    alt={eventDetail.title || selectedEvent?.title || "Event"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
              </div>

              {/* Header Content */}
              <div className="relative h-full flex flex-col justify-end p-4 pr-12">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-bold text-white mb-1 leading-tight">
                      {eventDetail?.title || selectedEvent?.title || "Chi tiết sự kiện"}
                    </DialogTitle>
                    <DialogDescription className="text-white/90 text-sm flex items-center gap-2 flex-wrap mt-1">
                      <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {eventDetail?.startTime && format(parseISO(eventDetail.startTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{eventDetail?.locationName || eventDetail?.address || selectedEvent?.address || "Chưa có địa chỉ"}</span>
                      </span>
                    </DialogDescription>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const eventId = eventDetail?.eventId || selectedEvent?.eventId;
                      setTicketDialogOpen(false);
                      navigate(PATH.EVENT_DETAIL.replace(':id', eventId));
                    }}
                    className="rounded-md bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white transition-all duration-300 flex items-center gap-1.5 shadow-lg text-xs whitespace-nowrap flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Trang chi tiết
                  </Button>
                </div>

                {/* Event Status Badge */}
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={`px-2 py-0.5 text-xs font-semibold ${new Date(eventDetail?.endTime || selectedEvent?.endTime || 0) < new Date()
                      ? "bg-emerald-500/90 text-white border-0"
                      : "bg-sky-500/90 text-white border-0"
                    }`}>
                    {new Date(eventDetail?.endTime || selectedEvent?.endTime || 0) < new Date() ? "✓ Đã hoàn thành" : "Sắp diễn ra"}
                  </Badge>
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border-white/30">
                    <Ticket className="w-3 h-3 mr-1" />
                    {eventDetail?.totalTickets || selectedEvent?.totalTickets || 0} vé
                  </Badge>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto max-h-[calc(90vh-9rem)] custom-scrollbar">
              <div className="p-4 space-y-4">
                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Card className="rounded-lg border-2 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-2.5 text-center">
                      <Eye className="w-5 h-5 mx-auto mb-1.5 text-blue-600" />
                      <div className="text-lg font-bold text-gray-900">{eventDetail?.viewCount || 0}</div>
                      <div className="text-xs text-gray-600">Lượt xem</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border-2 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-2.5 text-center">
                      <Heart className="w-5 h-5 mx-auto mb-1.5 text-pink-600" />
                      <div className="text-lg font-bold text-gray-900">{eventDetail?.likeCount || 0}</div>
                      <div className="text-xs text-gray-600">Lượt thích</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border-2 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-2.5 text-center">
                      <MessageCircle className="w-5 h-5 mx-auto mb-1.5 text-purple-600" />
                      <div className="text-lg font-bold text-gray-900">{eventDetail?.commentCount || 0}</div>
                      <div className="text-xs text-gray-600">Bình luận</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border-2 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-2.5 text-center">
                      <Share2 className="w-5 h-5 mx-auto mb-1.5 text-emerald-600" />
                      <div className="text-lg font-bold text-gray-900">{eventDetail?.shareCount || 0}</div>
                      <div className="text-xs text-gray-600">Chia sẻ</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tab Navigation */}
                <div className="border-b-2 border-gray-200">
                  <div className="flex gap-1">
                    <Button
                      variant={activeTab === "info" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("info")}
                      className={`rounded-t-md rounded-b-none border-b-2 transition-all duration-300 text-sm ${
                        activeTab === "info"
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm hover:text-blue-700"
                          : "border-transparent hover:bg-gray-50 hover:text-gray-900 text-gray-700"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Thông tin sự kiện
                    </Button>
                    <Button
                      variant={activeTab === "tickets" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("tickets")}
                      className={`rounded-t-md rounded-b-none border-b-2 transition-all duration-300 text-sm ${
                        activeTab === "tickets"
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm hover:text-blue-700"
                          : "border-transparent hover:bg-gray-50 hover:text-gray-900 text-gray-700"
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5 mr-1.5" />
                      Vé của bạn ({tickets.reduce((sum, t) => sum + (t.quantity || 0), 0)})
                    </Button>
                    <Button
                      variant={activeTab === "actions" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("actions")}
                      className={`rounded-t-md rounded-b-none border-b-2 transition-all duration-300 text-sm ${
                        activeTab === "actions"
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm hover:text-blue-700"
                          : "border-transparent hover:bg-gray-50 hover:text-gray-900 text-gray-700"
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      Thao tác nhanh
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Main Content - Left Side */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Tab Content: Thông tin sự kiện */}
                    {activeTab === "info" && (
                      <div className="space-y-3">
                        {/* Description Card */}
                        <Card className="rounded-lg border-2 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2.5">
                            <div className="flex items-center gap-2 text-white">
                              <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                              <h3 className="text-base font-bold">Về sự kiện này</h3>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-sm">
                              {eventDetail?.description || eventDetail?.detailedDescription || (
                                <span className="text-gray-400 italic text-sm">Chưa có mô tả chi tiết</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Event Images */}
                        <Card className="rounded-lg border-2 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2.5">
                            <div className="flex items-center gap-2 text-white">
                              <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                              <h3 className="text-base font-bold">Hình ảnh sự kiện</h3>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            {eventDetail?.imgListEvent && eventDetail.imgListEvent.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {eventDetail.imgListEvent.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative aspect-video rounded-md overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    onClick={() => {
                                      // Open image in new tab or modal if needed
                                      window.open(img, '_blank');
                                    }}
                                  >
                                    <img
                                      src={img}
                                      alt={`Event image ${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium text-sm">Chưa có hình ảnh sự kiện</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Tab Content: Vé của bạn */}
                    {activeTab === "tickets" && (
                      <Card className="rounded-lg border-2 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2.5">
                          <div className="flex items-center gap-2 text-white">
                            <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Ticket className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-base font-bold">Vé của bạn ({tickets.reduce((sum, t) => sum + (t.quantity || 0), 0)})</h3>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          {loadingTickets ? (
                            <div className="text-center py-6">
                              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-muted-foreground mt-2 text-sm">Đang tải vé...</p>
                            </div>
                          ) : tickets.length === 0 ? (
                            <div className="text-center py-6">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                                <Ticket className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium text-sm">Bạn chưa có vé cho sự kiện này</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {tickets.map((t, idx) => {
                                const ticketList = Array.isArray(t.tickets) ? t.tickets : [];
                                const displayedTickets = ticketList.slice(0, ticketDisplayLimit);
                                const remainingTickets = ticketList.length - displayedTickets.length;

                                return (
                                  <div key={idx} className="space-y-2">
                                    {/* Ticket Type Header */}
                                    <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-md border-2">
                                      <div>
                                        <div className="font-bold text-sm">{t.ticketTypeName}</div>
                                        {t.price !== undefined && t.price !== null && (
                                          <div className="text-blue-600 font-bold text-base mt-0.5">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.price)}
                                          </div>
                                        )}
                                      </div>
                                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2.5 py-1 text-xs font-bold border-0">
                                        {t.quantity} vé
                                      </Badge>
                                    </div>

                                    {/* Individual Tickets */}
                                    {ticketList.length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                                        {displayedTickets.map((tk) => (
                                          <Card key={tk.ticketId} className="rounded-md border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
                                            <CardContent className="p-3">
                                              {/* Ticket Header */}
                                              <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-dashed">
                                                <div className="font-mono text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                  {tk.ticketCode}
                                                </div>
                                                <Badge
                                                  className={`font-semibold text-xs ${tk.status === "Valid"
                                                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                                      : tk.status === "Refunded"
                                                        ? "bg-amber-100 text-amber-700 border-amber-300"
                                                        : "bg-gray-100 text-gray-600 border-gray-300"
                                                    }`}
                                                >
                                                  {tk.status === "Valid" ? "✓ Hợp lệ" : tk.status}
                                                </Badge>
                                              </div>

                                              {/* Ticket Info */}
                                              <div className="text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                Tạo lúc {format(parseISO(tk.createdAt), "dd/MM/yyyy HH:mm")}
                                              </div>

                                              {/* QR Code Section */}
                                              <div className="space-y-1.5">
                                                <Button
                                                  size="sm"
                                                  onClick={() => viewQR(tk.ticketId)}
                                                  disabled={qrLoadingId === tk.ticketId}
                                                  className="w-full rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg text-xs"
                                                >
                                                  {qrLoadingId === tk.ticketId ? (
                                                    <>
                                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                                                      Đang tải QR...
                                                    </>
                                                  ) : (
                                                    <>
                                                      Hiển thị mã QR
                                                    </>
                                                  )}
                                                </Button>

                                                {qrByTicketId[tk.ticketId] && (
                                                  <div className="bg-white p-2 rounded-md border-2 shadow-inner animate-fade-in">
                                                    <img
                                                      src={qrByTicketId[tk.ticketId]}
                                                      alt="QR Code"
                                                      className="w-full h-auto rounded-md"
                                                    />
                                                    <p className="text-center text-[10px] text-gray-500 mt-1">Quét mã để check-in</p>
                                                  </div>
                                                )}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    )}

                                    {/* Load More Button */}
                                    {remainingTickets > 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTicketDisplayLimit(prev => prev + 10)}
                                        className="w-full rounded-md border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 ml-2 text-xs"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                                        Xem thêm {remainingTickets} vé
                                      </Button>
                                    )}

                                    {idx < tickets.length - 1 && <Separator className="my-3" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Tab Content: Thao tác nhanh */}
                    {activeTab === "actions" && (
                      <Card className="rounded-lg border-2 shadow-lg">
                        <CardContent className="p-4">
                          <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                              <Share2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            Thao tác nhanh
                          </h3>
                          <div className="space-y-2">
                            <GoogleCalendarButton
                              event={eventDetail || selectedEvent}
                              variant="outline"
                              size="sm"
                              className="w-full rounded-md border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-gray-900 text-gray-700 transition-all duration-300 justify-start h-10 text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-md border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-gray-900 text-gray-700 transition-all duration-300 justify-start h-10 text-sm"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Chia sẻ sự kiện
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Sidebar - Right Side */}
                  <div className="lg:col-span-1 space-y-3">
                    {/* Event Tags/Categories */}
                    {((eventDetail?.eventTags && eventDetail.eventTags.length > 0) || (eventDetail?.tags && eventDetail.tags.length > 0)) && (
                      <Card className="rounded-lg border-2 shadow-lg">
                        <CardContent className="p-3">
                          <h3 className="text-sm font-bold text-gray-800 mb-2">Danh mục</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {(eventDetail?.eventTags || eventDetail?.tags || []).map((et, i) => {
                              const tag = et.tag || et;
                              const tagName = tag?.tagName || tag?.name || tag?.tag?.tagName || tag?.tag?.name || "Tag";
                              return (
                                <div
                                  key={`${tag?.tagId || tag?.id || i}`}
                                  className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors duration-200 cursor-default"
                                >
                                  {tagName}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Event Time Card */}
                    <Card className="rounded-lg border-2 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <CalendarIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h3 className="text-sm font-bold">Thời gian</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-gray-600 mb-0.5">Bắt đầu</div>
                            <div className="font-bold text-sm">
                              {eventDetail?.startTime && format(parseISO(eventDetail.startTime), "HH:mm - dd/MM/yyyy", { locale: vi })}
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <div className="text-xs text-gray-600 mb-0.5">Kết thúc</div>
                            <div className="font-bold text-sm">
                              {eventDetail?.endTime && format(parseISO(eventDetail.endTime), "HH:mm - dd/MM/yyyy", { locale: vi })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Location Card */}
                    <Card className="rounded-lg border-2 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <MapPin className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h3 className="text-sm font-bold">Địa điểm</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-2 text-xs">
                          {eventDetail?.locationName || eventDetail?.address || selectedEvent?.address || "Chưa có địa chỉ"}
                        </p>
                        
                        {/* Mini Map Preview */}
                        {(eventDetail?.latitude && eventDetail?.longitude) ? (
                          <div className="relative h-20 rounded-md overflow-hidden border border-gray-200 mb-2">
                            <iframe
                              src={`https://www.google.com/maps?q=${eventDetail.latitude},${eventDetail.longitude}&hl=vi&z=14&output=embed`}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              title="Event Location Map Preview"
                            ></iframe>
                          </div>
                        ) : (eventDetail?.address || selectedEvent?.address || eventDetail?.locationName) ? (
                          // Show static Leaflet map preview when coordinates are missing but address exists
                          <div className="relative h-20 rounded-md overflow-hidden border border-gray-200 bg-gray-100 mb-2">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="inline-block p-1.5 rounded-full bg-white shadow-lg mb-1">
                                  <MapPin className="h-4 w-4 text-red-500" />
                                </div>
                                <p className="text-xs font-medium text-gray-700 bg-white px-1.5 py-0.5 rounded shadow">
                                  {eventDetail?.locationName || eventDetail?.address || selectedEvent?.address}
                                </p>
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-70"></div>
                            <div className="absolute top-1 left-1 bg-white px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-600">
                              Leaflet
                            </div>
                            <div className="absolute bottom-1 right-1 bg-white px-1.5 py-0.5 rounded text-[10px] text-gray-500">
                              © OpenStreetMap
                            </div>
                          </div>
                        ) : (
                          // Fallback when no location info at all
                          <div className="relative h-20 rounded-md overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center mb-2">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <span className="absolute bottom-1 text-[10px] text-gray-500">Bản đồ không khả dụng</span>
                          </div>
                        )}
                        
                        {/* View Map Button */}
                        {(eventDetail?.address || selectedEvent?.address || eventDetail?.locationName) && (
                          <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-md border-2 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-300 text-sm"
                                onClick={() => setIsMapModalOpen(true)}
                              >
                                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                                Xem bản đồ & chỉ đường chi tiết
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Bản đồ & Chỉ đường</DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                <MapDirection destinationAddress={eventDetail?.address || eventDetail?.locationName || selectedEvent?.address} />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TimelinePage;