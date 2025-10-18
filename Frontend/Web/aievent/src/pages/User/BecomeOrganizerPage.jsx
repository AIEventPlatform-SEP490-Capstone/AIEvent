import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Users,
  Calendar,
  Award,
  Upload,
  X,
} from "lucide-react";

const APPLICATION_STEPS = {
  BASIC_INFO: 1,
  EXPERIENCE: 2,
  BUSINESS_INFO: 3,
  CONFIRMATION: 4,
};

const ORGANIZATION_TYPES = [
  "Công ty tư nhân",
  "Doanh nghiệp nhà nước",
  "Tổ chức phi lợi nhuận",
  "Cá nhân kinh doanh",
  "Startup",
  "Cộng đồng/Câu lạc bộ",
  "Trường học/Đại học",
  "Khác",
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Mới bắt đầu (0-1 năm)" },
  { value: "intermediate", label: "Có kinh nghiệm (1-3 năm)" },
  { value: "experienced", label: "Giàu kinh nghiệm (3-5 năm)" },
  { value: "expert", label: "Chuyên gia (5+ năm)" },
];

const EVENT_CATEGORIES = [
  "Công nghệ",
  "Kinh doanh",
  "Giáo dục",
  "Âm nhạc",
  "Nghệ thuật",
  "Thể thao",
  "Sức khỏe",
  "Du lịch",
  "Ẩm thực",
  "Thời trang",
  "Gaming",
  "Khởi nghiệp",
  "Marketing",
  "Thiết kế",
  "Nhiếp ảnh",
];

