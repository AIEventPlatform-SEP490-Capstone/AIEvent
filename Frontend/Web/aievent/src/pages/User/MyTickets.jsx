import React, { useEffect, useMemo, useState } from "react";
import bookingAPI from "../../api/bookingAPI";
import { useNavigate } from "react-router-dom";
import loginPanelImage from "../../assets/loginpanel.jpg";

import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Table,
  Filter,
  Users,
  Ticket,
  ChevronDown,
  CircleAlert,
  ArrowLeft,
  X,
} from "lucide-react";

const PAGE_SIZE = 6;

export default function MyTickets() {
  const navigate = useNavigate();

  // Data
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // UI states
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  
  // Pagination for ticket types
  const [ticketTypePage, setTicketTypePage] = useState(1);
  const [ticketTypeItemsPerPage, setTicketTypeItemsPerPage] = useState(6);

  // Active filters
  const [activeFilters, setActiveFilters] = useState([]);
  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const renderEmailNotice = () => (
    <div className="mt-2 flex items-start gap-2">
      <button
        type="button"
        onClick={() => setShowEmailNotice((prev) => !prev)}
        className="inline-flex items-center justify-center rounded-full border border-yellow-300 bg-white p-1 text-yellow-600 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        aria-pressed={showEmailNotice}
        aria-label="Hiển thị hướng dẫn nhận vé điện tử"
      >
        <CircleAlert className="h-5 w-5" />
      </button>
      {showEmailNotice && (
        <p className="max-w-xl rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-600 shadow-sm">
          Vé điện tử của bạn sẽ được gửi tới email, vui lòng kiểm tra hộp thư, nếu không thấy xin vui lòng chờ trong ít phút và kiểm tra thư spam và thư rác.
        </p>
      )}
    </div>
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEvents(true);
        const res = await bookingAPI.getEvents();
        const items = res?.items || [];
        setEvents(items);
      } catch (err) {
        console.error("getEvents error:", err);
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setTickets([]);
      setTicketTypes([]);
      return;
    }
    const loadTickets = async () => {
      try {
        setLoadingTickets(true);
        const res = await bookingAPI.getEventTickets(selectedEvent.eventId);
        const t = res?.tickets || [];
        setTickets(t);
        
        // Group tickets by type
        const typesMap = {};
        t.forEach((ticket) => {
          const typeName = ticket.ticketTypeName || "Tiêu chuẩn";
          if (!typesMap[typeName]) {
            typesMap[typeName] = {
              name: typeName,
              tickets: [],
              price: ticket.price || 0,
              quantity: ticket.quantity || 0,
              sold: 0,
            };
          }
          typesMap[typeName].tickets.push(ticket);
          if (ticket.status === "Used") {
            typesMap[typeName].sold += 1;
          }
        });
        setTicketTypes(Object.values(typesMap));
        setPage(1);
        setTicketTypePage(1);
      } catch (err) {
        console.error("getEventTickets error:", err);
        setTickets([]);
        setTicketTypes([]);
      } finally {
        setLoadingTickets(false);
      }
    };
    loadTickets();
  }, [selectedEvent]);

  // Update active filters
  useEffect(() => {
    const filters = [];
    if (statusFilter !== "all") {
      filters.push({
        key: "status",
        label: `trạng thái: ${statusFilter === "valid" ? "còn hiệu lực" : statusFilter === "used" ? "đã dùng" : "hết hạn"}`,
        value: statusFilter,
      });
    }
    if (dateFilter) {
      filters.push({
        key: "date",
        label: `ngày: ${new Date(dateFilter).toLocaleDateString("vi-VN")}`,
        value: dateFilter,
      });
    }
    if (timeFilter) {
      filters.push({
        key: "time",
        label: `giờ: ${timeFilter}`,
        value: timeFilter,
      });
    }
    if (locationFilter) {
      filters.push({
        key: "location",
        label: `địa điểm: ${locationFilter}`,
        value: locationFilter,
      });
    }
    if (priceRangeFilter.min || priceRangeFilter.max) {
      const min = priceRangeFilter.min ? new Intl.NumberFormat("vi-VN").format(priceRangeFilter.min) + "đ" : "";
      const max = priceRangeFilter.max ? new Intl.NumberFormat("vi-VN").format(priceRangeFilter.max) + "đ" : "";
      filters.push({
        key: "price",
        label: `giá: ${min || "0"} - ${max || "∞"}`,
        value: priceRangeFilter,
      });
    }
    setActiveFilters(filters);
  }, [statusFilter, dateFilter, timeFilter, locationFilter, priceRangeFilter]);

  const removeFilter = (filterKey) => {
    if (filterKey === "status") {
      setStatusFilter("all");
    } else if (filterKey === "date") {
      setDateFilter("");
    } else if (filterKey === "time") {
      setTimeFilter("");
    } else if (filterKey === "location") {
      setLocationFilter("");
    } else if (filterKey === "price") {
      setPriceRangeFilter({ min: "", max: "" });
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!ev.title?.toLowerCase().includes(q)) return false;
      }
      if (dateFilter) {
        const eventDate = new Date(ev.startTime);
        const filterDate = new Date(dateFilter);
        if (
          eventDate.getDate() !== filterDate.getDate() ||
          eventDate.getMonth() !== filterDate.getMonth() ||
          eventDate.getFullYear() !== filterDate.getFullYear()
        ) {
          return false;
        }
      }
      if (timeFilter) {
        const eventTime = new Date(ev.startTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        if (!eventTime.includes(timeFilter)) return false;
      }
      if (locationFilter) {
        const location = (ev.address || "").toLowerCase();
        if (!location.includes(locationFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, query, dateFilter, timeFilter, locationFilter]);

  // Pagination
  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, page, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));

  // Pagination for ticket types
  const paginatedTicketTypes = useMemo(() => {
    const start = (ticketTypePage - 1) * ticketTypeItemsPerPage;
    return ticketTypes.slice(start, start + ticketTypeItemsPerPage);
  }, [ticketTypes, ticketTypePage, ticketTypeItemsPerPage]);

  const totalTicketTypePages = Math.max(1, Math.ceil(ticketTypes.length / ticketTypeItemsPerPage));

  // Reset ticket type page when filter changes
  useEffect(() => {
    setTicketTypePage(1);
  }, [statusFilter, query, dateFilter, timeFilter, locationFilter, priceRangeFilter]);

  // Download ticket
  const handlePrintTicket = async (ticket) => {
    try {
      const ticketId = ticket?.ticketId || ticket?.id || ticket?._id;
      if (!ticketId) {
        alert("Thiếu ID vé để in. Vui lòng thử lại.");
        return;
      }

      const res = await bookingAPI.getTicketQR(ticketId);
      const qrImg = res?.qrCode;

      if (!qrImg) {
        alert("Không thể lấy mã QR cho vé này.");
        return;
      }

      const evTitle = ticket.eventTitle || selectedEvent?.title || "Sự kiện";
      const evAddress = selectedEvent?.address || "";
      const eventDate = formatDate(selectedEvent?.startTime);
      const priceText = ticket.price
        ? new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(ticket.price)
        : "Miễn phí";

      const html = `
      <html>
        <head>
          <title>Vé - ${ticket.ticketCode || ticketId}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #f9fafb;
              padding: 48px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .ticket-container {
              max-width: 800px;
              width: 100%;
              border: 2px solid #000;
              overflow: hidden;
            }
            .ticket-content {
              display: flex;
              height: 300px;
            }
            .ticket-image {
              width: 40%;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .ticket-image img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .ticket-info {
              flex: 1;
              background: #F5F0ED;
              padding: 20px;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            .perforated-line {
              position: absolute;
              right: 80px;
              top: 0;
              bottom: 0;
              width: 2px;
              border-right: 2px dashed #000;
            }
            .perforated-line::before {
              content: '';
              position: absolute;
              top: -6px;
              left: -4px;
              width: 8px;
              height: 8px;
              background: #000;
              border-radius: 50%;
            }
            .perforated-line::after {
              content: '';
              position: absolute;
              bottom: -6px;
              left: -4px;
              width: 8px;
              height: 8px;
              background: #000;
              border-radius: 50%;
            }
            .ticket-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .ticket-type {
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .ticket-address {
              font-size: 10px;
              text-align: right;
              max-width: 40%;
            }
            .ticket-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
              line-height: 1.2;
            }
            .ticket-pills {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              margin-top: auto;
              margin-bottom: 10px;
            }
            .pill {
              padding: 6px 16px;
              border: 2px solid #000;
              border-radius: 20px;
              font-size: 10px;
              font-weight: 600;
              background: #F5F0ED;
            }
            .ticket-code {
              font-size: 10px;
              color: rgba(0,0,0,0.7);
              margin-top: 8px;
            }
            .qr-stub {
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 80px;
              background: #fff;
              border-left: 2px dashed #000;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 10px;
            }
            .qr-stub img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            @media print {
              body {
                padding: 0;
              }
              .ticket-container {
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="ticket-content">
              <div class="ticket-image">
                ${selectedEvent?.image ? `<img src="${selectedEvent.image}" alt="${evTitle}" />` : `<img src="${loginPanelImage}" alt="Default event image" />`}
              </div>
              <div class="ticket-info">
                <div class="perforated-line"></div>
                <div class="ticket-header">
                  <div class="ticket-type">${ticket.ticketTypeName || "VÉ SỰ KIỆN"}</div>
                  ${evAddress ? `<div class="ticket-address">${evAddress}</div>` : ''}
                </div>
                <div class="ticket-title">${evTitle}</div>
                <div class="ticket-pills">
                  <div class="pill">${eventDate.date} ${eventDate.month.toUpperCase()}</div>
                  <div class="pill">${eventDate.time}</div>
                  <div class="pill">${priceText}</div>
                </div>
                <div class="ticket-code">Mã vé: <strong>${ticket.ticketCode || ticketId}</strong></div>
                <div class="qr-stub">
                  <img src="${qrImg}" alt="QR Code" />
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();

      setTimeout(() => {
        w.focus();
        w.print();
      }, 600);
    } catch (err) {
      console.error("❌ Lỗi in vé:", err);
      alert("Không thể in vé. Vui lòng thử lại.");
    }
  };

  const handleAddToCalendar = (ticket) => {
    try {
      const start = new Date(selectedEvent?.startTime || new Date());
      const end = new Date(start.getTime() + 1000 * 60 * 60 * 2);
      const pad = (n) => (n < 10 ? `0${n}` : n);
      const toICSDate = (d) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
          d.getUTCDate()
        )}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MyTickets//EN",
        "BEGIN:VEVENT",
        `UID:${ticket.ticketId}@mytickets`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${selectedEvent?.title || ""}`,
        `LOCATION:${selectedEvent?.address || ""}`,
        `DESCRIPTION:Ticket ${ticket.ticketCode || ""}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedEvent?.title || "sự kiện"}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (ticket) => {
    const shareData = {
      title: selectedEvent?.title,
      text: `Mã vé: ${ticket.ticketCode}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("share failed", err);
      }
    } else {
      await navigator.clipboard.writeText(
        `${shareData.title}\n${shareData.text}\n${shareData.url}`
      );
      alert("Thông tin vé đã được sao chép. Bạn có thể dán chia sẻ.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const months = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // If event is selected, show ticket details
  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Vé của tôi - {selectedEvent.title}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý vé và loại vé của sự kiện {selectedEvent.title}
            </p>
            {renderEmailNotice()}
          </div>

          {/* View Options */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Xem dạng thẻ
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <Table className="w-4 h-4 mr-2" />
              Xem dạng bảng
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? "Ẩn" : "Hiện"} bộ lọc
            </Button>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">bộ lọc đang hoạt động:</span>
              {activeFilters.map((filter, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tìm kiếm
                  </label>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="valid">Còn hiệu lực</option>
                    <option value="used">Đã dùng</option>
                    <option value="expired">Hết hạn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ
                  </label>
                  <input
                    type="time"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {!selectedEvent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa điểm
                    </label>
                    <input
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="Nhập địa điểm..."
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khoảng giá (VNĐ)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={priceRangeFilter.min}
                      onChange={(e) => setPriceRangeFilter({ ...priceRangeFilter, min: e.target.value })}
                      placeholder="Từ"
                      className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={priceRangeFilter.max}
                      onChange={(e) => setPriceRangeFilter({ ...priceRangeFilter, max: e.target.value })}
                      placeholder="Đến"
                      className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Types - Card View */}
          {viewMode === "card" && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {loadingTickets ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-lg animate-pulse" />
                ))
              ) : paginatedTicketTypes.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500 py-12">
                  Không có loại vé nào.
                </div>
              ) : (
                paginatedTicketTypes.map((type) => {
                  const eventDate = formatDate(selectedEvent.startTime);
                  const isOnSale = new Date(selectedEvent.startTime) > new Date();
                  
                  return (
                    <Card key={type.name} className="overflow-hidden rounded-none shadow-lg hover:shadow-xl transition-shadow bg-transparent border-0">
                      <div className="flex h-64">
                        {/* Left Section - Event Image (40%) */}
                        <div className="w-[40%] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                          {selectedEvent?.image ? (
                            <img
                              src={selectedEvent.image}
                              alt={selectedEvent.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={loginPanelImage}
                              alt="Default event image"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Right Section - Ticket Type Info (60%) */}
                        <div className="flex-1 bg-[#F5F0ED] relative overflow-hidden">
                          <div className="h-full flex flex-col p-5">
                            {/* Top Section */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-sm font-bold text-black uppercase tracking-wide">
                                {type.name || "LOẠI VÉ"}
                              </div>
                              {selectedEvent?.address && (
                                <div className="text-sm text-black text-right max-w-[40%] font-medium">
                                  {selectedEvent.address}
                                </div>
                              )}
                            </div>

                            {/* Event Title */}
                            <h3 className="font-bold text-black mb-3 leading-normal flex-shrink-0" style={{ fontSize: '2.8rem', lineHeight: '1.2' }}>
                              {selectedEvent?.title || "Sự kiện"}
                            </h3>

                            {/* Info Pills */}
                            <div className="mt-auto flex gap-2 flex-wrap mb-2 flex-shrink-0">
                              <div className="px-3 py-1.5 border-2 border-black rounded-full text-xs font-bold text-black bg-white">
                                {eventDate.date} {eventDate.month.toUpperCase()}
                              </div>
                              <div className="px-3 py-1.5 border-2 border-black rounded-full text-xs font-bold text-black bg-white">
                                {eventDate.time}
                              </div>
                              <div className="px-3 py-1.5 border-2 border-black rounded-full text-xs font-bold text-black bg-white">
                                {type.price
                                  ? new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(type.price)
                                  : "Miễn phí"}
                              </div>
                            </div>

                            {/* Ticket Info */}
                            <div className="text-xs text-black/80 font-medium flex-shrink-0">
                              <div>Số lượng: <span className="font-bold">{type.quantity}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
            
            {/* Pagination for ticket types - Card View */}
            {ticketTypes.length > ticketTypeItemsPerPage && (
              <div className="flex items-center justify-between mb-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hiển thị:</span>
                  <select
                    value={ticketTypeItemsPerPage}
                    onChange={(e) => {
                      setTicketTypeItemsPerPage(Number(e.target.value));
                      setTicketTypePage(1);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={4}>4 / trang</option>
                    <option value={6}>6 / trang</option>
                    <option value={8}>8 / trang</option>
                    <option value={12}>12 / trang</option>
                  </select>
                  <span className="text-sm text-gray-500">
                    (Tổng: {ticketTypes.length} loại vé)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketTypePage((p) => Math.max(1, p - 1))}
                    disabled={ticketTypePage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Trang {ticketTypePage} / {totalTicketTypePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketTypePage((p) => Math.min(totalTicketTypePages, p + 1))}
                    disabled={ticketTypePage === totalTicketTypePages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {ticketTypes.length > 0 && ticketTypes.length <= ticketTypeItemsPerPage && (
              <div className="mb-6 pt-4 border-t">
                <div className="text-sm text-gray-500 text-center">
                  Hiển thị tất cả {ticketTypes.length} loại vé
                </div>
              </div>
            )}
            </>
          )}

          {/* Ticket Types - Table View */}
          {viewMode === "table" && (
            <>
            <div className="bg-white rounded-lg border overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bắt đầu bán
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Giá
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Số lượng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingTickets ? (
                      [...Array(4)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={4} className="px-4 py-4">
                            <div className="h-8 bg-gray-100 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : paginatedTicketTypes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Không có loại vé nào.
                        </td>
                      </tr>
                    ) : (
                      paginatedTicketTypes.map((type, idx) => {
                        const eventDate = formatDate(selectedEvent.startTime);
                        return (
                          <tr key={type.name} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {type.name}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {eventDate.day} {eventDate.date} {eventDate.month}, {eventDate.time}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {type.price
                                ? new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  }).format(type.price)
                                : "Miễn phí"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {type.quantity}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination for ticket types - Table View */}
            {ticketTypes.length > ticketTypeItemsPerPage && (
              <div className="flex items-center justify-between mb-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hiển thị:</span>
                  <select
                    value={ticketTypeItemsPerPage}
                    onChange={(e) => {
                      setTicketTypeItemsPerPage(Number(e.target.value));
                      setTicketTypePage(1);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={4}>4 / trang</option>
                    <option value={6}>6 / trang</option>
                    <option value={8}>8 / trang</option>
                    <option value={12}>12 / trang</option>
                  </select>
                  <span className="text-sm text-gray-500">
                    (Tổng: {ticketTypes.length} loại vé)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketTypePage((p) => Math.max(1, p - 1))}
                    disabled={ticketTypePage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Trang {ticketTypePage} / {totalTicketTypePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketTypePage((p) => Math.min(totalTicketTypePages, p + 1))}
                    disabled={ticketTypePage === totalTicketTypePages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {ticketTypes.length > 0 && ticketTypes.length <= ticketTypeItemsPerPage && (
              <div className="mb-6 pt-4 border-t">
                <div className="text-sm text-gray-500 text-center">
                  Hiển thị tất cả {ticketTypes.length} loại vé
                </div>
              </div>
            )}
            </>
          )}
        </div>

      </div>
    );
  }

  // Main events list view
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Vé của tôi</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý vé và sự kiện của bạn
          </p>
          {renderEmailNotice()}
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Xem dạng thẻ
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <Table className="w-4 h-4 mr-2" />
            Xem dạng bảng
          </Button>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            Hiển thị bộ lọc
          </Button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">bộ lọc đang hoạt động:</span>
            {activeFilters.map((filter, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm sự kiện
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm sự kiện..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ
                </label>
                <input
                  type="time"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa điểm
                </label>
                <input
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Nhập địa điểm..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Events List - Card View */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {loadingEvents ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-lg animate-pulse" />
              ))
            ) : paginatedEvents.length === 0 ? (
              <div className="col-span-2 text-center text-gray-500 py-12">
                Không có sự kiện nào.
              </div>
            ) : (
              paginatedEvents.map((event) => {
                const eventDate = formatDate(event.startTime);
                const isUpcoming = new Date(event.startTime) > new Date();
                
                return (
                  <Card
                    key={event.eventId}
                    className="cursor-pointer overflow-hidden rounded-none shadow-lg hover:shadow-xl transition-shadow bg-transparent border-0"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex h-64">
                      {/* Left Section - Event Image (40%) */}
                      <div className="w-[40%] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                        {event.image ? (
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={loginPanelImage}
                            alt="Default event image"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Right Section - Event Info (60%) */}
                      <div className="flex-1 bg-[#F5F0ED] relative">
                        <div className="h-full flex flex-col p-5">
                          {/* Top Section */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-sm font-bold text-black uppercase tracking-wide">
                              SỰ KIỆN
                            </div>
                            {event.address && (
                              <div className="text-sm text-black text-right max-w-[40%] font-medium">
                                {event.address}
                              </div>
                            )}
                          </div>

                          {/* Event Title */}
                          <h3 className="font-bold text-black mb-3 leading-normal" style={{ fontSize: '2.8rem', lineHeight: '1.2' }}>
                            {event.title}
                          </h3>

                          {/* Info Pills */}
                          <div className="mt-auto flex gap-2 flex-wrap mb-3">
                            <div className="px-3 py-1.5 border-2 border-black rounded-full text-xs font-bold text-black bg-[#F5F0ED]">
                              {eventDate.date} {eventDate.month.toUpperCase()}
                            </div>
                            <div className="px-3 py-1.5 border-2 border-black rounded-full text-xs font-bold text-black bg-[#F5F0ED]">
                              {eventDate.time}
                            </div>
                            <div className="px-3 py-1.5 border-2 border-black rounded-full text-xs font-bold text-black bg-[#F5F0ED]">
                              {eventDate.day}
                            </div>
                          </div>

                          {/* Description */}
                          {event.description && (
                            <div className="mt-1 text-xs text-black/80 font-medium line-clamp-2">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Events List - Table View */}
        {viewMode === "table" && (
          <div className="bg-white rounded-lg border overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên sự kiện
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngày diễn ra
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Địa điểm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingEvents ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-4 py-4">
                          <div className="h-8 bg-gray-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Không có sự kiện nào.
                      </td>
                    </tr>
                  ) : (
                    paginatedEvents.map((event, idx) => {
                      const eventDate = formatDate(event.startTime);
                      const isUpcoming = new Date(event.startTime) > new Date();
                      return (
                        <tr
                          key={event.eventId}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {event.title}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {eventDate.day} {eventDate.date} {eventDate.month}, {eventDate.time}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {event.address || "-"}
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={isUpcoming ? "default" : "secondary"}>
                              {isUpcoming ? "Sắp tới" : "Đã qua"}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                            >
                              Xem vé
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hiển thị:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={6}>6 / trang</option>
                <option value={12}>12 / trang</option>
                <option value={24}>24 / trang</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}