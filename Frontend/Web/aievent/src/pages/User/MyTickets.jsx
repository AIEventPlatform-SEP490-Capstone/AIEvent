import { useEffect, useState } from "react";
import bookingAPI from "../../api/bookingAPI";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Calendar, MapPin, Clock, QrCode, RotateCcw } from "lucide-react";
import { Separator } from "../../components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";
import { toast } from "react-hot-toast";

function MyTickets() {
  const [events, setEvents] = useState([]); // Danh sách sự kiện đã mua vé
  const [selectedEvent, setSelectedEvent] = useState(null); // Sự kiện đang chọn
  const [tickets, setTickets] = useState([]); // Vé của sự kiện được chọn

  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  const [refundDialog, setRefundDialog] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);

  //  Lấy danh sách sự kiện có vé đã mua
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await bookingAPI.getEvents();
        setEvents(res.items || []);
      } catch (err) {
        console.error("Không thể tải danh sách sự kiện:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  //  Khi chọn 1 sự kiện → gọi API lấy danh sách vé của sự kiện đó
  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    setTickets([]);
    try {
      setTicketLoading(true);
      const res = await bookingAPI.getEventTickets(event.eventId);
      setTickets(res?.items?.[0]?.tickets || []);
    } catch (err) {
      console.error("Không thể tải danh sách vé:", err);
      toast.error("Không thể tải vé của sự kiện này.");
    } finally {
      setTicketLoading(false);
    }
  };

  //  Xem mã QR của vé
  const handleViewQR = async (ticket) => {
    try {
      setSelectedTicket(ticket);
      setQrLoading(true);
      const res = await bookingAPI.getTicketQR(ticket.ticketId);
      setQrCode(res?.qrCode);
    } catch {
      setQrCode(null);
    } finally {
      setQrLoading(false);
    }
  };

  //  Mở hộp thoại hoàn vé
  const confirmRefund = (ticket) => {
    setRefundTarget(ticket);
    setRefundDialog(true);
  };

  //  Gọi API hoàn vé
  const handleRefund = async () => {
    try {
      setRefundLoading(true);
      await bookingAPI.refundTicket(refundTarget.ticketId);
      toast.success("Hoàn vé thành công!");
      // Cập nhật trạng thái vé trên UI
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === refundTarget.ticketId
            ? { ...t, status: "Refunded" }
            : t
        )
      );
    } catch {
      toast.error("Không thể hoàn vé, vui lòng thử lại!");
    } finally {
      setRefundDialog(false);
      setRefundLoading(false);
    }
  };

  //  Loading khi chưa có dữ liệu sự kiện
  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Đang tải sự kiện của bạn...
      </div>
    );
  }

  //  Không có sự kiện nào
  if (events.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Bạn chưa có sự kiện nào đã mua vé.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-center">🎫 Vé của tôi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/*  Danh sách sự kiện đã mua vé */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg h-fit sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Sự kiện đã mua vé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.eventId}
                    onClick={() => handleSelectEvent(event)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedEvent?.eventId === event.eventId
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/40"
                    }`}
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.startTime).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/*  Danh sách vé của sự kiện được chọn */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {selectedEvent
                    ? `Vé đã đặt cho: ${selectedEvent.title}`
                    : "Chọn một sự kiện để xem vé"}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {!selectedEvent && (
                  <p className="text-muted-foreground text-center py-10">
                    Vui lòng chọn sự kiện bên trái để xem vé của bạn.
                  </p>
                )}

                {ticketLoading && (
                  <p className="text-center text-muted-foreground py-10">
                    Đang tải vé của sự kiện...
                  </p>
                )}

                {!ticketLoading && selectedEvent && tickets.length === 0 && (
                  <p className="text-center text-muted-foreground py-10">
                    Bạn chưa đặt vé cho sự kiện này.
                  </p>
                )}

                {!ticketLoading && tickets.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.ticketId}
                        className="overflow-hidden shadow border hover:shadow-lg transition-all"
                      >
                        <CardHeader>
                          <CardTitle className="text-base font-semibold flex justify-between">
                            <span>{ticket.ticketCode}</span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                ticket.status === "Valid"
                                  ? "bg-green-100 text-green-700"
                                  : ticket.status === "Refunded"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {/* {ticket.status} */}
                              {ticket.status === "Valid"
                                ? "Vé có hiệu lực"
                                : ticket.status === "Refunded"
                                ? "Đã hoàn vé"
                                : ticket.status}
                            </span>
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <Calendar className="inline w-4 h-4 mr-1" />
                            {new Date(
                              selectedEvent.startTime
                            ).toLocaleDateString("vi-VN")}
                          </p>
                          <p>
                            <Clock className="inline w-4 h-4 mr-1" />
                            {new Date(
                              selectedEvent.startTime
                            ).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p>
                            <MapPin className="inline w-4 h-4 mr-1" />
                            {selectedEvent.address ||
                              selectedEvent.locationName}
                          </p>
                          <Separator />

                          <div className="flex justify-between items-center mt-2">
                            <span
                              className={`text-sm font-medium ${
                                ticket.status === "Valid"
                                  ? "text-green-600"
                                  : ticket.status === "Refunded"
                                  ? "text-yellow-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {ticket.status === "Valid"
                                ? "Vé có hiệu lực"
                                : ticket.status === "Refunded"
                                ? "Đã hoàn vé"
                                : ticket.status}
                            </span>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={
                                  ticket.status === "Refunded"
                                    ? "outline"
                                    : "default"
                                }
                                onClick={() => {
                                  if (ticket.status === "Refunded") {
                                    setSelectedTicket({
                                      ...ticket,
                                      isRefunded: true,
                                    });
                                    setQrCode(null);
                                  } else {
                                    handleViewQR(ticket);
                                  }
                                }}
                              >
                                <QrCode className="w-4 h-4 mr-1" /> QR
                              </Button>

                              {ticket.status === "Valid" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => confirmRefund(ticket)}
                                >
                                  <RotateCcw className="w-4 h-4 mr-1" /> Hoàn vé
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/*  Dialog QR */}

        <Dialog
          open={!!selectedTicket}
          onOpenChange={() => setSelectedTicket(null)}
        >
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle>
                {selectedTicket?.isRefunded
                  ? "Vé đã hoàn tiền"
                  : "Mã QR Check-in"}
              </DialogTitle>
            </DialogHeader>

            {/* Trường hợp vé đã hoàn */}
            {selectedTicket?.isRefunded ? (
              <p className="text-muted-foreground py-8">
                Vé này đã được hoàn tiền và không còn mã QR hợp lệ.
              </p>
            ) : qrLoading ? (
              <p className="text-muted-foreground py-8">Đang tải mã QR...</p>
            ) : qrCode ? (
              <>
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-56 h-56 mx-auto mt-4"
                />
                <p className="text-sm text-green-600 mt-3">Vé có hiệu lực</p>
                <p className="text-xs text-muted-foreground">
                  Quét mã này để check-in sự kiện
                </p>
              </>
            ) : (
              <p className="text-muted-foreground py-8">Không thể tải mã QR</p>
            )}
          </DialogContent>
        </Dialog>

        {/*  Dialog hoàn vé */}
        <AlertDialog open={refundDialog} onOpenChange={setRefundDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận hoàn vé</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn hoàn vé <b>{refundTarget?.ticketCode}</b>{" "}
                không? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRefund}
                disabled={refundLoading}
              >
                {refundLoading ? "Đang xử lý..." : "Xác nhận"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default MyTickets;
