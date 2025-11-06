import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import bookingAPI from "../../api/bookingAPI";
import {
  Calendar,
  MapPin,
  Clock,
  QrCode,
  Ticket,
  X,
  Search,
  Download,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const PAGE_SIZE = 6;

export default function MyTickets() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await bookingAPI.getEvents();
        const items = res.items || [];
        setEvents(items);
        if (items.length > 0) handleSelectEvent(items[0], { silent: true });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSelectEvent = async (event, { silent } = {}) => {
    setSelectedEvent(event);
    setTickets([]);
    try {
      if (!silent) setTicketLoading(true);
      const res = await bookingAPI.getEventTickets(event.eventId);
      setTickets(res.tickets || []);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setTicketLoading(false);
    }
  };

  const handleViewQR = async (ticket) => {
    try {
      setSelectedTicket(ticket);
      setQrLoading(true);
      const res = await bookingAPI.getTicketQR(ticket.ticketId);
      setQrCode(res?.qrCode);
    } catch (err) {
      setQrCode(null);
    } finally {
      setQrLoading(false);
    }
  };

  const now = useMemo(() => new Date(), []);
  const enhancedTickets = useMemo(() => {
    return tickets.map((t) => {
      const evStart = new Date(selectedEvent?.startTime || now);
      const isUpcoming = evStart >= now;
      return { ...t, _isUpcoming: isUpcoming };
    });
  }, [tickets, selectedEvent, now]);

  const filtered = enhancedTickets.filter((t) => {
    if (statusFilter !== "all") {
      const statusKey =
        statusFilter === "valid"
          ? "Valid"
          : statusFilter === "used"
          ? "Used"
          : statusFilter === "expired"
          ? "Expired"
          : null;
      if (statusKey && t.status !== statusKey) return false;
    }
    if (onlyUpcoming && !t._isUpcoming) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (
        !(
          t.ticketCode?.toLowerCase().includes(q) ||
          (t.ticketTypeName || "").toLowerCase().includes(q) ||
          (selectedEvent?.title || "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }
    }
    return true;
  });

  const upcomingTickets = filtered.filter((t) => t._isUpcoming);
  const totalPages = Math.max(
    1,
    Math.ceil(
      (onlyUpcoming ? upcomingTickets.length : filtered.length) / PAGE_SIZE
    )
  );

  const pageItems = (items) => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-white">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400 text-white py-12 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full shadow-inner">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Vé của tôi
                </h1>
                <p className="text-sm text-white/90">
                  Quản lý vé, xem mã QR và thao tác nhanh.
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/20 px-3 py-2 rounded-lg text-sm">
                Tổng sự kiện: <strong>{events.length}</strong>
              </div>
              <div className="bg-white/20 px-3 py-2 rounded-lg text-sm">
                Tổng vé:{" "}
                <strong>
                  {events.reduce(
                    (sum, ev) => sum + (ev.totalTickets || 0),
                    0
                  ) || tickets.length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl bg-white/70 backdrop-blur-md p-5 border border-white/30 shadow-lg">
            <h3 className="font-semibold mb-3">Sự kiện đã mua vé</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded-md animate-pulse"
                  />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-sm text-gray-500">
                Bạn chưa có sự kiện nào.
              </div>
            ) : (
              <div className="space-y-3 max-h-[56vh] overflow-auto pr-1">
                {events.map((ev) => (
                  <button
                    key={ev.eventId}
                    onClick={() => handleSelectEvent(ev)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start gap-3 ${
                      selectedEvent?.eventId === ev.eventId
                        ? "bg-gradient-to-r from-sky-100 to-indigo-50 border border-sky-300 shadow"
                        : "hover:bg-sky-50"
                    }`}
                  >
                    <div className="w-12 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                      {ev.image ? (
                        <img
                          src={ev.image}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Calendar className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm truncate">
                        {ev.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ev.startTime).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search + Filters */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-md p-4 border border-white/30 shadow-lg">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 opacity-70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã vé, loại vé, sự kiện..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <div className="mt-3 text-sm flex items-center justify-between">
              <label className="text-xs text-gray-600">
                Chỉ hiển thị sắp tới
              </label>
              <button
                onClick={() => setOnlyUpcoming((s) => !s)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  onlyUpcoming
                    ? "bg-sky-100 border-sky-300"
                    : "bg-white border-gray-200"
                }`}
              >
                {onlyUpcoming ? "On" : "Off"}
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-600">Trạng thái</label>
              <div className="mt-2 flex gap-2">
                {["all", "valid", "used", "expired"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs px-2 py-1 rounded-md border ${
                      statusFilter === s
                        ? "bg-sky-100 border-sky-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {s === "all"
                      ? "Tất cả"
                      : s === "valid"
                      ? "Còn hiệu lực"
                      : s === "used"
                      ? "Đã dùng"
                      : "Hết hạn"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="lg:col-span-3 space-y-6">
          {/* Event Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/80 p-6 border border-gray-100 shadow"
          >
            {selectedEvent ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100">
                    {selectedEvent.image ? (
                      <img
                        src={selectedEvent.image}
                        alt={selectedEvent.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Calendar className="w-6 h-6 text-gray-400 mx-auto mt-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {selectedEvent.title}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedEvent.startTime).toLocaleDateString(
                        "vi-VN"
                      )}
                      <span className="flex items-center gap-1 ml-3">
                        <MapPin className="w-4 h-4" />{" "}
                        <span className="truncate max-w-full md:max-w-[16rem]">
                          {selectedEvent.address ||
                            selectedEvent.locationName ||
                            "Địa điểm không xác định"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Chọn một sự kiện ở cột trái để xem vé
              </div>
            )}
          </motion.div>

          {/* Tickets */}
          <div className="rounded-2xl bg-white/80 p-6 border border-gray-100 shadow">
            {ticketLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="p-6 border rounded-xl bg-gray-50 animate-pulse h-40"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Không tìm thấy vé nào.
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Hiển thị{" "}
                    <strong>
                      {onlyUpcoming ? upcomingTickets.length : filtered.length}
                    </strong>{" "}
                    vé
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-md border"
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(onlyUpcoming
                    ? pageItems(upcomingTickets)
                    : pageItems(filtered)
                  ).map((ticket, idx) => (
                    <motion.article
                      key={ticket.ticketId}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative rounded-2xl overflow-hidden border border-gray-100 shadow hover:shadow-2xl transition bg-white flex flex-col justify-between"
                    >
                      <div className="p-5 bg-gradient-to-br from-white to-sky-50">
                        {/* Header của vé */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-md font-semibold text-gray-800 truncate"
                              title={ticket.ticketCode}
                            >
                              {ticket.ticketCode}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Loại: {ticket.ticketTypeName || "Tiêu chuẩn"}
                            </div>
                          </div>
                          {/* Trạng thái vé  */}
                          <div className="flex items-center">
                            <span
                              className={`px-3 py-[2px] text-xs rounded-full font-medium whitespace-nowrap ${
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
                          </div>
                        </div>

                        {/* Thông tin vé */}
                        <div className="mt-4 text-sm text-gray-600 space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-70" />
                            <span>
                              {new Date(
                                selectedEvent?.startTime || now
                              ).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 opacity-70" />
                            <span className="truncate max-w-full md:max-w-[16rem]">
                              {selectedEvent?.address ||
                                selectedEvent?.locationName ||
                                "Địa điểm không xác định"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 opacity-70" />
                            <span className="text-xs text-gray-500">
                              Ghế: {ticket.seatNumber || "Tự do"}
                            </span>
                          </div>
                        </div>

                        {/* Giá và nút QR */}
                        <div className="mt-6 flex items-center justify-between">
                          <div className="text-base font-medium text-gray-700">
                            {ticket.price
                              ? new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(ticket.price)
                              : "-"}
                          </div>
                          <button
                            onClick={() => handleViewQR(ticket)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm hover:opacity-90"
                          >
                            <QrCode className="w-4 h-4" /> Xem mã QR
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </>
            )}
          </div>

          {/*  Tổng quan  */}
          <div className="rounded-2xl bg-white/80 p-4 border border-gray-100 shadow">
            <div className="text-sm text-gray-600">Tổng quan</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border">
                <div className="text-xs text-gray-500">Vé sắp tới</div>
                <div className="text-lg font-bold">
                  {upcomingTickets.length}
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-xs text-gray-500">Vé đã qua</div>
                <div className="text-lg font-bold">
                  {filtered.filter((t) => !t._isUpcoming).length}
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-xs text-gray-500">Tổng giá vé</div>
                <div className="text-lg font-bold">
                  {tickets.reduce((s, t) => s + (t.price || 0), 0) === 0
                    ? "-"
                    : new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(
                        tickets.reduce((s, t) => s + (t.price || 0), 0)
                      )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* MODAL QR */}
      {selectedTicket && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Lớp nền mờ */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setSelectedTicket(null);
              setQrCode(null);
            }}
          />

          {/* nội dung */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-3xl w-full rounded-2xl bg-white p-8 shadow-2xl border border-gray-100"
          >
            {/* Nút đóng */}
            <button
              className="absolute right-4 top-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={() => {
                setSelectedTicket(null);
                setQrCode(null);
              }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Hình ảnh sự kiện */}
              <div className="w-full md:w-1/2">
                <div className="h-60 rounded-xl overflow-hidden shadow-md bg-gray-50 flex items-center justify-center">
                  {selectedEvent?.image ? (
                    <img
                      src={selectedEvent.image}
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Calendar className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                {/* Thông tin vé ngắn gọn */}
                <div className="mt-5 space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Mã vé:</span>{" "}
                    <span className="font-semibold break-all">
                      {selectedTicket.ticketCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Loại:</span>{" "}
                    <span>{selectedTicket.ticketTypeName || "Tiêu chuẩn"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ghế:</span>{" "}
                    <span>{selectedTicket.seatNumber || "Tự do"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Giá:</span>{" "}
                    <span className="font-medium">
                      {selectedTicket.price
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(selectedTicket.price)
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết + QR */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 leading-snug">
                    {selectedEvent?.title}
                  </h2>
                  <div className="flex items-center text-gray-600 text-sm mt-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(selectedEvent?.startTime || now).toLocaleString()}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="truncate max-w-full md:max-w-[20rem]">
                      {selectedEvent?.address ||
                        selectedEvent?.locationName ||
                        "Địa điểm không xác định"}
                    </span>
                  </div>

                  {/* Trạng thái vé */}
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">Trạng thái:</span>{" "}
                    <span
                      className={`px-3 py-[2px] rounded-full text-xs font-medium whitespace-nowrap ${
                        selectedTicket.status === "Valid"
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedTicket.status === "Used"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {selectedTicket.status === "Valid"
                        ? "Còn hiệu lực"
                        : selectedTicket.status === "Used"
                        ? "Đã dùng"
                        : "Hết hạn"}
                    </span>
                  </div>
                </div>

                {/* QR code hiển thị */}
                <div className="mt-6">
                  {qrLoading ? (
                    <div className="py-8 text-center text-gray-500">
                      Đang tải mã QR...
                    </div>
                  ) : qrCode ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={qrCode}
                        alt="QR"
                        className="w-44 h-44 object-contain"
                      />
                      <div className="text-sm text-green-600">
                        Quét mã để check-in
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center">
                      Chưa có mã QR — nhấn "Xem mã QR" để tải.
                    </div>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:opacity-90"
                    onClick={() => handleViewQR(selectedTicket)}
                  >
                    {qrLoading ? "Đang tải..." : "Mã QR"}
                  </button>

                  {/*  Nút xem chi tiết sự kiện */}
                  <button
                    onClick={() => {
                      navigate(`/event/${selectedEvent.eventId}`);
                    }}
                    className="px-4 py-2 rounded-md border border-sky-300 text-sky-600 hover:bg-sky-50"
                  >
                    Xem chi tiết sự kiện
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
