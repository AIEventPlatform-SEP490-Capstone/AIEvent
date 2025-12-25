import React, { useState, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import useOrganizers from "../../hooks/useOrganizers";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export default function BecomeOrganizerPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);

  const { createOrganizer } = useOrganizers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

  // ✅ Dữ liệu form (đúng theo Swagger)
  const [form, setForm] = useState({
    OrganizationType: "PrivateCompany",
    EventFrequency: "Occasionally",
    EventSize: "Medium",
    OrganizerType: "Individual",
    EventExperienceLevel: "Beginner",
    ContactName: "",
    ContactEmail: "",
    ContactPhone: "",
    Address: "",
    Website: "",
    UrlFacebook: "",
    UrlInstagram: "",
    UrlLinkedIn: "",
    ExperienceDescription: "",
    IdentityNumber: "",
    CompanyName: "",
    TaxCode: "",
    CompanyDescription: "",
    ImgCompany: null,
    ImgFrontIdentity: null,
    ImgBackIdentity: null,
    ImgBusinessLicense: null,
    agreeTerms: false,
    agreeDataProcessing: false,
  });



  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files?.[0] || null }));
    } else if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = async () => {
    const required = [
      "ContactName",
      "ContactEmail",
      "ContactPhone",
      "Address",
      "CompanyName",
      "CompanyDescription",
    ];
    const missing = required.filter(
      (f) => !form[f] || (typeof form[f] === "string" && form[f].trim() === "")
    );
    if (missing.length > 0) {
      toast.error("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return false;
    }
    if (!form.agreeTerms || !form.agreeDataProcessing) {
      toast.error("Vui lòng đồng ý với Điều khoản và xử lý dữ liệu.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validate();
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          key !== "agreeTerms" &&
          key !== "agreeDataProcessing"
        ) {
          data.append(key, value);
        }
      });

      const res = await createOrganizer(data);
      const result = res?.payload || res; //  Lấy payload thực tế từ Redux Toolkit
      console.log("✅ Organizer API response:", result);

      //  nhận diện phản hồi thành công (AIE20100)
      if (
        result?.statusCode === "AIE20000" ||
        result?.statusCode === "AIE20100" ||
        result?.success === true ||
        (typeof result?.message === "string" &&
          result.message.toLowerCase().includes("success"))
      ) {
        toast.success("Đăng ký thành công! Hãy chờ xét duyệt hồ sơ.");
        // Lưu thông tin đăng ký để ApplicationStatusPage có thể đọc lại
        localStorage.setItem("organizerApplication", JSON.stringify(form));
        setTimeout(() => navigate("/application-status"), 1500);
        return;
      }

      const responseErrors = result?.errors || res?.errors;
      if (responseErrors) {
        const detail = Object.entries(responseErrors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        toast.error(`${result?.message || res?.message || "Lỗi đăng ký"} — ${detail}`);
        return;
      }

      toast.error(result?.message || res?.message || "Đăng ký thất bại.");
    } catch (err) {
      console.error("Submit organizer error:", err);
      toast.error("Có lỗi xảy ra khi gửi đơn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      user?.email &&
      (!form.ContactEmail || form.ContactEmail.trim() === "")
    ) {
      setForm((prev) => ({ ...prev, ContactEmail: user.email }));
    }
  }, [user]);

  //  Helper hiển thị tên file hoặc placeholder
  const renderFileName = (file) => (
    <p className="text-sm text-muted-foreground mt-1">
      {file ? `📄 ${file.name}` : "Chưa có tệp nào được chọn"}
    </p>
  );

  return (
    <div className="min-h-screen bg-background py-10">
      <Card className="max-w-4xl mx-auto border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Đăng ký trở thành Nhà tổ chức sự kiện
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SECTION 1: COMPANY INFO */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Thông tin tổ chức
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tên công ty *</Label>
                  <Input
                    name="CompanyName"
                    value={form.CompanyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label>Mã số thuế *</Label>
                  <Input
                    name="TaxCode"
                    value={form.TaxCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>Loại hình tổ chức *</Label>
                <select
                  name="OrganizationType"
                  value={form.OrganizationType}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="PrivateCompany">Công ty tư nhân</option>
                  <option value="StateEnterprise">Doanh nghiệp nhà nước</option>
                  <option value="NonProfit">Tổ chức phi lợi nhuận</option>
                  <option value="IndividualBusiness">Hộ kinh doanh</option>
                  <option value="StartUp">Start-up</option>
                  <option value="CommunityClub">Cộng đồng / CLB</option>
                  <option value="SchoolUniversity">Trường / Đại học</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div>
                <Label>Loại Organizer *</Label>
                <select
                  name="OrganizerType"
                  value={form.OrganizerType}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="Individual">Cá nhân</option>
                  <option value="Business">Doanh nghiệp</option>
                </select>
              </div>

              <div>
                <Label>Địa chỉ *</Label>
                <Input
                  name="Address"
                  value={form.Address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Giới thiệu công ty *</Label>
                <Textarea
                  name="CompanyDescription"
                  value={form.CompanyDescription}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>
            </section>

            {/* SECTION 2: CONTACT INFO */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Thông tin liên hệ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tên người liên hệ *</Label>
                  <Input
                    name="ContactName"
                    value={form.ContactName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    disabled
                    type="email"
                    name="ContactEmail"
                    value={form.ContactEmail}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label>Số điện thoại *</Label>
                  <Input
                    type="tel"
                    name="ContactPhone"
                    value={form.ContactPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Website</Label>
                  <Input
                    name="Website"
                    value={form.Website}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Facebook</Label>
                  <Input
                    name="UrlFacebook"
                    value={form.UrlFacebook}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    name="UrlInstagram"
                    value={form.UrlInstagram}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    name="UrlLinkedIn"
                    value={form.UrlLinkedIn}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>CMND / CCCD (Identity Number)</Label>
                  <Input
                    name="IdentityNumber"
                    value={form.IdentityNumber}
                    onChange={handleChange}
                    placeholder="012345678"
                  />
                </div>
              </div>
            </section>

            {/* SECTION 3: EXPERIENCE */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Kinh nghiệm tổ chức sự kiện
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tần suất tổ chức</Label>
                  <select
                    name="EventFrequency"
                    value={form.EventFrequency}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  >
                    <option value="Weekly">Hàng tuần</option>
                    <option value="Monthly">Hàng tháng</option>
                    <option value="Quarterly">Hàng quý</option>
                    <option value="Yearly">Hàng năm</option>
                    <option value="Occasionally">Thỉnh thoảng</option>
                  </select>
                </div>
                <div>
                  <Label>Quy mô sự kiện</Label>
                  <select
                    name="EventSize"
                    value={form.EventSize}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  >
                    <option value="Small">Nhỏ</option>
                    <option value="Medium">Trung bình</option>
                    <option value="Large">Lớn</option>
                    <option value="ExtraLarge">Rất lớn</option>
                  </select>
                </div>
                <div>
                  <Label>Trình độ kinh nghiệm</Label>
                  <select
                    name="EventExperienceLevel"
                    value={form.EventExperienceLevel}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  >
                    <option value="Beginner">Mới bắt đầu</option>
                    <option value="Intermediate">Trung bình</option>
                    <option value="Experienced">Có kinh nghiệm</option>
                    <option value="Expert">Chuyên nghiệp</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Mô tả kinh nghiệm</Label>
                <Textarea
                  name="ExperienceDescription"
                  value={form.ExperienceDescription}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </section>

            {/* SECTION 4: DOCUMENTS */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Tài liệu xác minh
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Logo công ty */}
                <div>
                  <Label>Logo công ty *</Label>
                  <div className="mt-2 flex flex-col gap-2">
                    <Input
                      type="file"
                      name="ImgCompany"
                      accept="image/*"
                      onChange={handleChange}
                    />
                    {form.ImgCompany && (
                      <div className="relative w-40 h-40 border rounded overflow-hidden group">
                        <img
                          src={
                            typeof form.ImgCompany === "string"
                              ? form.ImgCompany
                              : URL.createObjectURL(form.ImgCompany)
                          }
                          alt="Logo công ty"
                          onClick={() => setSelectedImage(form.ImgCompany)}
                          className="object-cover w-full h-full cursor-pointer hover:opacity-80"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Giấy phép kinh doanh */}
                <div>
                  <Label>Giấy phép kinh doanh *</Label>
                  <div className="mt-2 flex flex-col gap-2">
                    <Input
                      type="file"
                      name="ImgBusinessLicense"
                      accept="image/*"
                      onChange={handleChange}
                    />
                    {form.ImgBusinessLicense && (
                      <div className="relative w-40 h-40 border rounded overflow-hidden group">
                        <img
                          src={
                            typeof form.ImgBusinessLicense === "string"
                              ? form.ImgBusinessLicense
                              : URL.createObjectURL(form.ImgBusinessLicense)
                          }
                          alt="Giấy phép kinh doanh"
                          onClick={() =>
                            setSelectedImage(form.ImgBusinessLicense)
                          }
                          className="object-cover w-full h-full cursor-pointer hover:opacity-80"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* CMND/CCCD mặt trước */}
                <div>
                  <Label>CMND/CCCD (mặt trước) *</Label>
                  <div className="mt-2 flex flex-col gap-2">
                    <Input
                      type="file"
                      name="ImgFrontIdentity"
                      accept="image/*"
                      onChange={handleChange}
                    />
                    {form.ImgFrontIdentity && (
                      <div className="relative w-40 h-40 border rounded overflow-hidden group">
                        <img
                          src={
                            typeof form.ImgFrontIdentity === "string"
                              ? form.ImgFrontIdentity
                              : URL.createObjectURL(form.ImgFrontIdentity)
                          }
                          alt="CMND/CCCD mặt trước"
                          onClick={() =>
                            setSelectedImage(form.ImgFrontIdentity)
                          }
                          className="object-cover w-full h-full cursor-pointer hover:opacity-80"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* CMND/CCCD mặt sau */}
                <div>
                  <Label>CMND/CCCD (mặt sau) *</Label>
                  <div className="mt-2 flex flex-col gap-2">
                    <Input
                      type="file"
                      name="ImgBackIdentity"
                      accept="image/*"
                      onChange={handleChange}
                    />
                    {form.ImgBackIdentity && (
                      <div className="relative w-40 h-40 border rounded overflow-hidden group">
                        <img
                          src={
                            typeof form.ImgBackIdentity === "string"
                              ? form.ImgBackIdentity
                              : URL.createObjectURL(form.ImgBackIdentity)
                          }
                          alt="CMND/CCCD mặt sau"
                          onClick={() => setSelectedImage(form.ImgBackIdentity)}
                          className="object-cover w-full h-full cursor-pointer hover:opacity-80"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <Dialog
              open={!!selectedImage}
              onOpenChange={() => setSelectedImage(null)}
            >
              <DialogContent className="max-w-3xl p-4">
                <DialogHeader>
                  <DialogTitle>Xem hình ảnh</DialogTitle>
                </DialogHeader>
                {selectedImage && (
                  <img
                    src={
                      typeof selectedImage === "string"
                        ? selectedImage
                        : URL.createObjectURL(selectedImage)
                    }
                    alt="Xem ảnh"
                    className="w-full h-auto rounded border object-contain"
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* SECTION 5: AGREEMENT */}
            {/* --- Điều khoản và xử lý dữ liệu cá nhân --- */}
            <section className="space-y-4">
              {/* Đồng ý điều khoản */}
              <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={form.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 border-2 accent-primary"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="agreeTerms"
                      className="text-sm font-medium leading-relaxed cursor-pointer"
                    >
                      <span className="text-red-500 mr-1">*</span>
                      Tôi đồng ý với{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-primary hover:text-primary/80 font-semibold underline"
                      >
                        điều khoản dành cho nhà tổ chức
                      </a>{" "}
                      và{" "}
                      <a
                        href="/organizer-policy"
                        target="_blank"
                        className="text-primary hover:text-primary/80 font-semibold underline"
                      >
                        chính sách tổ chức sự kiện
                      </a>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bắt buộc để gửi đơn đăng ký
                    </p>
                  </div>
                </div>
              </div>

              {/* Đồng ý xử lý dữ liệu cá nhân */}
              <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeDataProcessing"
                    name="agreeDataProcessing"
                    checked={form.agreeDataProcessing}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 border-2 accent-primary"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="agreeDataProcessing"
                      className="text-sm font-medium leading-relaxed cursor-pointer"
                    >
                      <span className="text-red-500 mr-1">*</span>
                      Tôi đồng ý cho <strong>AIEvent</strong> xử lý thông tin cá
                      nhân của tôi để xem xét đơn đăng ký
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cần thiết cho quá trình duyệt đơn
                    </p>
                  </div>
                </div>
              </div>

              {/* Quy trình duyệt đơn */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Quy trình duyệt đơn
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    Chúng tôi sẽ xem xét đơn đăng ký trong vòng 2–3 ngày làm
                    việc
                  </li>
                  <li>Bạn sẽ nhận được email thông báo kết quả</li>
                  <li>
                    Nếu được duyệt, tài khoản sẽ được nâng cấp thành{" "}
                    <strong>Organizer</strong>
                  </li>
                  <li>
                    Nếu cần thêm thông tin, chúng tôi sẽ liên hệ qua email
                  </li>
                </ul>
              </div>
            </section>

            <Button
              type="submit"
              className="w-full mt-4"
              disabled={
                isSubmitting ||
                !form.agreeTerms ||
                !form.agreeDataProcessing
              }
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isSubmitting ? "Đang gửi đơn..." : "Gửi đơn đăng ký"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
