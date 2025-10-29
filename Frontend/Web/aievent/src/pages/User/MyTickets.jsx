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
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);

  //  Lấy danh sách vé
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await bookingAPI.getTickets();
        setTickets(response?.items || []);
      } catch (err) {
        console.error("Không thể tải danh sách vé:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  //  Xem mã QR của vé
  const handleViewQR = async (ticket) => {
    try {
      setSelectedTicket(ticket);
      setQrLoading(true);
      const res = await bookingAPI.getTicketQR(ticket.ticketId);
      setQrCode(res?.qrCode);
    } catch (err) {
      console.error("Không thể tải mã QR:", err);
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
    if (!refundTarget) return;
    try {
      setRefundLoading(true);
      const res = await bookingAPI.refundTicket(refundTarget.ticketId);
      toast.success("Hoàn vé thành công!");
      //  Cập nhật trạng thái vé trên UI
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === refundTarget.ticketId
            ? { ...t, status: "Refunded" }
            : t
        )
      );
    } catch (err) {
      console.error("Lỗi khi hoàn vé:", err);
      toast.error("Không thể hoàn vé. Vui lòng thử lại!");
    } finally {
      setRefundLoading(false);
      setRefundDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Đang tải vé của bạn...
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Bạn chưa có vé nào.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-center">🎟 Vé của tôi</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <Card
              key={ticket.ticketId}
              className="overflow-hidden shadow-lg border hover:shadow-xl transition-all duration-300"
            >
              {ticket.eventImage ? (
                <img
                  src={ticket.eventImage}
                  alt={ticket.eventName}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                  Không có ảnh
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {ticket.eventName}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {ticket.address}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />{" "}
                  {new Date(ticket.startTime).toLocaleDateString("vi-VN")}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />{" "}
                  {new Date(ticket.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(ticket.endTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <Separator className="my-3" />

                <div className="flex justify-between items-center">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      ticket.status === "Valid"
                        ? "bg-green-100 text-green-700"
                        : ticket.status === "Refunded"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {ticket.status}
                  </span>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleViewQR(ticket)}>
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

        {/* Dialog hiển thị QR */}
        <Dialog
          open={!!selectedTicket}
          onOpenChange={() => setSelectedTicket(null)}
        >
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle>Mã QR Check-in</DialogTitle>
            </DialogHeader>
            {qrLoading ? (
              <p className="text-muted-foreground py-8">Đang tải mã QR...</p>
            ) : qrCode ? (
              <>
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-56 h-56 mx-auto mt-4"
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Quét mã này để check-in sự kiện
                </p>
              </>
            ) : (
              <p className="text-muted-foreground py-8">Không thể tải mã QR</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog xác nhận hoàn vé */}
        <AlertDialog open={refundDialog} onOpenChange={setRefundDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận hoàn vé</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn hoàn vé sự kiện{" "}
                <b>{refundTarget?.eventName}</b> không? Hành động này không thể
                hoàn tác.
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
