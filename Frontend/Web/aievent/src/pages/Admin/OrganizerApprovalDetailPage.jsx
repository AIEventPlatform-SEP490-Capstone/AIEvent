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
import { Label } from "../../components/ui/label";
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
import { X as XIcon } from "lucide-react";
import { toast } from "react-hot-toast";

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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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
    try {
      await confirmOrganizer(id, { status, reason });
      toast.success(status === "Approved" ? "Đã duyệt hồ sơ thành công" : "Đã từ chối hồ sơ");
      navigate("/admin/organizers");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xử lý hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const translate = (type, value) =>
    translations[type]?.[value] || value || "—";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        Đang tải hồ sơ tổ chức...
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-center text-muted-foreground">
          Không tìm thấy hồ sơ.
        </p>
      </div>
    );
  }

  const o = organizer;

  const statusBadge = {
    Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-100 text-rose-700 border-rose-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
  };

  const statusIcon = {
    Approved: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    Rejected: <XCircle className="w-5 h-5 text-rose-600" />,
    Pending: <Activity className="w-5 h-5 text-amber-600" />,
  };

  const imageList = [
    { src: o.imgFrontIdentity, label: "CMND/CCCD Mặt trước" },
    { src: o.imgBackIdentity, label: "CMND/CCCD Mặt sau" },
    { src: o.imgBusinessLicense, label: "Giấy phép kinh doanh" },
  ].filter(img => img.src);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Background - Full width, extends down */}
      <div className="w-full h-80 relative z-0 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600 via-blue-500 to-blue-300"></div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </div>

      {/* Content Container - Overlapping background */}
      <div className="container mx-auto px-4 pb-8 max-w-7xl -mt-72 relative z-20">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-white/80 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusBadge[o.status]}`}
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
          </div>

          {/* Profile Header Card */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <img
                    src={o.imgCompany}
                    alt="Logo"
                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-full shadow-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {o.companyName}
                  </h1>
                  <p className="text-gray-600 text-lg mb-4">
                    {translate("organizationType", o.organizationType)}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <MapPin className="w-4 h-4" /> {o.address}
                    </span>
                    {o.taxCode && (
                      <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Shield className="w-4 h-4" /> MST: {o.taxCode}
                      </span>
                    )}
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <Calendar className="w-4 h-4" /> {translate("eventFrequency", o.eventFrequency)}
                    </span>
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <Award className="w-4 h-4" /> {translate("eventExperienceLevel", o.eventExperienceLevel)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin liên hệ */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Contact className="w-5 h-5 text-blue-600" />
                  </div>
                  Thông tin liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-500">Người liên hệ</Label>
                    <p className="text-base font-medium text-gray-900">{o.contactName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-500">Email</Label>
                    <p className="text-base font-medium text-gray-900">{o.contactEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-500">Điện thoại</Label>
                    <p className="text-base font-medium text-gray-900">{o.contactPhone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-500">Địa chỉ</Label>
                    <p className="text-base font-medium text-gray-900">{o.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mô tả & Kinh nghiệm */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Briefcase className="w-5 h-5 text-amber-600" />
                  </div>
                  Mô tả & Kinh nghiệm
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Mô tả kinh nghiệm</Label>
                  <p className="text-base text-gray-700 mt-2 whitespace-pre-wrap">
                    {o.experienceDescription || "Không có mô tả kinh nghiệm"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Mô tả công ty</Label>
                  <p className="text-base text-gray-700 mt-2 whitespace-pre-wrap">
                    {o.companyDescription || "Không có mô tả công ty"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mạng xã hội */}
            {(o.website || o.urlFacebook || o.urlInstagram || o.urlLinkedIn) && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Share2 className="w-5 h-5 text-pink-600" />
                    </div>
                    Liên kết mạng xã hội
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4">
                    {o.website && (
                      <a
                        href={o.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      >
                        <Globe className="w-4 h-4" /> Website
                      </a>
                    )}
                    {o.urlFacebook && (
                      <a
                        href={o.urlFacebook}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      >
                        <Facebook className="w-4 h-4" /> Facebook
                      </a>
                    )}
                    {o.urlInstagram && (
                      <a
                        href={o.urlInstagram}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-500 rounded-lg transition-colors"
                      >
                        <Instagram className="w-4 h-4" /> Instagram
                      </a>
                    )}
                    {o.urlLinkedIn && (
                      <a
                        href={o.urlLinkedIn}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors"
                      >
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form duyệt */}
            {o.status === "Pending" && (
              <Card className="bg-white shadow-lg border-2 border-primary/20">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileCheck2 className="w-5 h-5 text-green-600" />
                    </div>
                    Xác nhận duyệt hồ sơ
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Lý do từ chối (nếu có)
                      </Label>
                      <Textarea
                        placeholder="Nhập lý do từ chối (nếu có)..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="destructive"
                        disabled={isSubmitting}
                        onClick={() => handleConfirm("Rejected")}
                        className="min-w-[120px]"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        {isSubmitting ? "Đang xử lý..." : "Từ chối"}
                      </Button>
                      <Button
                        disabled={isSubmitting}
                        onClick={() => handleConfirm("Approved")}
                        className="min-w-[120px] bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        {isSubmitting ? "Đang xử lý..." : "Duyệt"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Tài liệu xác minh */}
            {imageList.length > 0 && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Image className="w-5 h-5 text-purple-600" />
                    </div>
                    Tài liệu xác minh
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    {imageList.map((img, index) => (
                      <div
                        key={index}
                        className="group relative cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                        onClick={() => {
                          setSelectedImage(img.src);
                          setIsImageModalOpen(true);
                        }}
                      >
                        <img
                          src={img.src}
                          alt={img.label}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                            <p className="text-xs font-semibold text-gray-800">Xem ảnh</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 font-medium">{img.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Người đăng ký */}
            {o.userRegisterInfo && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    Người đăng ký
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Họ tên</Label>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {o.userRegisterInfo?.fullName || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Email</Label>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {o.userRegisterInfo?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Số điện thoại</Label>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {o.userRegisterInfo?.phoneNumber || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal - Giống ManagerEventDetailPage */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-xl">
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Enlarged document" 
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