export default function BecomeOrganizerPage() {
  const [currentStep, setCurrentStep] = useState(APPLICATION_STEPS.BASIC_INFO);
  const [applicationData, setApplicationData] = useState({
    // Basic Info
    organizationName: "",
    organizationType: "",
    website: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      linkedin: "",
    },
    description: "",

    // Experience
    experienceLevel: "",
    previousEvents: "",
    eventCategories: [],
    expectedEventFrequency: "",
    averageAttendees: "",

    // Business Info
    businessLicense: "",
    taxCode: "",
    bankAccount: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    businessAddress: "",

    // Documents
    documents: [],

    // Agreement
    agreeTerms: false,
    agreeDataProcessing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState({ role: null }); // Mock user state for pure React

  const toggleEventCategory = (category) => {
    const categories = applicationData.eventCategories;
    if (categories.includes(category)) {
      setApplicationData((prev) => ({
        ...prev,
        eventCategories: categories.filter((c) => c !== category),
      }));
    } else {
      setApplicationData((prev) => ({
        ...prev,
        eventCategories: [...categories, category],
      }));
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call to submit organizer application
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In real app, this would send data to backend for admin review
      console.log("Organizer application submitted:", applicationData);

      window.location.href = "/application-status";
    } catch (error) {
      alert("Có lỗi xảy ra\nVui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < APPLICATION_STEPS.CONFIRMATION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > APPLICATION_STEPS.BASIC_INFO) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case APPLICATION_STEPS.BASIC_INFO:
        return (
          applicationData.organizationName &&
          applicationData.organizationType &&
          applicationData.description
        );
      case APPLICATION_STEPS.EXPERIENCE:
        return (
          applicationData.experienceLevel &&
          applicationData.eventCategories.length > 0
        );
      case APPLICATION_STEPS.BUSINESS_INFO:
        return (
          applicationData.contactPerson &&
          applicationData.contactPhone &&
          applicationData.contactEmail
        );
      default:
        return true;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <p className="text-muted-foreground mb-8">
            Bạn cần đăng nhập để đăng ký trở thành nhà tổ chức sự kiện.
          </p>
          <a href="/auth/login">
            <Button>Đăng nhập ngay</Button>
          </a>
        </div>
      </div>
    );
  }

  if (user.role === "organizer") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Bạn đã là nhà tổ chức</h1>
          <p className="text-muted-foreground mb-8">
            Tài khoản của bạn đã có quyền tổ chức sự kiện.
          </p>
          <a href="/organizer">
            <Button>Đi đến Dashboard</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </a>
          <h1 className="text-3xl font-bold text-foreground">
            Đăng ký trở thành Organizer
          </h1>
          <p className="text-muted-foreground mt-2">
            Tạo và quản lý sự kiện của riêng bạn
          </p>

          {/* Progress Steps */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-0.5 mx-2 ${
                        step < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-3 text-sm text-muted-foreground">
            <span>
              {currentStep === 1 && "Thông tin tổ chức"}
              {currentStep === 2 && "Kinh nghiệm & Chuyên môn"}
              {currentStep === 3 && "Thông tin kinh doanh"}
              {currentStep === 4 && "Xác nhận đăng ký"}
            </span>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              {currentStep === APPLICATION_STEPS.BASIC_INFO && (
                <>
                  <Building className="w-5 h-5" />
                  Thông tin tổ chức
                </>
              )}
              {currentStep === APPLICATION_STEPS.EXPERIENCE && (
                <>
                  <Award className="w-5 h-5" />
                  Kinh nghiệm tổ chức sự kiện
                </>
              )}
              {currentStep === APPLICATION_STEPS.BUSINESS_INFO && (
                <>
                  <Users className="w-5 h-5" />
                  Thông tin liên hệ & Kinh doanh
                </>
              )}
              {currentStep === APPLICATION_STEPS.CONFIRMATION && (
                <>
                  <Calendar className="w-5 h-5" />
                  Xác nhận đăng ký
                </>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmitApplication}>
              {/* Step 1: Basic Organization Info */}
              {currentStep === APPLICATION_STEPS.BASIC_INFO && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Tên tổ chức/Công ty *</Label>
                      <Input
                        id="orgName"
                        placeholder="VD: Vietnam Tech Community"
                        value={applicationData.organizationName}
                        onChange={(e) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            organizationName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orgType">Loại hình tổ chức *</Label>
                      <Select
                        value={applicationData.organizationType}
                        onValueChange={(value) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            organizationType: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại hình" />
                        </SelectTrigger>
                        <SelectContent>
                          {ORGANIZATION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={applicationData.website}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Mạng xã hội</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          placeholder="facebook.com/yourpage"
                          value={applicationData.socialMedia.facebook}
                          onChange={(e) =>
                            setApplicationData((prev) => ({
                              ...prev,
                              socialMedia: {
                                ...prev.socialMedia,
                                facebook: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          placeholder="@youraccount"
                          value={applicationData.socialMedia.instagram}
                          onChange={(e) =>
                            setApplicationData((prev) => ({
                              ...prev,
                              socialMedia: {
                                ...prev.socialMedia,
                                instagram: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          placeholder="linkedin.com/company/yourcompany"
                          value={applicationData.socialMedia.linkedin}
                          onChange={(e) =>
                            setApplicationData((prev) => ({
                              ...prev,
                              socialMedia: {
                                ...prev.socialMedia,
                                linkedin: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả về tổ chức *</Label>
                    <Textarea
                      id="description"
                      placeholder="Giới thiệu về tổ chức, lĩnh vực hoạt động, mục tiêu..."
                      value={applicationData.description}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Experience */}
              {currentStep === APPLICATION_STEPS.EXPERIENCE && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      Mức độ kinh nghiệm tổ chức sự kiện *
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <div
                          key={level.value}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="radio"
                            id={level.value}
                            name="experience"
                            value={level.value}
                            checked={
                              applicationData.experienceLevel === level.value
                            }
                            onChange={(e) =>
                              setApplicationData((prev) => ({
                                ...prev,
                                experienceLevel: e.target.value,
                              }))
                            }
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor={level.value}
                            className="cursor-pointer"
                          >
                            {level.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      Lĩnh vực sự kiện quan tâm *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Chọn các lĩnh vực bạn muốn tổ chức sự kiện
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_CATEGORIES.map((category) => (
                        <Badge
                          key={category}
                          variant={
                            applicationData.eventCategories.includes(category)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer hover:bg-primary/80"
                          onClick={() => toggleEventCategory(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                    {applicationData.eventCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">
                          Đã chọn:
                        </span>
                        {applicationData.eventCategories.map((category) => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {category}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => toggleEventCategory(category)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">
                        Tần suất tổ chức dự kiến
                      </Label>
                      <Select
                        value={applicationData.expectedEventFrequency}
                        onValueChange={(value) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            expectedEventFrequency: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tần suất" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Hàng tuần</SelectItem>
                          <SelectItem value="monthly">Hàng tháng</SelectItem>
                          <SelectItem value="quarterly">Hàng quý</SelectItem>
                          <SelectItem value="yearly">Hàng năm</SelectItem>
                          <SelectItem value="occasional">
                            Thỉnh thoảng
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attendees">
                        Số lượng người tham gia dự kiến
                      </Label>
                      <Select
                        value={applicationData.averageAttendees}
                        onValueChange={(value) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            averageAttendees: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn quy mô" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">
                            Nhỏ (10-50 người)
                          </SelectItem>
                          <SelectItem value="medium">
                            Trung bình (50-200 người)
                          </SelectItem>
                          <SelectItem value="large">
                            Lớn (200-500 người)
                          </SelectItem>
                          <SelectItem value="xlarge">
                            Rất lớn (500+ người)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previousEvents">
                      Kinh nghiệm tổ chức sự kiện trước đây
                    </Label>
                    <Textarea
                      id="previousEvents"
                      placeholder="Mô tả các sự kiện bạn đã tổ chức, vai trò của bạn, kết quả đạt được..."
                      value={applicationData.previousEvents}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          previousEvents: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Business Info */}
              {currentStep === APPLICATION_STEPS.BUSINESS_INFO && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">
                        Người liên hệ chính *
                      </Label>
                      <Input
                        id="contactPerson"
                        placeholder="Họ và tên"
                        value={applicationData.contactPerson}
                        onChange={(e) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            contactPerson: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Số điện thoại *</Label>
                      <Input
                        id="contactPhone"
                        placeholder="+84 xxx xxx xxx"
                        value={applicationData.contactPhone}
                        onChange={(e) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            contactPhone: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email liên hệ *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contact@yourorganization.com"
                      value={applicationData.contactEmail}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          contactEmail: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Địa chỉ kinh doanh</Label>
                    <Textarea
                      id="businessAddress"
                      placeholder="Địa chỉ đầy đủ của tổ chức"
                      value={applicationData.businessAddress}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          businessAddress: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessLicense">
                        Số giấy phép kinh doanh
                      </Label>
                      <Input
                        id="businessLicense"
                        placeholder="VD: 0123456789"
                        value={applicationData.businessLicense}
                        onChange={(e) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            businessLicense: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxCode">Mã số thuế</Label>
                      <Input
                        id="taxCode"
                        placeholder="VD: 0123456789"
                        value={applicationData.taxCode}
                        onChange={(e) =>
                          setApplicationData((prev) => ({
                            ...prev,
                            taxCode: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">
                      Thông tin tài khoản ngân hàng
                    </Label>
                    <Input
                      id="bankAccount"
                      placeholder="Số tài khoản - Tên ngân hàng"
                      value={applicationData.bankAccount}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          bankAccount: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      Tài liệu đính kèm
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Tải lên giấy phép kinh doanh, chứng minh nhân dân, hoặc
                        tài liệu liên quan
                      </p>
                      <Button type="button" variant="outline" size="sm">
                        Chọn tệp
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === APPLICATION_STEPS.CONFIRMATION && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      Xác nhận thông tin đăng ký
                    </h3>
                    <p className="text-muted-foreground">
                      Vui lòng kiểm tra lại thông tin trước khi gửi đơn
                    </p>
                  </div>

                  <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-semibold">
                        Thông tin tổ chức:
                      </Label>
                      <p className="mt-1">{applicationData.organizationName}</p>
                      <p className="text-sm text-muted-foreground">
                        {applicationData.organizationType}
                      </p>
                      <p className="text-sm mt-2">
                        {applicationData.description}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <Label className="font-semibold">
                        Kinh nghiệm & Chuyên môn:
                      </Label>
                      <p className="mt-1">
                        {
                          EXPERIENCE_LEVELS.find(
                            (l) => l.value === applicationData.experienceLevel
                          )?.label
                        }
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {applicationData.eventCategories.map((category) => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="font-semibold">
                        Thông tin liên hệ:
                      </Label>
                      <p className="mt-1">{applicationData.contactPerson}</p>
                      <p className="text-sm text-muted-foreground">
                        {applicationData.contactEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {applicationData.contactPhone}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={applicationData.agreeTerms}
                          onChange={(e) =>
                            setApplicationData((prev) => ({
                              ...prev,
                              agreeTerms: e.target.checked,
                            }))
                          }
                          className="mt-1 h-5 w-5 border-2"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor="terms"
                            className="text-sm font-medium leading-relaxed cursor-pointer"
                          >
                            <span className="text-red-500 mr-1">*</span>
                            Tôi đồng ý với{" "}
                            <a
                              href="/terms"
                              className="text-primary hover:text-primary/80 font-semibold underline"
                            >
                              điều khoản dành cho nhà tổ chức
                            </a>{" "}
                            và{" "}
                            <a
                              href="/organizer-policy"
                              className="text-primary hover:text-primary/80 font-semibold underline"
                            >
                              chính sách tổ chức sự kiện
                            </a>
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Bắt buộc để gửi đơn đăng ký
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="dataProcessing"
                          checked={applicationData.agreeDataProcessing}
                          onChange={(e) =>
                            setApplicationData((prev) => ({
                              ...prev,
                              agreeDataProcessing: e.target.checked,
                            }))
                          }
                          className="mt-1 h-5 w-5 border-2"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor="dataProcessing"
                            className="text-sm font-medium leading-relaxed cursor-pointer"
                          >
                            <span className="text-red-500 mr-1">*</span>
                            Tôi đồng ý cho AIEvent xử lý thông tin cá nhân để
                            xem xét đơn đăng ký
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cần thiết cho quá trình duyệt đơn
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Quy trình duyệt đơn
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • Chúng tôi sẽ xem xét đơn đăng ký trong vòng 2-3 ngày
                        làm việc
                      </li>
                      <li>• Bạn sẽ nhận được email thông báo kết quả</li>
                      <li>
                        • Nếu được duyệt, tài khoản sẽ được nâng cấp thành
                        Organizer
                      </li>
                      <li>
                        • Nếu cần thêm thông tin, chúng tôi sẽ liên hệ qua email
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isSubmitting ||
                      !applicationData.agreeTerms ||
                      !applicationData.agreeDataProcessing
                    }
                  >
                    {isSubmitting ? "Đang gửi đơn..." : "Gửi đơn đăng ký"}
                  </Button>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < APPLICATION_STEPS.CONFIRMATION && (
                <div className="flex gap-4 mt-8">
                  {currentStep > APPLICATION_STEPS.BASIC_INFO && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Quay lại
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1"
                    disabled={!canProceedToNext()}
                  >
                    Tiếp tục
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
