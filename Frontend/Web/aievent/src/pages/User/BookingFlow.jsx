import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import {
  Calendar,
  MapPin,
  Loader2,
  Ticket,
  Menu,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Globe,
  Wallet,
  CheckCircle,
} from "lucide-react";
import {
  createBooking,
  selectBookingError,
} from "../../store/slices/bookingSlice";
import { eventAPI } from "../../api/eventAPI";
import { bookingAPI } from "../../api/bookingAPI";
import { useWallet } from "../../hooks/useWallet";

function BookingFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const error = useSelector(selectBookingError);
  const { user } = useSelector((state) => state.auth);
  const { wallet, getWallet } = useWallet();

  // --- state (same logic retained) ---
  const [event, setEvent] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const creating = useSelector((state) => state.booking.creating);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [bookingError, setBookingError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(6000);
  const [showSelectedTickets, setShowSelectedTickets] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Chọn vé, 2: Thanh toán, 3: Thành công
  const [bookingData, setBookingData] = useState(null); // Lưu thông tin booking sau khi đặt thành công
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
    getWallet(); // Load wallet info
  }, [id, getWallet]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`;
  };

  const getCityCode = (eventData) => {
    if (!eventData) return null;
    const location = eventData.locationName || eventData.district || "";
    const locationUpper = location.toUpperCase();

    if (locationUpper.includes("HCM") || locationUpper.includes("HỒ CHÍ MINH") || locationUpper.includes("TP.HCM") || locationUpper.includes("hcm")) {
      return "HCM";
    }

    return null;
  };

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
      const bookingResult = await dispatch(createBooking(payload)).unwrap();
      // Lưu thông tin booking và chuyển sang bước thanh toán
      setBookingData({
        bookingId: bookingResult?.bookingId,
        totalPrice: totalPrice,
        ticketTypeRequests: ticketTypeRequests,
      });
      setCurrentStep(2); // Chuyển sang bước thanh toán
      window.scrollTo({ top: 0, behavior: "smooth" });
      await getWallet(); // Refresh wallet balance
    } catch (err) {
      console.error("Booking failed:", err);
      setBookingError(
        "Đặt vé thất bại, vui lòng thử lại hoặc kiểm tra số dư ví."
      );
    }
  };

  const handlePayment = async () => {
    if (!bookingData) return;
    
    setIsProcessingPayment(true);
    try {
      // Giả sử thanh toán đã được xử lý tự động khi tạo booking
      // Hoặc có thể gọi API thanh toán ở đây nếu cần
      
      // Chuyển sang step 3
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Payment failed:", err);
      setBookingError("Thanh toán thất bại, vui lòng thử lại.");
    } finally {
      setIsProcessingPayment(false);
    }
  };


  // Layout chính - Thiết kế mới theo phong cách CTicket
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-gray-800" />
            <span className="font-bold text-lg text-gray-800">Mua vé</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-300">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.unique_name || user.name || "User"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-blue-600 font-semibold text-xs">
                      {user.unique_name
                        ? user.unique_name.charAt(0).toUpperCase()
                        : user.name
                          ? user.name.charAt(0).toUpperCase()
                          : "U"}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline">
                  {user.unique_name || user.name || "Người dùng"}
                </span>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-blue-100 hover:border-blue-300 text-gray-900 hover:text-gray-900">
              <Menu className="w-5 h-5" />
            </Button>
            <Button variant="ghost" className="h-9 px-2 gap-1 rounded-md hover:bg-blue-100 hover:border-blue-300 text-gray-900 hover:text-gray-900" onClick={() => navigate("/wallet")}>
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Ví của tôi</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Step Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(1);
                }
              }}
              className={`flex items-center gap-2 ${
                currentStep > 1 ? "cursor-pointer hover:opacity-80" : ""
              }`}
              disabled={currentStep === 1}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep === 1
                  ? "bg-blue-600 text-white"
                  : currentStep > 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${
                currentStep === 1 ? "text-blue-600" : currentStep > 1 ? "text-blue-600" : "text-gray-600"
              }`}>Chọn vé</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => {
                if (currentStep > 2 && bookingData) {
                  setCurrentStep(2);
                }
              }}
              className={`flex items-center gap-2 ${
                currentStep > 2 && bookingData ? "cursor-pointer hover:opacity-80" : ""
              }`}
              disabled={currentStep === 2 || !bookingData}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep === 2
                  ? "bg-blue-600 text-white"
                  : currentStep > 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                currentStep === 2 ? "text-blue-600" : currentStep > 2 ? "text-blue-600" : "text-gray-600"
              }`}>Thanh toán</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep === 3
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                3
              </div>
              <span className={`text-sm font-medium ${
                currentStep === 3 ? "text-blue-600" : "text-gray-600"
              }`}>Hoàn tất</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Bar */}
      <div className="relative text-white overflow-hidden">
        {/* Animated gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 20%, #2563eb 40%, #1d4ed8 60%, #1e40af 80%, #60a5fa 100%)',
            backgroundSize: '300% 100%',
            animation: 'gradient-flow 8s linear infinite'
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 py-3 z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="font-semibold text-base">
                {(() => {
                  const code = getCityCode(event);
                  return code ? `[${code}] ` : "";
                })()}
                {event.title}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(event.startTime).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  - {new Date(event.startTime).toLocaleTimeString("vi-VN", {
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
        </div>
        <style>{`
          @keyframes gradient-flow {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 200% 50%;
            }
          }
        `}</style>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentStep === 3 ? (
          /* Step 3: Success - Two Column Layout */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-6"
          >
            {/* Success Header */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center shadow-sm">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">
                Đặt vé thành công!
              </h2>
              <p className="text-gray-600">
                Vé đã được gửi tới email của bạn. Vui lòng kiểm tra hoặc mở vé dưới
                đây.
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
              {/* Left Column - Event Information */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin sự kiện</h3>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-md mb-4">
                  <img
                    src={event.imgListEvent?.[0] || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 p-4 flex flex-col justify-end">
                    <div className="text-white">
                      <div className="text-sm font-medium mb-2">{event.title?.split(' - ')[0] || event.title}</div>
                      <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#FFD700' }}>
                        {event.title?.split(' - ')[1] || event.title}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Ngày giờ</div>
                      <div className="font-medium text-gray-800">
                        {new Date(event.startTime).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}{" "}
                        - {new Date(event.startTime).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Địa điểm</div>
                      <div className="font-medium text-gray-800">
                        {event.locationName || "Không xác định"}
                      </div>
                      {event.address && (
                        <div className="text-sm text-gray-600 mt-1">{event.address}</div>
                      )}
                    </div>
                  </div>
                  {event.description && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-500 mb-2">Mô tả</div>
                      <div className="text-sm text-gray-700 line-clamp-3">{event.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Ticket Information */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin vé đã mua</h3>
                {bookingData && bookingData.ticketTypeRequests && (
                  <div className="space-y-4">
                    {bookingData.ticketTypeRequests.map((ticketRequest, index) => {
                      const ticketType = ticketTypes.find(
                        (t) => t.ticketDetailId === ticketRequest.ticketTypeId
                      );
                      if (!ticketType) return null;
                      
                      return (
                        <div
                          key={index}
                          className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">
                                {ticketType.ticketName}
                              </div>
                              {ticketType.ticketDescription && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {ticketType.ticketDescription}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              Số lượng: <span className="font-medium text-gray-800">{ticketRequest.quantity}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Đơn giá</div>
                              <div className="font-bold text-blue-600">
                                {ticketType.ticketPrice === 0
                                  ? "Miễn phí"
                                  : `${ticketType.ticketPrice.toLocaleString("vi-VN")} VND`}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <span className="font-semibold text-gray-800">Thành tiền:</span>
                            <span className="font-bold text-lg text-indigo-600">
                              {(
                                ticketType.ticketPrice * ticketRequest.quantity
                              ).toLocaleString("vi-VN")} VND
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="pt-4 border-t-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-indigo-600">
                          {bookingData.totalPrice.toLocaleString("vi-VN")} VND
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3 mt-6 pt-6 border-t border-gray-200">
                  <Button 
                    className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl"
                    onClick={() => navigate("/my-tickets")}
                  >
                    Xem vé của tôi
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => navigate("/")}
                  >
                    Về trang chủ
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
            {/* Left Column - Promotional Image */}
            <div className="relative">
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                <img
                  src={event.imgListEvent?.[0] || "/placeholder.svg"}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {/* Event Info Overlay */}
                <div className="absolute inset-0 bg-black/30 p-4 flex flex-col justify-end">
                  <div className="text-white">
                    <div className="text-sm font-medium mb-2">{event.title?.split(' - ')[0] || event.title}</div>
                    <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#FFD700' }}>
                      {event.title?.split(' - ')[1] || event.title}
                    </div>
                    <div className="text-sm mb-1">{event.locationName || "Sự kiện"}</div>
                    <div className="text-xs">
                      {new Date(event.startTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - {new Date(event.startTime).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Conditional Content */}
            {currentStep === 1 ? (
              /* Step 1: Ticket Selection */
              <div className="bg-gray-100 rounded-lg p-6 space-y-4">
                {/* Timer */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Thời gian bán vé còn lại</div>
                <div className="text-2xl font-bold text-blue-600">{formatTime(timeRemaining)}</div>
              </div>

              {/* Event Details */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {new Date(event.startTime).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })} • {new Date(event.startTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Ticket Selection */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Loại vé</h3>
                  <h3 className="font-semibold text-gray-800">Số lượng</h3>
                </div>

                <div className="space-y-3">
                  {ticketTypes.map((t) => {
                    const selectedQty = Number(selectedTickets[t.ticketDetailId] || 0);
                    const isOver = selectedQty > t.remainingQuantity;
                    const isSoldOut = (t.remainingQuantity || 0) <= 0;

                    return (
                      <div
                        key={t.ticketDetailId}
                        className={`p-3 rounded-lg border ${
                          isSoldOut
                            ? "border-red-200 bg-red-50 opacity-60"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-800 text-sm">
                                {t.ticketName}
                              </div>
                              {isSoldOut && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded">
                                  Hết vé
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-gray-700 mt-1">
                              {t.ticketPrice === 0
                                ? "Miễn phí"
                                : `${t.ticketPrice.toLocaleString("vi-VN")} VND`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Còn lại: <span className="font-medium">{t.remainingQuantity || 0}</span> vé
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md hover:bg-blue-100 hover:border-blue-300 text-gray-900 hover:text-gray-900"
                              onClick={() => {
                                if (selectedQty > 0) {
                                  setSelectedTickets((prev) => ({
                                    ...prev,
                                    [t.ticketDetailId]: selectedQty - 1,
                                  }));
                                }
                              }}
                              disabled={selectedQty === 0 || isSoldOut}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <div className={`w-10 text-center font-medium ${
                              isSoldOut ? "text-gray-400" : "text-gray-800"
                            }`}>
                              {selectedQty}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-md hover:bg-blue-100 hover:border-blue-300 text-gray-900 hover:text-gray-900"
                              onClick={() => {
                                if (selectedQty < t.remainingQuantity) {
                                  setSelectedTickets((prev) => ({
                                    ...prev,
                                    [t.ticketDetailId]: selectedQty + 1,
                                  }));
                                }
                              }}
                              disabled={selectedQty >= t.remainingQuantity || isSoldOut}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {isOver && !isSoldOut && (
                          <div className="text-xs text-red-500 mt-1">
                            Chỉ còn {t.remainingQuantity} vé
                          </div>
                        )}
                        {isSoldOut && (
                          <div className="text-xs text-red-500 mt-1 font-medium">
                            Loại vé này đã hết
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Tickets Summary */}
                {ticketTypeRequests.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <button
                      onClick={() => setShowSelectedTickets(!showSelectedTickets)}
                      className="w-full flex items-center justify-between text-sm font-medium text-gray-700"
                    >
                      <span>Vé đã chọn</span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${showSelectedTickets ? "rotate-90" : ""
                          }`}
                      />
                    </button>
                    {showSelectedTickets && (
                      <div className="mt-2 space-y-2">
                        {ticketTypeRequests.map((t, i) => {
                          const type = ticketTypes.find(
                            (x) => x.ticketDetailId === t.ticketTypeId
                          );
                          return (
                            <div
                              key={i}
                              className="text-xs text-gray-600 flex justify-between"
                            >
                              <span>
                                {type?.ticketName} x{t.quantity}
                              </span>
                              <span className="font-medium">
                                {(
                                  (type?.ticketPrice || 0) * t.quantity
                                ).toLocaleString("vi-VN")} VND
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleBooking}
                disabled={ticketTypeRequests.length === 0 || creating}
                className="w-full h-12 bg-sky-400 hover:bg-blue-400 text-white font-semibold rounded-lg shadow-md"
              >
                {creating && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {creating ? "Đang xử lý..." : "Tiếp tục"}
              </Button>

              {bookingError && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 py-2 px-3 rounded-lg">
                  {bookingError}
                </div>
              )}
            </div>
          ) : currentStep === 2 ? (
            /* Step 2: Payment */
            <div className="bg-gray-100 rounded-lg p-6 space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">Thông tin thanh toán</h3>
                
                {/* Booking Summary */}
                {bookingData && (
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tổng tiền vé:</span>
                      <span className="font-semibold text-gray-800">
                        {bookingData.totalPrice.toLocaleString("vi-VN")} VND
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="font-semibold text-gray-800">Tổng thanh toán:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {bookingData.totalPrice.toLocaleString("vi-VN")} VND
                      </span>
                    </div>
                  </div>
                )}

                {/* Wallet Balance */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Số dư ví:</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {wallet?.balance ? wallet.balance.toLocaleString("vi-VN") : "0"} VND
                    </span>
                  </div>
                  {wallet?.balance < (bookingData?.totalPrice || 0) && (
                    <div className="mt-2 text-xs text-red-600">
                      Số dư không đủ. Vui lòng nạp thêm tiền vào ví.
                    </div>
                  )}
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={!wallet || wallet.balance < (bookingData?.totalPrice || 0) || isProcessingPayment}
                  className="w-full h-12 bg-sky-400 hover:bg-blue-400 text-white font-semibold rounded-lg shadow-md"
                >
                  {isProcessingPayment && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {isProcessingPayment 
                    ? "Đang xử lý..." 
                    : wallet?.balance >= (bookingData?.totalPrice || 0) 
                    ? "Thanh toán" 
                    : "Nạp tiền vào ví"}
                </Button>

                {wallet?.balance < (bookingData?.totalPrice || 0) && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/wallet")}
                    className="w-full h-10 mt-2"
                  >
                    Đi đến ví điện tử
                  </Button>
                )}
              </div>
            </div>
          ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingFlow;
