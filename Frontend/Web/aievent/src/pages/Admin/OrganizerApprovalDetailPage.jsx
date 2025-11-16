import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { useOrganizers } from "../../hooks/useOrganizers";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  ZoomIn,
  Building2,
  Briefcase,
  Contact,
  Share2,
  Image,
  User,
  Calendar,
  Star,
  MapPin,
  Award,
  Activity,
  FileCheck2,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const translations = {
  organizationType: {
    PrivateCompany: "Công ty tư nhân",
    StateEnterprise: "Doanh nghiệp nhà nước",
    NonProfit: "Tổ chức phi lợi nhuận",
    IndividualBusiness: "Hộ kinh doanh",
    StartUp: "Start-up",
    CommunityClub: "Cộng đồng / CLB",
    SchoolUniversity: "Trường / Đại học",
    Other: "Khác",
  },
  organizerType: {
    Individual: "Cá nhân",
    Business: "Doanh nghiệp",
  },
  eventFrequency: {
    Weekly: "Hàng tuần",
    Monthly: "Hàng tháng",
    Quarterly: "Hàng quý",
    Yearly: "Hàng năm",
    Occasionally: "Thỉnh thoảng",
  },
  eventSize: {
    Small: "Nhỏ",
    Medium: "Trung bình",
    Large: "Lớn",
    ExtraLarge: "Rất lớn",
  },
  eventExperienceLevel: {
    Beginner: "Mới bắt đầu",
    Intermediate: "Trung bình",
    Experienced: "Có kinh nghiệm",
    Expert: "Chuyên nghiệp",
  },
};

export default function OrganizerApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getOrganizerById, confirmOrganizer } = useOrganizers();

  const [organizer, setOrganizer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  //  Lấy status từ trang trước
  const statusFromList = location.state?.status || "Pending";

  useEffect(() => {
    const fetchData = async () => {
      const data = await getOrganizerById(id);
      //  Gắn status tạm vào object để UI hiển thị
      setOrganizer({ ...data, status: statusFromList });
      setIsLoading(false);
    };
    fetchData();
  }, [id, statusFromList]);

  const handleConfirm = async (status) => {
    if (!id) return;
    setIsSubmitting(true);
    await confirmOrganizer(id, { status, reason });
    setIsSubmitting(false);
    navigate("/admin/organizers");
  };

  const translate = (type, value) =>
    translations[type]?.[value] || value || "—";

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <p className="text-center mt-10 text-muted-foreground">
        Không tìm thấy hồ sơ.
      </p>
    );
  }

  const o = organizer;

  const statusBadge = {
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    Pending: "bg-yellow-100 text-yellow-700",
  };

  const statusIcon = {
    Approved: <CheckCircle className="w-5 h-5 text-green-600" />,
    Rejected: <XCircle className="w-5 h-5 text-red-600" />,
    Pending: <Activity className="w-5 h-5 text-yellow-600" />,
  };

  return (
    <main className="p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
        </div>

        {/* Thông tin tổng quan */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 p-6 shadow-sm border border-border/40 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <img
              src={o.imgCompany}
              alt="Logo"
              className="w-24 h-24 rounded-xl border object-cover"
            />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {o.companyName}
              </h2>
              <p className="text-gray-500">
                {translate("organizationType", o.organizationType)}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {o.address}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" /> MST: {o.taxCode || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                statusBadge[o.status]
              }`}
            >
              {statusIcon[o.status]}
              <span className="font-medium">
                {o.status === "Approved"
                  ? "Đã duyệt"
                  : o.status === "Rejected"
                  ? "Từ chối"
                  : "Chờ duyệt"}
              </span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600 mt-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />{" "}
                {translate("eventFrequency", o.eventFrequency)}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4" />{" "}
                {translate("eventExperienceLevel", o.eventExperienceLevel)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="max-w-7xl mx-auto mt-8 grid md:grid-cols-3 gap-6">
        {/* Cột trái */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Contact className="w-5 h-5 text-blue-600" /> Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <strong>Người liên hệ:</strong> {o.contactName}
              </p>
              <p>
                <strong>Email:</strong> {o.contactEmail}
              </p>
              <p>
                <strong>Điện thoại:</strong> {o.contactPhone}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {o.address}
              </p>
            </CardContent>
          </Card>

          {/* Kinh nghiệm */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="w-5 h-5 text-amber-600" />
                Mô tả & Kinh nghiệm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                {o.experienceDescription || "Không có mô tả kinh nghiệm"}
              </p>
              <p className="text-gray-500 text-sm">
                {o.companyDescription || "Không có mô tả công ty"}
              </p>
            </CardContent>
          </Card>

          {/* Mạng xã hội */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="w-5 h-5 text-pink-600" /> Liên kết mạng xã
                hội
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {o.website && (
                  <a
                    href={o.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
                {o.urlFacebook && (
                  <a
                    href={o.urlFacebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Facebook className="w-4 h-4" /> Facebook
                  </a>
                )}
                {o.urlInstagram && (
                  <a
                    href={o.urlInstagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-pink-500 hover:underline"
                  >
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                )}
                {o.urlLinkedIn && (
                  <a
                    href={o.urlLinkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sky-700 hover:underline"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form duyệt */}
          {o.status === "Pending" && (
            <Card className="p-6 border-t-4 border-t-primary/60 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck2 className="w-5 h-5 text-green-600" />
                  Xác nhận duyệt hồ sơ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Nhập lý do từ chối (nếu có)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="destructive"
                    disabled={isSubmitting}
                    onClick={() => handleConfirm("Rejected")}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => handleConfirm("Approved")}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cột phải */}
        <div className="space-y-6">
          {/* Hình ảnh */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Image className="w-5 h-5 text-purple-600" /> Tài liệu xác minh
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                { src: o.imgFrontIdentity, label: "CMND/CCCD Mặt trước" },
                { src: o.imgBackIdentity, label: "CMND/CCCD Mặt sau" },
                { src: o.imgBusinessLicense, label: "Giấy phép kinh doanh" },
              ].map((img) => (
                <div
                  key={img.label}
                  className="group relative cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img.src}
                    alt={img.label}
                    className="rounded-lg border object-cover h-40 w-full hover:opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn className="w-6 h-6 text-white bg-black/60 p-1 rounded-full" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{img.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Người đăng ký */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-indigo-600" /> Người đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>Họ tên:</strong> {o.userRegisterInfo?.fullName}
              </p>
              <p>
                <strong>Email:</strong> {o.userRegisterInfo?.email}
              </p>
              <p>
                <strong>SĐT:</strong> {o.userRegisterInfo?.phoneNumber || "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog xem ảnh */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="fixed inset-0 w-screen h-screen max-w-none p-6 bg-background overflow-y-auto flex flex-col items-center justify-center">
          <DialogHeader className="w-full flex justify-between items-center mb-4">
            <DialogTitle className="text-lg font-semibold">
              {selectedImage?.label}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage.src}
              alt={selectedImage.label}
              className="max-h-[90vh] w-auto rounded-lg object-contain border shadow-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
