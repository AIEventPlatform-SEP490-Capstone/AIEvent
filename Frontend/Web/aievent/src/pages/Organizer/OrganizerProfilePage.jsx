import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import useOrganizers from "../../hooks/useOrganizers";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  User,
  Building2,
  Camera,
  Edit3,
  Save,
  X,
  FileBadge,
  Globe,
  Image as ImageIcon,
  ListChecks,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Users,
  Star,
  Award,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Link,
  Facebook,
  Instagram,
  Linkedin,
  Receipt,
  ChevronDown,
} from "lucide-react";

const DICTIONARIES = {
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
  organizerType: { Individual: "Cá nhân", Business: "Doanh nghiệp" },
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

export default function OrganizerProfilePage() {
  const { getOrganizerProfile, updateOrganizer } = useOrganizers();
  const containerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("personal");
  const [profile, setProfile] = useState({});
  const [originalProfile, setOriginalProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // store ref to last focused element id and caret positions to restore after setState
  const lastFocusRef = useRef({ id: null, start: null, end: null });

  //  Fetch dữ liệu từ API
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const data = await getOrganizerProfile();
      setProfile(data || {});
      setOriginalProfile(JSON.parse(JSON.stringify(data || {})));
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // stable callbacks
  const handleChange = useCallback((key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleFileChange = useCallback((key, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setProfile((prev) => ({
      ...prev,
      [key]: file,
      [`preview_${key}`]: previewUrl,
    }));
  }, []);

  // Validation functions
  const validateURL = (url, fieldName) => {
    if (!url || url.trim() === '') return null;
    try {
      new URL(url);
      return null;
    } catch {
      return `${fieldName} phải là URL hợp lệ (ví dụ: https://example.com)`;
    }
  };

  const validateDropdown = (value, options, fieldName) => {
    if (!value || value.trim() === '') return null;
    if (!Object.keys(options).includes(value)) {
      return `${fieldName} không hợp lệ`;
    }
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validation
      const errors = [];

      // Validate URLs
      if (profile.website) {
        const websiteError = validateURL(profile.website, 'Website');
        if (websiteError) errors.push(websiteError);
      }

      if (profile.urlFacebook) {
        const fbError = validateURL(profile.urlFacebook, 'Facebook URL');
        if (fbError) errors.push(fbError);
      }

      if (profile.urlInstagram) {
        const igError = validateURL(profile.urlInstagram, 'Instagram URL');
        if (igError) errors.push(igError);
      }

      if (profile.urlLinkedIn) {
        const liError = validateURL(profile.urlLinkedIn, 'LinkedIn URL');
        if (liError) errors.push(liError);
      }

      // Validate dropdown fields
      if (profile.organizerType) {
        const orgTypeError = validateDropdown(profile.organizerType, dictionaries.organizerType, 'Loại Organizer');
        if (orgTypeError) errors.push(orgTypeError);
      }

      if (profile.organizationType) {
        const orgTypeError = validateDropdown(profile.organizationType, dictionaries.organizationType, 'Loại hình tổ chức');
        if (orgTypeError) errors.push(orgTypeError);
      }

      if (profile.eventFrequency) {
        const freqError = validateDropdown(profile.eventFrequency, dictionaries.eventFrequency, 'Tần suất tổ chức sự kiện');
        if (freqError) errors.push(freqError);
      }

      if (profile.eventSize) {
        const sizeError = validateDropdown(profile.eventSize, dictionaries.eventSize, 'Quy mô sự kiện');
        if (sizeError) errors.push(sizeError);
      }

      if (profile.eventExperienceLevel) {
        const expError = validateDropdown(profile.eventExperienceLevel, dictionaries.eventExperienceLevel, 'Kinh nghiệm tổ chức');
        if (expError) errors.push(expError);
      }

      // Nếu có lỗi validation, hiển thị và dừng lại
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error));
        setSaving(false);
        return;
      }

      // Chỉ gửi các field có thể edit theo API documentation
      const formData = new FormData();
      const editableFields = [
        'contactName',
        'address',
        'website',
        'urlFacebook',
        'urlInstagram',
        'urlLinkedIn',
        'experienceDescription',
        'companyDescription',
        'imgCompany',
        'organizationType',
        'eventFrequency',
        'eventSize',
        'organizerType',
        'eventExperienceLevel'
      ];

      // Chỉ gửi các field hợp lệ
      for (const key of editableFields) {
        const val = profile[key];
        if (val === undefined || val === null || val === '') continue;
        
        // Nếu là File thì append trực tiếp
        if (val instanceof File) {
          formData.append(key, val);
        } 
        // Nếu có preview_* và không có file mới, bỏ qua (giữ nguyên ảnh cũ)
        else if (key.startsWith('img') && profile[`preview_${key}`] && !(val instanceof File)) {
          // Bỏ qua - giữ nguyên ảnh cũ trên server
          continue;
        }
        // Các field text khác
        else {
          formData.append(key, String(val).trim());
        }
      }

      await updateOrganizer(formData);
      
      // Reload lại dữ liệu từ API sau khi save thành công
      const updatedData = await getOrganizerProfile();
      setProfile(updatedData || {});
      setOriginalProfile(JSON.parse(JSON.stringify(updatedData || {})));
      setEditMode(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      // Error đã được xử lý trong updateOrganizerAPI với toast
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(JSON.parse(JSON.stringify(originalProfile)));
    setEditMode(false);
  };

  // Chỉ scroll khi đổi tab khác, không khi nhập
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      if (containerRef.current)
        containerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-20 text-gray-500">
        Đang tải hồ sơ tổ chức...
      </div>
    );

  /**
   * Helpers: restore focus & selection after a state update.
   * We call this after each local change so the user can continue typing.
   */
  const restoreFocusForId = (id) => {
    setTimeout(() => {
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      try {
        el.focus();
        const { start, end } = lastFocusRef.current || {};
        if (typeof el.setSelectionRange === "function") {
          // if we have previous caret position, restore it; otherwise put caret at end
          const len = el.value?.length ?? 0;
          const s = Number.isInteger(start) ? start : len;
          const e = Number.isInteger(end) ? end : s;
          el.setSelectionRange(Math.min(s, len), Math.min(e, len));
        }
      } catch (err) {
        // ignore (some elements like select won't support setSelectionRange)
      }
    }, 0);
  };

  /**
   * Input (text) component which preserves caret/focus.
   */
  const Input = ({ label, id, value, onChange, type = "text", isEditable = true, icon: Icon }) => {
    const handleLocalChange = (e) => {
      const v = e.target.value;
      // remember caret position before update
      lastFocusRef.current = {
        id,
        start: e.target.selectionStart,
        end: e.target.selectionEnd,
      };
      onChange(v);
      restoreFocusForId(id);
    };

    const handleFocus = (e) => {
      lastFocusRef.current = {
        id,
        start: e.target.selectionStart,
        end: e.target.selectionEnd,
      };
    };

    const handleSelect = (e) => {
      lastFocusRef.current = {
        id,
        start: e.target.selectionStart,
        end: e.target.selectionEnd,
      };
    };

    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon size={18} />
            </div>
          )}
        <input
          id={id}
          name={id}
          type={type}
          value={value ?? ""}
            disabled={!editMode || !isEditable}
          onChange={handleLocalChange}
          onFocus={handleFocus}
          onSelect={handleSelect}
            className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              editMode && isEditable
                ? "border-gray-300 bg-white text-gray-900"
                : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
          }`}
        />
        </div>
      </div>
    );
  };

  /**
   * Textarea with caret preservation.
   */
  const Textarea = ({ label, id, value, onChange, isEditable = true, icon: Icon }) => {
    const handleLocalChange = (e) => {
      const v = e.target.value;
      lastFocusRef.current = {
        id,
        start: e.target.selectionStart,
        end: e.target.selectionEnd,
      };
      onChange(v);
      restoreFocusForId(id);
    };

    const handleFocus = (e) => {
      lastFocusRef.current = {
        id,
        start: e.target.selectionStart,
        end: e.target.selectionEnd,
      };
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-xs font-semibold text-gray-700">
          {label}
        </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-3 text-gray-400">
              <Icon size={18} />
            </div>
          )}
        <textarea
          id={id}
          name={id}
            rows={6}
          value={value ?? ""}
            disabled={!editMode || !isEditable}
          onChange={handleLocalChange}
          onFocus={handleFocus}
            className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y ${
              editMode && isEditable
                ? "border-gray-300 bg-white text-gray-900"
                : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
          }`}
        />
        </div>
      </div>
    );
  };

  /**
   * Select that preserves focus after change.
   */
  const Select = ({ label, id, options, value, onChange, isEditable = true, icon: Icon }) => {
    const handleLocalChange = (e) => {
      const v = e.target.value;
      // For select, we just remember the id (caret not applicable)
      lastFocusRef.current = { id, start: null, end: null };
      onChange(v);
      restoreFocusForId(id);
    };

    const handleFocus = (e) => {
      lastFocusRef.current = { id, start: null, end: null };
    };

    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              <Icon size={18} />
            </div>
          )}
          <select
            id={id}
            name={id}
            value={value ?? ""}
            disabled={!editMode || !isEditable}
            onChange={handleLocalChange}
            onFocus={handleFocus}
            className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-10 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${
              editMode && isEditable
                ? "border-gray-300 bg-white text-gray-900"
                : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            }`}
          >
            <option value="">-- Chọn --</option>
            {Object.entries(options).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>
    );
  };

  const dictionaries = DICTIONARIES; // local alias for readability

  // Danh sách các field có thể edit theo API
  const editableFields = [
    'contactName',
    'address',
    'website',
    'urlFacebook',
    'urlInstagram',
    'urlLinkedIn',
    'experienceDescription',
    'companyDescription',
    'imgCompany',
    'organizationType',
    'eventFrequency',
    'eventSize',
    'organizerType',
    'eventExperienceLevel'
  ];

  // Check if field is editable
  const isFieldEditable = (fieldName) => {
    return editableFields.includes(fieldName);
  };

  // Calculate statistics (placeholder values - can be replaced with actual API data)
  const stats = {
    totalEvents: 0,
    totalAttendees: 0,
    averageRating: 0,
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      {/* Header Background - Full width, extends down to tabs */}
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Hồ sơ của tôi</h1>
                  {!editMode ? (
                    <Button
                      onClick={() => setEditMode(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                    >
                <Edit3 size={18} /> Chỉnh sửa
                    </Button>
                  ) : (
              <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save size={18} /> {saving ? "Đang lưu..." : "Lưu"}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                  className="flex items-center gap-2"
                      >
                        <X size={18} /> Hủy
                      </Button>
              </div>
                  )}
                </div>
        </div>

        {/* Tabs */}
        <div className="mb-22">
          <div className="flex space-x-2 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/50">
            {[
              ["personal", "Thông tin cá nhân", User],
              ["business", "Thông tin doanh nghiệp", Building2],
              ["social", "Mạng xã hội", Globe],
              ["documents", "Giấy tờ xác minh", FileBadge],
            ].map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                activeTab === tab
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
              }`}
            >
                <Icon size={18} />
              {label}
            </button>
          ))}
          </div>
      </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* TAB: THÔNG TIN CÁ NHÂN */}
            {activeTab === "personal" && (
              <>
                <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700">
                      Thông tin cá nhân
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                        label="Họ và tên"
                id="contactName"
                        value={profile.contactName || ""}
                onChange={(v) => handleChange("contactName", v)}
                isEditable={isFieldEditable("contactName")}
                icon={User}
              />
              <Input
                label="Email"
                id="contactEmail"
                type="email"
                        value={profile.contactEmail || ""}
                onChange={(v) => handleChange("contactEmail", v)}
                isEditable={isFieldEditable("contactEmail")}
                icon={Mail}
              />
              <Input
                label="Số điện thoại"
                id="contactPhone"
                        value={profile.contactPhone || ""}
                onChange={(v) => handleChange("contactPhone", v)}
                isEditable={isFieldEditable("contactPhone")}
                icon={Phone}
              />
                      <Input
                        label="Số CMND/CCCD"
                        id="identityNumber"
                        value={profile.identityNumber || ""}
                        onChange={(v) => handleChange("identityNumber", v)}
                        isEditable={isFieldEditable("identityNumber")}
                        icon={CreditCard}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700">
                      Địa chỉ
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
              <Input
                label="Địa chỉ"
                id="address"
                      value={profile.address || ""}
                onChange={(v) => handleChange("address", v)}
                isEditable={isFieldEditable("address")}
                icon={MapPin}
              />
            </div>
                </Card>

                <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700">
                      Kinh nghiệm & mô tả
                    </h2>
                  </div>
                  <div className="p-6">
            <Textarea
                      label=""
              id="experienceDescription"
                      value={profile.experienceDescription || ""}
              onChange={(v) => handleChange("experienceDescription", v)}
              isEditable={isFieldEditable("experienceDescription")}
              icon={FileText}
            />
                  </div>
                </Card>
              </>
            )}

            {/* TAB: THÔNG TIN DOANH NGHIỆP */}
            {activeTab === "business" && (
              <>
                <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700">
                      Thông tin doanh nghiệp
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Tên công ty"
                        id="companyName"
                        value={profile.companyName || ""}
                        onChange={(v) => handleChange("companyName", v)}
                        isEditable={isFieldEditable("companyName")}
                        icon={Building2}
                      />
                      <Input
                        label="Mã số thuế"
                        id="taxCode"
                        value={profile.taxCode || ""}
                        onChange={(v) => handleChange("taxCode", v)}
                        isEditable={isFieldEditable("taxCode")}
                        icon={Receipt}
                      />
                      <Input
                        label="Website"
                        id="website"
                        value={profile.website || ""}
                        onChange={(v) => handleChange("website", v)}
                        isEditable={isFieldEditable("website")}
                        icon={Globe}
                      />
                    </div>
                    <Textarea
                      label="Giới thiệu công ty"
                      id="companyDescription"
                      value={profile.companyDescription || ""}
                      onChange={(v) => handleChange("companyDescription", v)}
                      isEditable={isFieldEditable("companyDescription")}
                      icon={FileText}
              />
                  </div>
                </Card>

                <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700">
                      Loại hình & quy mô
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Loại Organizer"
                id="organizerType"
                        value={profile.organizerType || ""}
                options={dictionaries.organizerType}
                onChange={(v) => handleChange("organizerType", v)}
                isEditable={isFieldEditable("organizerType")}
                icon={Briefcase}
              />
              <Select
                        label="Loại hình tổ chức"
                        id="organizationType"
                        value={profile.organizationType || ""}
                        options={dictionaries.organizationType}
                        onChange={(v) => handleChange("organizationType", v)}
                        isEditable={isFieldEditable("organizationType")}
                        icon={Building2}
              />
              <Select
                label="Tần suất tổ chức sự kiện"
                id="eventFrequency"
                        value={profile.eventFrequency || ""}
                options={dictionaries.eventFrequency}
                onChange={(v) => handleChange("eventFrequency", v)}
                isEditable={isFieldEditable("eventFrequency")}
                icon={Calendar}
              />
              <Select
                label="Quy mô sự kiện"
                id="eventSize"
                        value={profile.eventSize || ""}
                options={dictionaries.eventSize}
                onChange={(v) => handleChange("eventSize", v)}
                isEditable={isFieldEditable("eventSize")}
                icon={Users}
              />
                      <Select
                        label="Kinh nghiệm tổ chức"
                        id="eventExperienceLevel"
                        value={profile.eventExperienceLevel || ""}
                        options={dictionaries.eventExperienceLevel}
                        onChange={(v) => handleChange("eventExperienceLevel", v)}
                        isEditable={isFieldEditable("eventExperienceLevel")}
                        icon={Award}
              />
            </div>
        </div>
                </Card>
              </>
      )}

            {/* TAB: MẠNG XÃ HỘI */}
            {activeTab === "social" && (
              <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Mạng xã hội & liên kết
                  </h2>
                </div>
                <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                      label="Facebook"
                      id="urlFacebook"
                      value={profile.urlFacebook || ""}
                      onChange={(v) => handleChange("urlFacebook", v)}
                      isEditable={isFieldEditable("urlFacebook")}
                      icon={Facebook}
              />
              <Input
                      label="Instagram"
                      id="urlInstagram"
                      value={profile.urlInstagram || ""}
                      onChange={(v) => handleChange("urlInstagram", v)}
                      isEditable={isFieldEditable("urlInstagram")}
                      icon={Instagram}
            />
            <Input
                      label="LinkedIn"
                      id="urlLinkedIn"
                      value={profile.urlLinkedIn || ""}
                      onChange={(v) => handleChange("urlLinkedIn", v)}
                      isEditable={isFieldEditable("urlLinkedIn")}
                      icon={Linkedin}
            />
                  </div>
                </div>
              </Card>
            )}

            {/* TAB: GIẤY TỜ XÁC MINH */}
            {activeTab === "documents" && (
              <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Giấy tờ xác minh
                  </h2>
                </div>
                <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                ["imgFrontIdentity", "Ảnh mặt trước CCCD"],
                ["imgBackIdentity", "Ảnh mặt sau CCCD"],
                ["imgBusinessLicense", "Giấy phép kinh doanh"],
              ].map(([key, label]) => (
                <div key={key} className="text-center">
                        <p className="text-sm mb-2 font-medium text-gray-700">{label}</p>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                    <img
                            src={profile[`preview_${key}`] || profile[key] || "/placeholder.svg"}
                      alt={label}
                      className="object-cover w-full h-full"
                    />
                          {editMode && isFieldEditable(key) && (
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-all">
                              <Camera size={24} className="text-white" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleFileChange(key, e.target.files?.[0])
                                }
                              />
                            </label>
                          )}
                  </div>
                </div>
              ))}
            </div>
        </div>
              </Card>
      )}
          </div>

          {/* Right Column - Profile Card (1/3 width) */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg rounded-lg overflow-visible">
              {/* Profile Picture - Overlapping the header background */}
              <div className="relative -mt-20 mb-6 flex justify-center z-50">
                <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-xl">
                  <img
                    src={
                      profile.preview_imgCompany ||
                      profile.imgCompany ||
                      "/placeholder.svg"
                    }
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                  {editMode && isFieldEditable("imgCompany") && (
                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-all">
                      <Camera size={24} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange("imgCompany", e.target.files?.[0])
                        }
                      />
                    </label>
                  )}
            </div>
              </div>

              {/* Statistics */}
              <div className="px-6 pb-6 border-b border-gray-200">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats.totalEvents}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Sự kiện</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats.totalAttendees}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Người tham gia</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats.averageRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Đánh giá</div>
                  </div>
                </div>
              </div>

              {/* Name and Location */}
              <div className="px-6 py-6">
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                  {profile.companyName || profile.contactName || "Tên tổ chức"}
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <MapPin size={16} />
                  <span className="text-xs">
                    {profile.address || "Chưa có địa chỉ"}
                  </span>
                </div>

                {/* Professional Details */}
                <div className="space-y-3 mb-4">
                  {profile.organizerType && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase size={16} />
                      <span>
                        {dictionaries.organizerType[profile.organizerType] || profile.organizerType}
                      </span>
        </div>
      )}
                  {profile.organizationType && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 size={16} />
                      <span>
                        {dictionaries.organizationType[profile.organizationType] || profile.organizationType}
                      </span>
                    </div>
                  )}
                  {profile.eventExperienceLevel && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award size={16} />
                      <span>
                        {dictionaries.eventExperienceLevel[profile.eventExperienceLevel] || profile.eventExperienceLevel}
                      </span>
                    </div>
                  )}
                  {profile.eventFrequency && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>
                        {dictionaries.eventFrequency[profile.eventFrequency] || profile.eventFrequency}
                      </span>
                    </div>
                  )}
                  {profile.eventSize && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>
                        Quy mô: {dictionaries.eventSize[profile.eventSize] || profile.eventSize}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {(profile.contactEmail || profile.contactPhone || profile.website) && (
                  <div className="pt-4 border-t border-gray-200 space-y-2 mb-4">
                    {profile.contactEmail && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Email: </span>
                        <span>{profile.contactEmail}</span>
                      </div>
                    )}
                    {profile.contactPhone && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Điện thoại: </span>
                        <span>{profile.contactPhone}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Website: </span>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* About Section */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {profile.experienceDescription || 
                     profile.companyDescription || 
                     "Một tổ chức chuyên nghiệp trong việc tổ chức các sự kiện đa dạng. Chúng tôi cam kết mang đến những trải nghiệm tuyệt vời cho người tham gia."}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.organizerType && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {dictionaries.organizerType[profile.organizerType]}
                    </Badge>
                  )}
                  {profile.organizationType && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {dictionaries.organizationType[profile.organizationType]}
                    </Badge>
                  )}
                  {profile.eventExperienceLevel && (
                    <Badge className="bg-green-100 text-green-800">
                      {dictionaries.eventExperienceLevel[profile.eventExperienceLevel]}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
