import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import {
  Calendar,
  MapPin,
  Clock,
  QrCode,
  Loader2,
  Ticket,
  Heart,
  Phone,
  Info,
  CheckCircle,
} from "lucide-react";
import {
  createBooking,
  selectBookingError,
} from "../../store/slices/bookingSlice";
import { eventAPI } from "../../api/eventAPI";
import { bookingAPI } from "../../api/bookingAPI";

function BookingFlow() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const error = useSelector(selectBookingError);

  // --- state (same logic retained) ---
  const [event, setEvent] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const creating = useSelector((state) => state.booking.creating);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setFetching(true);
        const data = await eventAPI.getEventById(id);
        setEvent(data);
      } catch (e) {
        console.error(e);
        setFetchError("Không thể tải thông tin sự kiện.");
      } finally {
        setFetching(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (fetching)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white text-indigo-600">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
          <p className="mt-3 text-lg">Đang tải thông tin sự kiện...</p>
        </div>
      </div>
    );

  if (fetchError || !event)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        {fetchError || "Không tìm thấy sự kiện."}
      </div>
    );

  // --- derived data ---
  const ticketTypes = event.ticketDetails || [];

  const totalPrice = ticketTypes.reduce((sum, t) => {
    const qty = Number(selectedTickets[t.ticketDetailId]) || 0;
    //  chỉ cộng nếu số lượng hợp lệ
    if (qty > 0 && qty <= (t.remainingQuantity || 0)) {
      return sum + qty * (t.ticketPrice || 0);
    }
    return sum;
  }, 0);

  const ticketTypeRequests = Object.entries(selectedTickets)
    .filter(([ticketTypeId, qty]) => {
      const type = ticketTypes.find((x) => x.ticketDetailId === ticketTypeId);
      return (
        Number(qty) > 0 && type && Number(qty) <= (type.remainingQuantity || 0)
      );
    })
    .map(([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity: Number(quantity),
    }));

  // --- handlers ---
  const handleBooking = async () => {
    setBookingError("");
    //  Kiểm tra không chọn vé nào
    if (ticketTypeRequests.length === 0) {
      setBookingError("Vui lòng chọn ít nhất một loại vé để đặt.");
      return;
    }
    try {
      const payload = { eventId: event.eventId, ticketTypeRequests };
      await dispatch(createBooking(payload)).unwrap();
      // Lấy danh sách vé mới sau khi đặt
      const ticketsResponse = await bookingAPI.getEventTickets(event.eventId);
      const tickets = ticketsResponse?.items?.[0]?.tickets || [];
      const latest = tickets[tickets.length - 1];
      // Lấy QR code vé
      const qrResponse = await bookingAPI.getTicketQR(latest.ticketId);
      setQrCode(qrResponse?.qrCode);
      setBookingComplete(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Booking failed:", err);
      setBookingError(
        "Đặt vé thất bại, vui lòng thử lại hoặc kiểm tra số dư ví."
      );
    }
  };

  // --- After booking success UI ---
  if (bookingComplete)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-indigo-50 text-center"
        >
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-indigo-700 mb-2">
            Đặt vé thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            Vé đã được gửi tới email của bạn. Vui lòng kiểm tra hoặc mở vé dưới
            đây.
          </p>

          <div className="bg-white rounded-xl border border-indigo-100 shadow-inner p-6 mb-6">
            {qrCode ? (
              <img src={qrCode} alt="QR" className="mx-auto w-44 h-44" />
            ) : (
              <p className="text-gray-500">Đang tải mã QR...</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl">
              <a href="/my-tickets">Xem vé của tôi</a>
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-lg rounded-xl"
            >
              <a href="/">Về trang chủ</a>
            </Button>
          </div>
        </motion.div>
      </div>
    );

  //   //  Layout chính
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white text-[0.95rem] md:text-[1rem]">
      {/* ---------- Banner (Hero) ---------- */}
      <div className="relative w-full h-[320px] md:h-[380px] lg:h-[420px] overflow-hidden">
        <img
          src={event.imgListEvent?.[0] || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover brightness-75"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          <div className="max-w-6xl w-full mx-auto text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.startTime).toLocaleDateString("vi-VN")} •{" "}
                      {new Date(event.startTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.locationName || "Không xác định"}</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <Button className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-4 py-2 rounded-lg">
                  <a href={`/event/${id}`}>Quay lại sự kiện</a>
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                  <a href="#tickets">Chọn vé ngay</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Progress bar ---------- */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="bg-white/60 backdrop-blur-md rounded-xl p-3 shadow-md border border-indigo-50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    1
                  </div>
                  <div className="text-sm">Chọn vé</div>
                </div>

                <div className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
                    style={{ width: "40%" }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-gray-600">
                    2
                  </div>
                  <div className="text-sm text-gray-600">Xác nhận</div>
                </div>

                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-100 rounded-full"
                    style={{ width: "0%" }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-gray-600">
                    3
                  </div>
                  <div className="text-sm text-gray-600">Hoàn tất</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Chọn vé và xác nhận --- */}
      <div className="max-w-6xl mx-auto px-4 mt-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trái Danh sách vé và thông tin */}
        <div className="lg:col-span-2" id="tickets">
          <Card className="rounded-3xl bg-white/80 backdrop-blur-xl border border-indigo-100 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Chọn vé
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Chọn loại vé và số lượng bạn muốn đặt. Giá đã gồm phí dịch
                    vụ (nếu có).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" /> Thêm vào yêu
                    thích
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {ticketTypes.map((t) => {
                  const selectedQty = Number(
                    selectedTickets[t.ticketDetailId] || 0
                  );
                  const isOver = selectedQty > t.remainingQuantity;

                  return (
                    <motion.div
                      key={t.ticketDetailId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      whileHover={{ scale: 1.01 }}
                      className={`relative p-4 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        selectedQty > 0 && !isOver
                          ? "bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200"
                          : "bg-white"
                      }`}
                    >
                      {/* Thông tin vé */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-800">
                                {t.ticketName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {t.ticketDescription || "Không có mô tả"}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-indigo-600 text-lg">
                                {t.ticketPrice === 0
                                  ? "Miễn phí"
                                  : `${t.ticketPrice.toLocaleString("vi-VN")}đ`}
                              </div>
                              <div className="text-xs text-gray-500">
                                Còn lại: {t.remainingQuantity}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Nhóm số lượng */}
                      <div className="flex items-center gap-3 relative">
                        <Input
                          type="number"
                          min="0"
                          max={t.remainingQuantity}
                          value={selectedQty || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!/^\d*$/.test(val)) return;
                            setSelectedTickets((prev) => ({
                              ...prev,
                              [t.ticketDetailId]: val,
                            }));
                            setBookingError("");
                          }}
                          className={`w-28 text-center rounded-lg focus:ring-2 ${
                            isOver
                              ? "border-red-400 focus:ring-red-300"
                              : "border-indigo-200 focus:ring-indigo-300 focus:border-indigo-400"
                          }`}
                          placeholder="Số lượng"
                        />
                        <div className="text-sm text-gray-500">
                          / {t.remainingQuantity}
                        </div>

                        {/* Dòng cảnh báo */}
                        {isOver && (
                          <div className="absolute -bottom-5 right-13 text-sm text-red-500">
                            Chỉ còn {t.remainingQuantity} vé.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Additional event info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs text-gray-500">Ngày</div>
                  <div className="font-medium">
                    {new Date(event.startTime).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs text-gray-500">Giờ</div>
                  <div className="font-medium">
                    {new Date(event.startTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs text-gray-500">Địa điểm</div>
                  <div className="font-medium">
                    {event.locationName || "Không xác định"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phải: đặt vé */}
        <aside className="lg:col-span-1 sticky top-24 self-start">
          <Card className="rounded-3xl bg-white/90 backdrop-blur-md border border-indigo-100 shadow-2xl p-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Xác nhận đặt vé
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {ticketTypeRequests.length > 0 ? (
                <div className="space-y-3">
                  {ticketTypeRequests.map((t, i) => {
                    const type = ticketTypes.find(
                      (x) => x.ticketDetailId === t.ticketTypeId
                    );
                    const unitPrice = type?.ticketPrice || 0;
                    const total = unitPrice * t.quantity;

                    return (
                      <motion.div
                        key={i}
                        className="p-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white/80 to-indigo-50/50 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-800 text-base">
                            {type?.ticketName}
                          </h4>
                          <span className="font-semibold text-indigo-600 text-sm">
                            {total.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>
                            Đơn giá: {unitPrice.toLocaleString("vi-VN")}đ
                          </span>
                          <span>Số lượng: {t.quantity}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-6">
                  Chưa chọn loại vé nào
                </p>
              )}

              <Separator className="my-2" />

              <div className="flex justify-between items-center px-1">
                <span className="text-lg font-semibold text-gray-800">
                  Tổng cộng
                </span>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>

              <Button
                onClick={handleBooking}
                disabled={ticketTypeRequests.length === 0 || creating}
                className="w-full h-12 mt-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-md"
              >
                {creating && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {creating ? "Đang đặt vé..." : "Xác nhận đặt vé"}
              </Button>

              {bookingError && (
                <div className="text-red-600 text-sm text-center mt-3 bg-red-50 border border-red-200 py-2 px-3 rounded-xl">
                  {bookingError}
                </div>
              )}

              {/* Support box */}
              <div className="mt-4 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-indigo-600 mt-1" />
                  <div>
                    <div className="font-semibold">Hỗ trợ khách hàng</div>
                    <div className="text-xs text-gray-600">
                      Hotline: <span className="font-medium">1900-1234</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Email:{" "}
                      <span className="font-medium">support@gmail.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Floating summary for mobile */}
          <div className="lg:hidden fixed left-1/2 -translate-x-1/2 bottom-4 w-[92%]">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-indigo-100 shadow-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Tổng</div>
                <div className="font-bold text-lg">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </div>
              </div>
              <div className="w-40">
                <Button
                  onClick={handleBooking}
                  disabled={ticketTypeRequests.length === 0 || creating}
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl"
                >
                  {creating ? "Đang..." : "Xác nhận"}
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BookingFlow;
