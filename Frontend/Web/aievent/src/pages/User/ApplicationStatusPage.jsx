import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
} from "lucide-react";

// Mock application status data
const mockApplicationStatus = {
  id: "APP-2024-001",
  status: "pending", // pending, approved, rejected, under_review
  submittedAt: "2024-03-10T10:30:00Z",
  reviewedAt: null,
  estimatedReviewDate: "2024-03-13T23:59:59Z",
  reviewerNotes: "",
  organizationName: "Vietnam Tech Community",
  contactEmail: "contact@vtechcommunity.com",
  nextSteps: [
    "Đơn đăng ký đã được tiếp nhận",
    "Đang chờ admin xem xét",
    "Sẽ có thông báo qua email trong 2-3 ngày",
  ],
};

export default function ApplicationStatusPage() {
  const [applicationStatus, setApplicationStatus] = useState(
    mockApplicationStatus
  );
  const [user, setUser] = useState({}); // Mock user state for pure React

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Đang chờ duyệt
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Đang xem xét
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Đã duyệt
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Từ chối
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "pending":
        return {
          title: "Đơn đăng ký đang được xử lý",
          description:
            "Chúng tôi đã nhận được đơn đăng ký của bạn và đang tiến hành xem xét. Vui lòng kiên nhẫn chờ đợi.",
        };
      case "under_review":
        return {
          title: "Đang xem xét chi tiết",
          description:
            "Admin đang xem xét thông tin và tài liệu bạn đã cung cấp. Chúng tôi có thể liên hệ nếu cần thêm thông tin.",
        };
      case "approved":
        return {
          title: "Chúc mừng! Đơn đăng ký đã được duyệt",
          description:
            "Tài khoản của bạn đã được nâng cấp thành Organizer. Bạn có thể bắt đầu tạo và quản lý sự kiện.",
        };
      case "rejected":
        return {
          title: "Đơn đăng ký chưa được chấp thuận",
          description:
            "Rất tiếc, đơn đăng ký của bạn chưa đáp ứng các yêu cầu. Vui lòng xem ghi chú bên dưới và thử lại.",
        };
      default:
        return {
          title: "Trạng thái không xác định",
          description: "Vui lòng liên hệ hỗ trợ để biết thêm thông tin.",
        };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <p className="text-muted-foreground mb-8">
            Bạn cần đăng nhập để xem trạng thái đơn đăng ký.
          </p>
          <a href="/auth/login">
            <Button>Đăng nhập ngay</Button>
          </a>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage(applicationStatus.status);

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
            Theo dõi tiến trình xét duyệt trở thành Organizer
          </p>
        </div>

        <div className="grid gap-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Đơn đăng ký #{applicationStatus.id}
                  {getStatusBadge(applicationStatus.status)}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Nộp ngày:{" "}
                  {new Date(applicationStatus.submittedAt).toLocaleDateString(
                    "vi-VN"
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{statusInfo.title}</h3>
                  <p className="text-muted-foreground">
                    {statusInfo.description}
                  </p>
                </div>

                {applicationStatus.status === "pending" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Thời gian xử lý dự kiến
                      </span>
                    </div>
                    <p className="text-blue-800 text-sm">
                      Trước ngày{" "}
                      {new Date(
                        applicationStatus.estimatedReviewDate
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                )}

                {applicationStatus.status === "approved" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">
                        Tài khoản đã được nâng cấp
                      </span>
                    </div>
                    <p className="text-green-800 text-sm mb-3">
                      Bạn có thể bắt đầu tạo và quản lý sự kiện ngay bây giờ.
                    </p>
                    <a href="/organizer">
                      <Button className="bg-green-600 hover:bg-green-700">
                        Đi đến Dashboard Organizer
                      </Button>
                    </a>
                  </div>
                )}

                {applicationStatus.status === "rejected" &&
                  applicationStatus.reviewerNotes && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-900">
                          Ghi chú từ admin
                        </span>
                      </div>
                      <p className="text-red-800 text-sm">
                        {applicationStatus.reviewerNotes}
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="font-semibold">Tên tổ chức</Label>
                  <p className="mt-1">{applicationStatus.organizationName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Email liên hệ</Label>
                  <p className="mt-1">{applicationStatus.contactEmail}</p>
                </div>
                <div>
                  <Label className="font-semibold">Ngày nộp đơn</Label>
                  <p className="mt-1">
                    {new Date(applicationStatus.submittedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Trạng thái hiện tại</Label>
                  <div className="mt-1">
                    {getStatusBadge(applicationStatus.status)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Các bước tiếp theo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applicationStatus.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>Cần hỗ trợ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Nếu bạn có câu hỏi về đơn đăng ký hoặc cần hỗ trợ, vui lòng liên
                hệ với chúng tôi:
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
