import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const { getOrganizerById, confirmOrganizer } = useOrganizers();
  const [organizer, setOrganizer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null); // State để quản lý hình ảnh được chọn

  useEffect(() => {
    const fetchData = async () => {
      const data = await getOrganizerById(id);
      setOrganizer(data);
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const handleConfirm = async (status) => {
    if (!id) return;
    setIsSubmitting(true);
    await confirmOrganizer(id, { status, reason });
    setIsSubmitting(false);
    navigate("/admin/organizers");
  };

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

  const translate = (type, value) =>
    translations[type]?.[value] || value || "—";

  return (
    <div className="p-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
      </Button>

      <Card className="border-border/50 shadow-md max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Chi tiết hồ sơ Organizer
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Thông tin công ty */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              🏢 Thông tin công ty
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={o.imgCompany}
                alt="Logo công ty"
                className="w-24 h-24 rounded border object-cover"
              />
              <div>
                <p className="text-xl font-semibold">{o.companyName}</p>
                <p className="text-muted-foreground">
                  Loại hình tổ chức:{" "}
                  {translate("organizationType", o.organizationType)}
                </p>
                <p className="text-muted-foreground">
                  Mã số thuế: {o.taxCode || "—"}
                </p>
              </div>
            </div>
            <div>
              <strong>Mô tả công ty:</strong>
              <p className="text-muted-foreground mt-1">
                {o.companyDescription || "Không có mô tả"}
              </p>
            </div>
          </section>

          {/* Thông tin liên hệ */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              📞 Thông tin liên hệ
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Người liên hệ:</strong> {o.contactName}
              </p>
              <p>
                <strong>Email:</strong> {o.contactEmail}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {o.contactPhone}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {o.address}
              </p>
            </div>
          </section>

          {/* Kinh nghiệm & quy mô tổ chức */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              💼 Kinh nghiệm & Quy mô tổ chức
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Loại Organizer:</strong>{" "}
                {translate("organizerType", o.organizerType)}
              </p>
              <p>
                <strong>Tần suất tổ chức sự kiện:</strong>{" "}
                {translate("eventFrequency", o.eventFrequency)}
              </p>
              <p>
                <strong>Quy mô sự kiện:</strong>{" "}
                {translate("eventSize", o.eventSize)}
              </p>
              <p>
                <strong>Trình độ kinh nghiệm:</strong>{" "}
                {translate("eventExperienceLevel", o.eventExperienceLevel)}
              </p>
            </div>
            <div className="mt-3">
              <strong>Mô tả kinh nghiệm:</strong>
              <p className="text-muted-foreground mt-1">
                {o.experienceDescription || "Không có mô tả"}
              </p>
            </div>
          </section>

          {/* Liên kết mạng xã hội */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              🌐 Liên kết mạng xã hội
            </h3>
            <div className="flex flex-wrap gap-3">
              {o.website && (
                <a
                  href={o.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
              {o.urlFacebook && (
                <a
                  href={o.urlFacebook}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
              )}
              {o.urlInstagram && (
                <a
                  href={o.urlInstagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-pink-500 hover:underline"
                >
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
              {o.urlLinkedIn && (
                <a
                  href={o.urlLinkedIn}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sky-700 hover:underline"
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
            </div>
          </section>

          {/* Hình ảnh xác minh */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              🖼️ Hình ảnh xác minh
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {[
                { src: o.imgFrontIdentity, label: "CMND/CCCD Mặt Trước" },
                { src: o.imgBackIdentity, label: "CMND/CCCD Mặt Sau" },
                { src: o.imgBusinessLicense, label: "Giấy Phép Kinh Doanh" },
              ].map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.src}
                    alt={img.label}
                    onClick={() => setSelectedImage(img)}
                    className="w-full h-48 object-cover border rounded cursor-pointer hover:opacity-90"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {img.label}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn className="w-6 h-6 text-white bg-black/60 p-1 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Thông tin người đăng ký */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              👤 Thông tin người đăng ký
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Họ tên:</strong> {o.userRegisterInfo?.fullName}
              </p>
              <p>
                <strong>Email:</strong> {o.userRegisterInfo?.email}
              </p>
              <p>
                <strong>Số điện thoại:</strong>{" "}
                {o.userRegisterInfo?.phoneNumber}
              </p>
            </div>
          </section>

          {/* Xác nhận duyệt / từ chối — chỉ hiện khi trạng thái là NeedConfirm */}
          {o.status === "NeedConfirm" && (
            <section>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                ✅ Xác nhận duyệt hồ sơ
              </h3>
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
                  onClick={() => handleConfirm("Reject")}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Từ chối
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleConfirm("Approve")}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Duyệt hồ sơ
                </Button>
              </div>
            </section>
          )}
        </CardContent>
      </Card>

      {/* Dialog hiển thị ảnh đầy đủ */}
      {/* <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle>{selectedImage?.label}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage.src}
              alt={selectedImage.label}
              className="w-full h-auto rounded border object-contain"
            />
          )}
        </DialogContent>
      </Dialog> */}
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
    </div>
  );
}
