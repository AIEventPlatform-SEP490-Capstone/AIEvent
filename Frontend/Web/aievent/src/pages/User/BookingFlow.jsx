import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { Calendar, MapPin, Clock, QrCode, Ticket } from "lucide-react";
import {
  createBooking,
  selectBookingLoading,
  selectBookingError,
} from "../../store/slices/bookingSlice";
import { eventAPI } from "../../api/eventAPI";
import { bookingAPI } from "../../api/bookingAPI";

function BookingFlow() {
  const { id } = useParams();
  const eventId = id;
  const dispatch = useDispatch();
  const loading = useSelector(selectBookingLoading);
  const error = useSelector(selectBookingError);

  const [event, setEvent] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [qrCode, setQrCode] = useState(null);

  const [step, setStep] = useState(1);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingData, setBookingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
  });

  // 🔹 Fetch event data by ID
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setFetching(true);
        const data = await eventAPI.getEventById(eventId);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setFetchError("Không thể tải thông tin sự kiện.");
      } finally {
        setFetching(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (fetching) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Đang tải thông tin sự kiện...
      </div>
    );
  }

  if (fetchError || !event) {
    return (
      <div className="p-10 text-center text-destructive">
        {fetchError || "Không tìm thấy sự kiện."}
      </div>
    );
  }

  const ticketTypes = event.ticketDetails || [];
  const selectedTicketType = ticketTypes.find(
    (t) => t.ticketDetailId === selectedTicketTypeId
  );

  const ticketPrice = selectedTicketType?.ticketPrice || 0;
  const totalPrice = ticketPrice * ticketQuantity;

  const canProceedFromStep1 = () => selectedTicketTypeId && ticketQuantity > 0;

  // ✅ Gọi API booking thật
  //   const handleBooking = async () => {
  //     try {
  //       const bookingPayload = {
  //         eventId: event.eventId,
  //         ticketTypeRequests: [
  //           {
  //             ticketTypeId: selectedTicketTypeId,
  //             quantity: ticketQuantity,
  //           },
  //         ],
  //       };

  //       await dispatch(createBooking(bookingPayload)).unwrap();
  //       setBookingComplete(true);
  //     } catch (err) {
  //       console.error("Booking failed:", err);
  //     }
  //   };
  const handleBooking = async () => {
    try {
      const bookingPayload = {
        eventId: event.eventId,
        ticketTypeRequests: [
          {
            ticketTypeId: selectedTicketTypeId,
            quantity: ticketQuantity,
          },
        ],
      };

      // 1️⃣ Gọi API tạo booking
      const result = await dispatch(createBooking(bookingPayload)).unwrap();
      console.log("Booking result:", result);

      // 2️⃣ Sau khi tạo booking, gọi API lấy danh sách vé
      const ticketsResponse = await bookingAPI.getTickets();
      const items = ticketsResponse?.items || [];

      // 3️⃣ Lấy vé mới nhất hoặc vé thuộc sự kiện hiện tại
      const latestTicket =
        items.find((t) => t.eventName === event.title) || items[0];

      if (!latestTicket) {
        console.warn("Không tìm thấy vé nào để lấy mã QR.");
        setBookingComplete(true);
        return;
      }

      const ticketId = latestTicket.ticketId;
      console.log("🎟 Ticket ID:", ticketId);

      // 4️⃣ Lấy QR Code thật từ API
      const qrResponse = await bookingAPI.getTicketQR(ticketId);
      setQrCode(qrResponse?.qrCode); // qrCode là URL thật từ Cloudinary

      // 5️⃣ Hiển thị màn hình thành công
      setBookingComplete(true);
    } catch (err) {
      console.error("Booking failed:", err);
      alert(err?.message || "Đặt vé thất bại, vui lòng thử lại.");
    }
  };
  // ✅ Giao diện khi đặt vé thành công
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="text-center">
            <CardContent className="p-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Đặt vé thành công!
              </h2>
              <p className="text-muted-foreground">
                Vé của bạn đã được gửi qua email.
              </p>
              <div className="bg-card p-6 rounded-xl mb-8 border flex flex-col items-center justify-center">
                {qrCode ? (
                  <>
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-40 h-40 mb-3"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      Quét mã này khi check-in
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Đang tải mã QR...</p>
                )}
              </div>

              {/* <div className="bg-card p-6 rounded-xl mb-8 border">
                <div className="text-5xl font-mono text-center mb-3">
                  QR123456789
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Mã QR check-in
                </p>
              </div> */}

              <Button className="w-full h-12 text-lg" asChild>
                <a href="/profile">Xem vé trong tài khoản</a>
              </Button>
              <Button variant="outline" className="w-full h-12 text-lg" asChild>
                <a href="/">Về trang chủ</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Giao diện chính
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Đặt vé sự kiện
                </CardTitle>
                <div className="flex items-center gap-3 mt-4">
                  <Badge variant={step >= 1 ? "default" : "secondary"}>
                    1. Chọn vé
                  </Badge>
                  <Badge variant={step >= 2 ? "default" : "secondary"}>
                    2. Thông tin
                  </Badge>
                  <Badge variant={step >= 3 ? "default" : "secondary"}>
                    3. Xác nhận
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {step === 1 && (
                  <>
                    <div className="space-y-4">
                      <label className="text-sm font-medium">
                        Chọn loại vé
                      </label>
                      {ticketTypes.map((t) => (
                        <div
                          key={t.ticketDetailId}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                            selectedTicketTypeId === t.ticketDetailId
                              ? "border-primary bg-primary/10"
                              : "hover:border-primary/30"
                          }`}
                          onClick={() =>
                            setSelectedTicketTypeId(t.ticketDetailId)
                          }
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{t.ticketName}</p>
                              <p className="text-sm text-muted-foreground">
                                {t.ticketDescription || "Không có mô tả"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Còn lại: {t.remainingQuantity}
                              </p>
                            </div>
                            <p className="font-bold text-lg">
                              {t.ticketPrice === 0
                                ? "Miễn phí"
                                : `${t.ticketPrice.toLocaleString("vi-VN")}đ`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Số lượng vé</label>
                      <Input
                        type="number"
                        min="1"
                        max={selectedTicketType?.maxPurchaseQuantity || 10}
                        value={ticketQuantity}
                        onChange={(e) =>
                          setTicketQuantity(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-24 text-center"
                      />
                    </div>

                    <Button
                      onClick={() => setStep(2)}
                      disabled={!canProceedFromStep1()}
                      className="w-full h-12 font-semibold"
                    >
                      Tiếp tục
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder="Họ và tên"
                        value={bookingData.fullName}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            fullName: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Email"
                        value={bookingData.email}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            email: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Số điện thoại"
                        value={bookingData.phone}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            phone: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Công ty (tùy chọn)"
                        value={bookingData.company}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            company: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Quay lại
                      </Button>
                      <Button onClick={() => setStep(3)}>Tiếp tục</Button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="text-sm mb-2 text-muted-foreground">
                      Xác nhận đặt vé cho sự kiện{" "}
                      <span className="font-medium">{event.title}</span>
                    </p>
                    <Button
                      onClick={handleBooking}
                      disabled={loading}
                      className="w-full h-12 font-semibold"
                    >
                      {loading ? "Đang xử lý..." : "Xác nhận đặt vé"}
                    </Button>
                    {error && (
                      <p className="text-red-500 text-sm mt-3 text-center">
                        {error}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-6 shadow-lg h-fit">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Thông tin sự kiện
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={event.imgListEvent?.[0] || "/placeholder.svg"}
                  alt={event.title}
                  className="w-full h-48 object-cover mb-4 rounded-lg"
                />
                <h3 className="font-bold text-xl mb-2">{event.title}</h3>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.startTime).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(event.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.locationName || "Không xác định"}
                </p>
                <Separator />
                <div className="mt-3 flex justify-between text-sm">
                  <span>Tổng cộng:</span>
                  <span className="font-bold text-primary">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingFlow;
