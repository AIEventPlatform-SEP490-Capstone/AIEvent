import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Clock, ArrowLeft, Mail, Phone } from "lucide-react";

export default function ApplicationStatusPage() {
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("organizerApplication");
    if (saved) {
      setApplication(JSON.parse(saved));
    }
  }, []);

  if (!application) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md p-6 text-center shadow-md">
          <CardHeader>
            <CardTitle>Không tìm thấy thông tin đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Có vẻ bạn chưa gửi đơn đăng ký hoặc dữ liệu đã bị xoá.
            </p>
            <a href="/become-organizer">
              <Button>Đăng ký ngay</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </a>
          <h1 className="text-3xl font-bold text-foreground">
            Trạng thái đơn đăng ký
          </h1>
          <p className="text-muted-foreground mt-2">
            Đơn đăng ký của bạn đang được xử lý. Vui lòng kiểm tra email để nhận
            thông báo kết quả.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Trạng thái đơn */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Đơn đăng ký
                  <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Đang chờ duyệt
                  </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Nộp ngày: {new Date().toLocaleDateString("vi-VN")}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Đơn đăng ký đang được xử lý
                  </h3>
                  <p className="text-muted-foreground">
                    Chúng tôi đã nhận được đơn đăng ký của bạn và sẽ xem xét
                    trong thời gian sớm nhất. Kết quả sẽ được gửi đến email bạn
                    đã đăng ký.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Thời gian xử lý dự kiến
                    </span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Trong vòng 2–3 ngày làm việc kể từ khi gửi đơn.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin người đăng ký */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="font-semibold">Người liên hệ</Label>
                  <p className="mt-1">{application.ContactName || "—"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Email</Label>
                  <p className="mt-1">{application.ContactEmail || "—"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Số điện thoại</Label>
                  <p className="mt-1">{application.ContactPhone || "—"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Tên tổ chức / công ty</Label>
                  <p className="mt-1">{application.CompanyName || "—"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Loại hình</Label>
                  <p className="mt-1">{application.OrganizationType || "—"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Địa chỉ</Label>
                  <p className="mt-1">{application.Address || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hướng dẫn và liên hệ */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bổ sung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Nếu cần chỉnh sửa thông tin hoặc hỏi về tiến trình xét duyệt,
                vui lòng liên hệ qua email hoặc hotline:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Mail className="w-4 h-4" />
                  support@aievent.com
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Phone className="w-4 h-4" />
                  1900 1234
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className = "", ...props }) {
  return (
    <label
      className={`text-sm font-medium text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
