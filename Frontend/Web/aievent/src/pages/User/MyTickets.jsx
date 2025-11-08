import React, { useEffect, useMemo, useState } from "react";
import bookingAPI from "../../api/bookingAPI";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";

import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { motion } from "framer-motion";

const PAGE_SIZE = 6;

export default function MyTickets() {
  const navigate = useNavigate();

  // Data
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // UI states
  const [query, setQuery] = useState("");
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // QR modal
  const [selectedTicketForModal, setSelectedTicketForModal] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    // load events
    const load = async () => {
      try {
        setLoadingEvents(true);
        const res = await bookingAPI.getEvents();
        const items = res?.items || [];
        setEvents(items);
        if (items.length > 0) {
          setSelectedEvent(items[0]);
        }
      } catch (err) {
        console.error("getEvents error:", err);
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // when selectedEvent changes, load its tickets
    if (!selectedEvent) {
      setTickets([]);
      return;
    }
    const loadTickets = async () => {
      try {
        setLoadingTickets(true);
        const res = await bookingAPI.getEventTickets(selectedEvent.eventId);
        const t = res?.tickets || [];
        setTickets(t);
        setPage(1);
      } catch (err) {
        console.error("getEventTickets error:", err);
        setTickets([]);
      } finally {
        setLoadingTickets(false);
      }
    };
    loadTickets();
  }, [selectedEvent]);

  // Derived
  const now = useMemo(() => new Date(), []);
  const enhancedTickets = useMemo(
    () =>
      tickets.map((t) => {
        const start = new Date(selectedEvent?.startTime || now);
        return {
          ...t,
          _isUpcoming: start >= now,
        };
      }),
    [tickets, selectedEvent, now]
  );

  const filtered = useMemo(() => {
    return enhancedTickets.filter((t) => {
      if (statusFilter !== "all") {
        const map =
          statusFilter === "valid"
            ? "Valid"
            : statusFilter === "used"
            ? "Used"
            : statusFilter === "expired"
            ? "Expired"
            : null;
        if (map && t.status !== map) return false;
      }
      if (onlyUpcoming && !t._isUpcoming) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !(
            (t.ticketCode || "").toLowerCase().includes(q) ||
            (t.ticketTypeName || "").toLowerCase().includes(q) ||
            (selectedEvent?.title || "").toLowerCase().includes(q)
          )
        )
          return false;
      }
      return true;
    });
  }, [enhancedTickets, statusFilter, onlyUpcoming, query, selectedEvent]);

  // Nhóm vé theo loại
  const ticketTypes = useMemo(() => {
    const types = Array.from(
      new Set((filtered || []).map((t) => t.ticketTypeName || "Standard"))
    );
    return types.length ? types : ["Standard"];
  }, [filtered]);

  const [activeType, setActiveType] = useState(ticketTypes[0]);

  // when ticketTypes update, ensure activeType valid
  useEffect(() => {
    if (ticketTypes.length === 0) return;
    if (!ticketTypes.includes(activeType)) setActiveType(ticketTypes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketTypes.join("|")]);

  // paging for activeType
  const ticketsOfType = useMemo(
    () =>
      filtered.filter((t) => (t.ticketTypeName || "Standard") === activeType),
    [filtered, activeType]
  );
  const totalPages = Math.max(1, Math.ceil(ticketsOfType.length / PAGE_SIZE));
  const pageItems = (arr) => {
    const start = (page - 1) * PAGE_SIZE;
    return arr.slice(start, start + PAGE_SIZE);
  };

  // show qr modal
  const handleViewQR = async (ticket) => {
    setSelectedTicketForModal(ticket);
    setQrCode(null);
    try {
      setQrLoading(true);
      const res = await bookingAPI.getTicketQR(ticket.ticketId);
      setQrCode(res?.qrCode || null);
    } catch (err) {
      console.error("getTicketQR err", err);
      setQrCode(null);
    } finally {
      setQrLoading(false);
    }
  };

  // download a single ticket
  const handlePrintTicket = async (ticket) => {
    try {
      //  Lấy ID vé
      const ticketId =
        ticket?.ticketId || ticket?.id || ticket?._id || ticket?.ticket_id;

      if (!ticketId) {
        console.error("❌ Không tìm thấy ID vé:", ticket);
        alert("Thiếu ID vé để in. Vui lòng thử lại.");
        return;
      }

      //  Gọi API để lấy mã QR
      const res = await bookingAPI.getTicketQR(ticketId);
      const qrImg = res?.qrCode; // vì bookingAPI.js trả về response.data.data

      if (!qrImg) {
        alert("Không thể lấy mã QR cho vé này.");
        return;
      }

      //  Dữ liệu vé
      const evTitle = ticket.eventTitle || "Sự kiện";
      const priceText = ticket.price
        ? new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(ticket.price)
        : "-";

      //  HTML in vé
      const html = `
      <html>
        <head>
          <title>Vé - ${ticket.ticketCode || ticketId}</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #f9fafb;
              padding: 48px;
            }
            .ticket-card {
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 32px;
              max-width: 520px;
              margin: 0 auto;
              box-shadow: 0 6px 24px rgba(0,0,0,0.08);
            }
            h1 {
              font-size: 22px;
              margin-bottom: 6px;
              color: #111827;
            }
            .muted {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .price {
              color: #111827;
              font-weight: 600;
              margin-top: 6px;
              font-size: 16px;
            }
            .qr-wrapper {
              text-align: center;
              margin: 24px 0;
            }
            img.qr {
              width: 220px;
              height: 220px;
              object-fit: contain;
              border: 8px solid #f3f4f6;
              border-radius: 12px;
            }
            .footer {
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <h1>${evTitle}</h1>
            <div class="muted">Mã vé: ${ticket.ticketCode || ticketId}</div>
            <div class="muted">Loại vé: ${
              ticket.ticketTypeName || "Tiêu chuẩn"
            }</div>
            <div class="price">Giá: ${priceText}</div>

            <div class="qr-wrapper">
              <img class="qr" src="${qrImg}" alt="QR Code Vé" />
              <div class="muted" style="margin-top:8px;">Quét mã này để check-in</div>
            </div>

            <div class="footer">In lúc: ${new Date().toLocaleString(
              "vi-VN"
            )}</div>
          </div>
        </body>
      </html>
    `;

      //  Mở cửa sổ in
      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();

      //  In sau khi QR load xong
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
    // simple ICS download
    try {
      const start = new Date(selectedEvent?.startTime || now);
      const end = new Date(start.getTime() + 1000 * 60 * 60 * 2); // +2h default
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
      a.download = `${selectedEvent?.title || "event"}.ics`;
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
      // fallback: copy text
      await navigator.clipboard.writeText(
        `${shareData.title}\n${shareData.text}\n${shareData.url}`
      );
      alert("Thông tin vé đã được sao chép. Bạn có thể dán chia sẻ.");
    }
  };

  // counts for overview
  const upcomingCount = filtered.filter((t) => t._isUpcoming).length;
  const pastCount = filtered.filter((t) => !t._isUpcoming).length;
  const totalPrice = tickets.reduce((s, t) => s + (t.price || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-6 mb-6">
          {/* Tiêu đề bên trái */}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
              Vé của tôi
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý vé, tải PDF, xem mã QR.
            </p>
          </div>

          {/* Select sự kiện bên phải */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 px-4 py-3 rounded-xl border border-sky-100 shadow-sm">
            <div className="text-sm font-medium text-gray-700">Sự kiện:</div>
            <select
              value={selectedEvent?.eventId || ""}
              onChange={(e) => {
                const ev = events.find((x) => x.eventId === e.target.value);
                setSelectedEvent(ev || null);
              }}
              className="px-3 py-2 rounded-md border border-sky-200 bg-white text-gray-800 shadow-inner focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            >
              {loadingEvents ? (
                <option>Đang tải...</option>
              ) : (
                events.map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Tìm mã vé, loại vé, sự kiện..."
              className="px-3 py-2 rounded-md border border-gray-300 bg-gradient-to-r from-slate-50 to-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 w-64 transition"
            />
            <button
              onClick={() => setOnlyUpcoming((s) => !s)}
              className={`px-3 py-2 rounded-md border transition-all font-medium ${
                onlyUpcoming
                  ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow"
                  : "bg-white hover:bg-sky-50 text-gray-700"
              }`}
            >
              {onlyUpcoming ? "Chỉ sắp tới" : "Tất cả"}
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 bg-gradient-to-r from-white to-slate-50 focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="valid">Còn hiệu lực</option>
              <option value="used">Đã dùng</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>

          {/* Thống kê nhỏ */}
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="bg-gradient-to-r from-sky-100 to-indigo-100 rounded-lg px-3 py-2 shadow-sm border border-sky-200">
              Tổng vé: <strong>{tickets.length}</strong>
            </div>
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg px-3 py-2 shadow-sm border border-indigo-200">
              Sự kiện: <strong>{events.length}</strong>
            </div>
          </div>
        </div>
        {/* Tabs by ticket type */}
        <div className="space-y-4">
          <Tabs
            value={activeType}
            onValueChange={(v) => {
              setActiveType(v);
              setPage(1);
            }}
          >
            <div className="bg-white p-2 rounded-md flex flex-wrap gap-2">
              {ticketTypes.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="px-3 py-2 rounded-md data-[state=active]:bg-sky-600 data-[state=active]:text-white"
                >
                  {t}
                </TabsTrigger>
              ))}
            </div>

            <div className="mt-4">
              {loadingTickets ? (
                <div className="grid grid-cols-1 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-40 bg-white rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : ticketsOfType.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  Không có vé cho loại này.
                </div>
              ) : (
                <>
                  {/* Ticket list */}
                  <div className="space-y-4">
                    {pageItems(ticketsOfType).map((ticket, idx) => (
                      <motion.div
                        key={ticket.ticketId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                        id={`ticket-pdf-${ticket.ticketId}`}
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* image */}
                          <div className="md:w-64 h-56 md:h-auto">
                            <img
                              src={selectedEvent?.image || "/placeholder.svg"}
                              alt={selectedEvent?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* details */}
                          <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-xl font-semibold text-gray-800">
                                    {selectedEvent?.title}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span
                                      className={`px-3 py-[2px] text-xs rounded-full font-medium ${
                                        ticket.status === "Valid"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : ticket.status === "Used"
                                          ? "bg-gray-200 text-gray-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {ticket.status === "Valid"
                                        ? "Còn hiệu lực"
                                        : ticket.status === "Used"
                                        ? "Đã dùng"
                                        : "Hết hạn"}
                                    </span>
                                    <Badge variant="outline">
                                      {ticket.ticketTypeName || "Standard"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-700">
                                  <div className="text-sm text-gray-500">
                                    Giá vé
                                  </div>
                                  <div className="font-semibold">
                                    {ticket.price
                                      ? new Intl.NumberFormat("vi-VN").format(
                                          ticket.price
                                        ) + "đ"
                                      : "Miễn phí"}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {new Date(
                                        selectedEvent?.startTime ||
                                          selectedEvent?.date ||
                                          ticket.date ||
                                          now
                                      ).toLocaleDateString("vi-VN")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {selectedEvent?.startTime
                                        ? new Date(
                                            selectedEvent.startTime
                                          ).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : ticket.time}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="truncate max-w-[18rem]">
                                      {selectedEvent?.address ||
                                        ticket.location ||
                                        "Địa điểm không xác định"}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Mã vé
                                    </p>
                                    <p className="font-mono text-sm text-gray-800 break-all">
                                      {ticket.ticketCode ||
                                        ticket.qrCode ||
                                        ticket.ticketCode}
                                    </p>
                                  </div>

                                  {ticket.seatNumber && (
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Ghế
                                      </p>
                                      <p className="text-sm text-gray-700">
                                        {ticket.seatNumber}
                                      </p>
                                    </div>
                                  )}

                                  {ticket.checkInTime && (
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Check-in
                                      </p>
                                      <p className="text-sm text-gray-700">
                                        {new Date(
                                          ticket.checkInTime
                                        ).toLocaleString("vi-VN")}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* QR box inside card */}
                              {ticket.status === "Valid" && (
                                <div className="bg-slate-50 border rounded-xl p-4 mb-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold mb-1">
                                        Mã QR Check-in
                                      </h4>
                                      <p className="text-sm text-gray-500">
                                        Xuất trình mã này tại cổng vào
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-white">
                                        <QrCode className="w-8 h-8 text-gray-400" />
                                      </div>
                                      <button
                                        onClick={() => handleViewQR(ticket)}
                                        className="mt-2 px-3 py-1 text-xs rounded-md bg-sky-600 text-white hover:bg-sky-700"
                                      >
                                        Hiển thị QR
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* actions */}
                            <div className="flex flex-wrap gap-2">
                              {ticket.status === "Valid" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleViewQR(ticket)}
                                  className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
                                >
                                  <QrCode className="w-4 h-4 mr-2" /> Hiển thị
                                  QR
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddToCalendar(ticket)}
                              >
                                <Calendar className="w-4 h-4 mr-2" /> Thêm vào
                                lịch
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintTicket(ticket)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                In / Tải vé
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShare(ticket)}
                              >
                                <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  navigate(`/event/${selectedEvent?.eventId}`)
                                }
                              >
                                Xem chi tiết sự kiện
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Hiển thị {ticketsOfType.length} vé
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="p-2 rounded-md border"
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-sm">
                        Trang {page}/{totalPages}
                      </div>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="p-2 rounded-md border"
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Tabs>
        </div>

        {/* Overview */}
        <div className="mt-6 rounded-2xl bg-white p-4 border">
          <div className="text-sm text-gray-600">Tổng quan</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-gray-500">Vé sắp tới</div>
              <div className="text-lg font-bold">{upcomingCount}</div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-gray-500">Vé đã qua</div>
              <div className="text-lg font-bold">{pastCount}</div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-gray-500">Tổng giá vé</div>
              <div className="text-lg font-bold">
                {totalPrice === 0
                  ? "-"
                  : new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(totalPrice)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {selectedTicketForModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setSelectedTicketForModal(null);
              setQrCode(null);
            }}
          />
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6"
          >
            <button
              className="absolute right-4 top-4 p-2 rounded-full bg-gray-100"
              onClick={() => {
                setSelectedTicketForModal(null);
                setQrCode(null);
              }}
            >
              <span className="sr-only">Close</span>✕
            </button>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <div className="h-56 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                  {selectedEvent?.image ? (
                    <img
                      src={selectedEvent.image}
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">No image</div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-500">Mã vé</div>
                  <div className="font-semibold">
                    {selectedTicketForModal.ticketCode}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">Loại</div>
                  <div>
                    {selectedTicketForModal.ticketTypeName || "Tiêu chuẩn"}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {selectedEvent?.title}
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(selectedEvent?.startTime || now).toLocaleString()}
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-500">Trạng thái</div>
                  <div className="font-medium">
                    {selectedTicketForModal.status}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-500">Giá</div>
                  <div className="font-medium">
                    {selectedTicketForModal.price
                      ? new Intl.NumberFormat("vi-VN").format(
                          selectedTicketForModal.price
                        ) + "đ"
                      : "-"}
                  </div>
                </div>

                <div className="mt-6">
                  {qrLoading ? (
                    <div className="py-6 text-center text-gray-500">
                      Đang tải mã QR...
                    </div>
                  ) : qrCode ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={qrCode}
                        alt="QR"
                        className="w-48 h-48 object-contain border rounded-md"
                      />
                      <div className="text-sm text-green-600">
                        Quét mã để check-in
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Chưa có mã QR — nhấn "Hiển thị QR" để tải.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => handleViewQR(selectedTicketForModal)}
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
                  >
                    {qrLoading ? "Đang tải..." : "Hiển thị QR"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePrintTicket(selectedTicketForModal)}
                  >
                    Tải vé PDF
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
