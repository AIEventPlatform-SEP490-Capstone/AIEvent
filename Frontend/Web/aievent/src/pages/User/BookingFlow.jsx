import { useState, useEffect } from "react";
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
import { Calendar, MapPin, Clock, QrCode, Loader2, Ticket } from "lucide-react";
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
  const [bookingError, setBookingError] = useState("");

  const [event, setEvent] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const creating = useSelector((state) => state.booking.creating);
  const [selectedTickets, setSelectedTickets] = useState({}); // { ticketDetailId: quantity }

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setFetching(true);
        const data = await eventAPI.getEventById(id);
        setEvent(data);
      } catch {
        setFetchError("Không thể tải thông tin sự kiện.");
      } finally {
        setFetching(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (fetching)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-white text-xl text-indigo-600">
        Đang tải thông tin sự kiện...
      </div>
    );

  if (fetchError || !event)
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-lg">
        {fetchError || "Không tìm thấy sự kiện."}
      </div>
    );

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

  const handleBooking = async () => {
    setBookingError(""); // reset lỗi cũ

    //  Kiểm tra không chọn vé nào
    if (ticketTypeRequests.length === 0) {
      setBookingError("Vui lòng chọn ít nhất một loại vé để đặt.");
      return;
    }

    //  Gọi API
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
    } catch (err) {
      console.error("Booking failed:", err);
      setBookingError(
        "Đặt vé thất bại, vui lòng thử lại hoặc kiểm tra số dư ví."
      );
    }
  };

  //  Giao diện sau khi đặt vé
  if (bookingComplete)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl max-w-md w-full p-10 text-center border border-indigo-100"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Đặt vé thành công!
          </h2>
          <p className="text-gray-600 mb-6">Vé đã được gửi đến email của bạn</p>
          <div className="bg-white rounded-xl border border-indigo-50 shadow-inner p-6 mb-6">
            {qrCode ? (
              <img src={qrCode} alt="QR" className="mx-auto w-40 h-40" />
            ) : (
              <p className="text-gray-500">Đang tải mã QR...</p>
            )}
          </div>
          <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl">
            <a href="/my-tickets">Xem vé của tôi</a>
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-lg mt-3 border-indigo-200 hover:bg-indigo-50 rounded-xl"
          >
            <a href="/">Về trang chủ</a>
          </Button>
        </motion.div>
      </div>
    );

  //  Layout chính
  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-10">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-10 text-[0.875rem] md:text-[0.95rem]">
      {/*  Nút quay lại trang sự kiện */}
      <div className="container mx-auto px-4 mb-6">
        <a
          href={`/event/${id}`}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors bg-white/60 backdrop-blur-md border border-indigo-100 shadow-sm px-4 py-2 rounded-xl hover:shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Quay lại sự kiện
        </a>
      </div>

      <div className="container mx-auto px-4 max-w-6xl space-y-10">
        {/* --- Thông tin sự kiện --- */}
        <Card className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-indigo-100 shadow-lg">
          <CardContent className="p-6 flex flex-col lg:flex-row items-center gap-6">
            <img
              src={event.imgListEvent?.[0] || "/placeholder.svg"}
              alt={event.title}
              className="w-full lg:w-1/2 rounded-2xl object-cover"
            />
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {event.title}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar size={18} />{" "}
                {new Date(event.startTime).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <Clock size={18} />{" "}
                {new Date(event.startTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <MapPin size={18} /> {event.locationName || "Không xác định"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* --- Chọn vé và xác nhận --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10"
        >
          {/* Cột trái: chọn vé */}
          <Card className="rounded-3xl bg-white/80 backdrop-blur-xl border border-indigo-100 shadow-lg p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Chọn vé
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Vui lòng chọn loại vé và số lượng bạn muốn đặt.
              </p>
            </CardHeader>

            <CardContent className="mt-4">
              <div className="space-y-5">
                {ticketTypes.map((t) => {
                  const selectedQty = Number(
                    selectedTickets[t.ticketDetailId] || 0
                  );
                  const isOver = selectedQty > t.remainingQuantity;

                  return (
                    <motion.div
                      key={t.ticketDetailId}
                      whileHover={{ scale: 1.01 }}
                      className={`p-5 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer 
              ${
                selectedQty > 0 && !isOver
                  ? "bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200"
                  : "bg-white border border-transparent hover:border-indigo-100"
              }`}
                    >
                      {/* Thông tin vé */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <Ticket className="text-white w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              {t.ticketName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {t.ticketDescription || "Không có mô tả"}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-indigo-600 text-lg">
                          {t.ticketPrice === 0
                            ? "Miễn phí"
                            : `${t.ticketPrice.toLocaleString("vi-VN")}đ`}
                        </p>
                      </div>

                      {/* Hàng nhập số lượng */}
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Còn lại: {t.remainingQuantity}
                        </p>
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
                      </div>

                      {/*  Lỗi hiển thị ngay bên dưới ô nhập */}
                      {isOver && (
                        <p className="text-sm text-red-500 mt-2 text-right">
                          Chỉ còn {t.remainingQuantity} vé. Vui lòng chọn lại.
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cột phải: xác nhận (sticky) */}
          <div className="lg:sticky lg:top-24 self-start">
            <Card className="rounded-3xl bg-white/80 backdrop-blur-xl border border-indigo-100 shadow-2xl p-6">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Xác nhận đặt vé
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {ticketTypeRequests.length > 0 ? (
                  <div className="space-y-4">
                    {ticketTypeRequests.map((t, i) => {
                      const type = ticketTypes.find(
                        (x) => x.ticketDetailId === t.ticketTypeId
                      );
                      const unitPrice = type?.ticketPrice || 0;
                      const total = unitPrice * t.quantity;

                      return (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white/80 to-indigo-50/50 shadow-sm hover:shadow-md transition-all"
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

                <Separator className="my-4" />

                <div className="flex justify-between items-center px-1">
                  <span className="text-lg font-semibold text-gray-800">
                    Tổng cộng
                  </span>
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={ticketTypeRequests.length === 0 || creating}
                  className="w-full h-12 mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {creating && (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  )}
                  {creating ? "Đang đặt vé..." : "Xác nhận đặt vé"}
                </Button>

                {bookingError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-600 text-sm text-center mt-4 bg-red-50 border border-red-200 py-2 px-3 rounded-xl"
                  >
                    {bookingError}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default BookingFlow;
