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
  Flag,
} from "lucide-react";
import { showSuccess, showError } from "../../lib/toastUtils";
import eventAPI from "../../api/eventAPI";

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

  // Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetEvent, setReportTargetEvent] = useState(null);
  const [reportType, setReportType] = useState("Scam");
  const [reportReason, setReportReason] = useState("");
  const [reportAttachmentUrl, setReportAttachmentUrl] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

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
      // Convert dateFilter to UTC+7 for display
      const utc7Date = new Date(dateFilter);
      utc7Date.setHours(utc7Date.getHours() + 7);
      filters.push({
        key: "date",
        label: `ngày: ${utc7Date.toLocaleDateString("vi-VN")}`,
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

  const mapReportError = (err) => {
    const code = err?.response?.data?.code || err?.response?.data?.errorCode;
    const msg = err?.response?.data?.message || "";

    // Ưu tiên theo message cụ thể từ backend
    if (msg.includes("Event not found")) return "Không tìm thấy sự kiện hoặc không khả dụng.";
    if (msg.includes("only report after the event has ended")) return "Chỉ có thể báo cáo sau khi sự kiện đã kết thúc.";
    if (msg.includes("only report events you booked and join")) return "Bạn chỉ có thể báo cáo sự kiện bạn đã đặt và đã tham gia.";
    if (msg.includes("already reported")) return "Bạn đã báo cáo sự kiện này trước đó.";

    // Theo mã lỗi chuẩn
    switch (code) {
      case "AIE40401":
        return "Không tìm thấy sự kiện hoặc không khả dụng.";
      case "AIE40001":
        return "Dữ liệu không hợp lệ.";
      case "AIE40301":
        return "Bạn không có quyền thực hiện hành động này.";
      case "AIE40102":
      case "AIE40101":
        return "Bạn cần đăng nhập để tiếp tục.";
      case "AIE50001":
        return "Lỗi hệ thống. Vui lòng thử lại sau.";
      default:
        return "Không thể gửi báo cáo. Vui lòng thử lại.";
    }
  };

  const openReportModal = (event) => {
    setReportTargetEvent(event);
    setReportType("Scam");
    setReportReason("");
    setReportAttachmentUrl("");
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportTargetEvent(null);
  };

  const handleSubmitReport = async () => {
    if (!reportTargetEvent?.eventId) {
      showError("Thiếu thông tin sự kiện để báo cáo.");
      return;
    }
    if (!reportReason.trim()) {
      showError("Vui lòng nhập lý do báo cáo.");
      return;
    }
    try {
      setSubmittingReport(true);
      await eventAPI.reportEvent({
        eventId: reportTargetEvent.eventId,
        type: reportType,
        reason: reportReason.trim(),
        attachmentUrl: reportAttachmentUrl.trim(),
      });
      showSuccess("Đã gửi báo cáo. Cảm ơn bạn đã phản hồi.");
      closeReportModal();
    } catch (err) {
      console.error("reportEvent error:", err);
      showError(mapReportError(err));
    } finally {
      setSubmittingReport(false);
    }
  };

  const fetchUserReports = async (eventId) => {
    try {
      setLoadingReports(true);
      const reports = await eventAPI.getUserReports(eventId);
      setUserReports(Array.isArray(reports) ? reports : []);
    } catch (err) {
      console.error("getUserReports error:", err);
      setUserReports([]);
      showError("Không thể tải báo cáo.");
    } finally {
      setLoadingReports(false);
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
        // Convert both dates to UTC+7 for comparison
        const eventDate = new Date(ev.startTime);
        eventDate.setHours(eventDate.getHours() + 7);
        
        const filterDate = new Date(dateFilter);
        filterDate.setHours(filterDate.getHours() + 7);
        
        if (
          eventDate.getDate() !== filterDate.getDate() ||
          eventDate.getMonth() !== filterDate.getMonth() ||
          eventDate.getFullYear() !== filterDate.getFullYear()
        ) {
          return false;
        }
      }
      if (timeFilter) {
        // Convert event time to UTC+7 for comparison
        const eventDate = new Date(ev.startTime);
        eventDate.setHours(eventDate.getHours() + 7);
        const eventTime = eventDate.toLocaleTimeString("vi-VN", {
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

  useEffect(() => {
    if (showReports && selectedEvent?.eventId) {
      fetchUserReports(selectedEvent.eventId);
    } else {
      setUserReports([]);
    }
  }, [showReports, selectedEvent]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    // Convert UTC date to UTC+7
    const date = new Date(dateString);
    date.setHours(date.getHours() + 7); // Add 7 hours for UTC+7
    
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

  const renderUserReportsSection = () => {
    if (!showReports) return null;
  
    return (
      <div className="mt-8 border rounded-lg overflow-hidden">
        <div className="bg-red-50 px-5 py-3 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2 text-red-700">
            <Flag className="w-5 h-5" />
            Báo cáo của bạn
          </h3>
        </div>
  
        <div className="divide-y">
          {loadingReports ? (
            <div className="p-6 space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          ) : userReports.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Flag className="w-14 h-14 mx-auto mb-3 text-gray-300" />
              <p className="text-sm italic">Bạn chưa gửi báo cáo nào cho sự kiện này.</p>
            </div>
          ) : (
            userReports.map((report, idx) => {
              // Convert createdAt to UTC+7
              const createdAt = new Date(report.createdAt);
              createdAt.setHours(createdAt.getHours() + 7);
              const dateStr = createdAt.toLocaleDateString("vi-VN");
              const timeStr = createdAt.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              });
  
              const reportTypeLabel = {
                Scam: "Lừa đảo",
                FakeInfo: "Thông tin sai lệch",
                Reactionary: "Phản động",
                SexualHarassment: "Quấy rối tình dục",
                Violence: "Bạo lực",
                Inappropriate: "Không phù hợp",
                Other: "Khác",
              }[report.type] || report.type;
  
              return (
                <div
                  key={idx}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Cột 1: Thông tin người báo */}
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">Người báo:</span>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {report.userName || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Email:</span>
                        <p className="text-gray-900 mt-0.5 break-all">
                          {report.userEmail || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Thời gian gửi:</span>
                        <p className="text-gray-900 mt-0.5">
                          {dateStr} lúc {timeStr}
                        </p>
                      </div>
                    </div>
  
                    {/* Cột 2: Nội dung báo cáo */}
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">Loại báo cáo:</span>
                        <div className="mt-1">
                          <span className="inline-block px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                            {reportTypeLabel}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Lý do:</span>
                        <p className="mt-1 text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {report.reason || "(Không có lý do)"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Minh chứng:</span>
                        <p className="mt-1">
                          {report.attachmentUrl ? (
                            <a
                              href={report.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                            >
                              Xem liên kết
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Không có</span>
                          )}
                        </p>
                      </div>
                    </div>
  
                    {/* Cột 3: Phản hồi hệ thống */}
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">Phản hồi từ hệ thống:</span>
                        <div className="mt-1 p-1.5 bg-gray-10 border border-gray-400 rounded-md min-h-[3rem] flex items-center">
                          {report.reply ? (
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {report.reply}
                            </p>
                          ) : (
                            <span className="text-gray-400 italic text-sm">
                              Chưa có phản hồi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const reportModal = showReportModal ? (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      onClick={closeReportModal}
    >
      <div
        className="w-full max-w-lg rounded-md bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-lg font-bold">Báo cáo sự kiện</h3>
          <p className="text-sm text-gray-600 mt-1">{reportTargetEvent?.title}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại báo cáo
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Scam">Lừa đảo</option>
              <option value="FakeInfo">Thông tin sai lệch</option>
              <option value="Reactionary">Phản động</option>
              <option value="SexualHarassment">Quấy rối tình dục</option>
              <option value="Violence">Bạo lực</option>
              <option value="Inappropriate">Không phù hợp</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do
            </label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              placeholder="Mô tả vấn đề bạn gặp phải..."
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liên kết minh chứng (tùy chọn)
            </label>
            <input
              type="url"
              value={reportAttachmentUrl}
              onChange={(e) => setReportAttachmentUrl(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (text) {
                  e.preventDefault();
                  setReportAttachmentUrl(text);
                }
              }}
              autoComplete="off"
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={closeReportModal}>
            Hủy
          </Button>
          <Button onClick={handleSubmitReport} disabled={submittingReport}>
            {submittingReport ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // If event is selected, show ticket details
  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {reportModal}
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
            <Button
              variant={showReports ? "default" : "outline"}
              size="sm"
              onClick={() => setShowReports(!showReports)}
              disabled={!selectedEvent}
            >
              <Flag className="w-4 h-4 mr-2" />
              Xem báo cáo
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
                    // Convert selectedEvent.startTime to UTC+7 for comparison
                    const eventStartTime = new Date(selectedEvent.startTime);
                    eventStartTime.setHours(eventStartTime.getHours() + 7);
                    const isOnSale = eventStartTime > new Date();

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
                              <h3 className="font-bold text-black mb-3 leading-normal flex-shrink-0" style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>
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

          {/* User Reports Section (shared) */}
          {renderUserReportsSection()}
        </div>

      </div>
    );
  }

  // Main events list view
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {reportModal}
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

                return (
                  <Card
                    key={event.eventId}
                    className="cursor-pointer overflow-hidden rounded-none shadow-lg hover:shadow-xl transition-shadow bg-transparent border-0"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex h-64">
                      {/* Left Section - Event Image (40%) */}
                      <div className="w-[40%] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                        <button
                          type="button"
                          className="absolute left-0 top-0 z-10 inline-flex items-center justify-center rounded-full p-2 text-red-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReportModal(event);
                          }}
                          title="Báo cáo sự kiện"
                        >
                          <Flag className="h-4 w-4" />
                        </button>
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
                          <h3 className="font-bold text-black mb-3 leading-normal" style={{ fontSize: '1.9rem', lineHeight: '1.2' }}>
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
                      // Convert event.startTime to UTC+7 for comparison
                      const eventStartTime = new Date(event.startTime);
                      eventStartTime.setHours(eventStartTime.getHours() + 7);
                      const isUpcoming = eventStartTime > new Date();
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
                            <div className="mt-3 flex gap-2">
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
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReportModal(event);
                                }}
                              >
                                Báo cáo
                              </Button>
                            </div>
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