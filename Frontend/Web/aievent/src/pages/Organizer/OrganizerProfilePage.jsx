import { useEffect, useRef, useState, useCallback } from "react";
import useOrganizers from "../../hooks/useOrganizers";
import WalletDashboard from "./WalletDashboard";
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

  const [activeTab, setActiveTab] = useState("profile");
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      for (const key in profile) {
        const val = profile[key];
        if (val === undefined || val === null) continue;
        if (val instanceof File) formData.append(key, val);
        else formData.append(key, String(val));
      }
      await updateOrganizer(formData);
      setOriginalProfile(JSON.parse(JSON.stringify(profile)));
      setEditMode(false);
    } catch (err) {
      console.error(err);
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
  const Input = ({ label, id, value, onChange, type = "text" }) => {
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
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          id={id}
          name={id}
          type={type}
          value={value ?? ""}
          disabled={!editMode}
          onChange={handleLocalChange}
          onFocus={handleFocus}
          onSelect={handleSelect}
          className={`block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            editMode
              ? "border border-gray-300 bg-white"
              : "border border-transparent bg-gray-50"
          }`}
        />
      </div>
    );
  };

  /**
   * Textarea with caret preservation.
   */
  const Textarea = ({ label, id, value, onChange }) => {
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
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <textarea
          id={id}
          name={id}
          rows={3}
          value={value ?? ""}
          disabled={!editMode}
          onChange={handleLocalChange}
          onFocus={handleFocus}
          className={`block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            editMode
              ? "border border-gray-300 bg-white"
              : "border border-transparent bg-gray-50"
          }`}
        />
      </div>
    );
  };

  /**
   * Select that preserves focus after change.
   */
  const Select = ({ label, id, options, value, onChange }) => {
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
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          id={id}
          name={id}
          value={value ?? ""}
          disabled={!editMode}
          onChange={handleLocalChange}
          onFocus={handleFocus}
          className={`block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            editMode
              ? "border border-gray-300 bg-white"
              : "border border-transparent bg-gray-50"
          }`}
        >
          <option value="">-- Chọn --</option>
          {Object.entries(options).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const Section = ({ title, icon, children }) => (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );

  const dictionaries = DICTIONARIES; // local alias for readability

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="text-gray-600" size={24} />
          <h1 className="text-3xl font-bold">Hồ sơ tổ chức sự kiện</h1>
        </div>

        <div className="flex gap-3">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Edit3 size={18} /> Chỉnh sửa hồ sơ
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                <Save size={18} /> {saving ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <X size={18} /> Hủy
              </button>
            </>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 shadow-sm">
          <img
            src={
              profile.preview_imgCompany ||
              profile.imgCompany ||
              "/placeholder.svg"
            }
            alt="Company Logo"
            className="object-cover w-full h-full"
          />
          {editMode && (
            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700">
              <Camera size={16} className="text-white" />
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
        <div>
          <h2 className="text-2xl font-bold">
            {profile.companyName || "Chưa có tên công ty"}
          </h2>
          <p className="text-gray-500">{profile.companyDescription}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            ["profile", "Hồ sơ"],
            ["business", "Doanh nghiệp"],
            ["social", "Mạng xã hội"],
            ["wallet", "Ví & Thanh toán"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <Section title="Thông tin cá nhân" icon={<User size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên người liên hệ"
                id="contactName"
                value={profile.contactName}
                onChange={(v) => handleChange("contactName", v)}
              />
              <Input
                label="Email"
                id="contactEmail"
                type="email"
                value={profile.contactEmail}
                onChange={(v) => handleChange("contactEmail", v)}
              />
              <Input
                label="Số điện thoại"
                id="contactPhone"
                value={profile.contactPhone}
                onChange={(v) => handleChange("contactPhone", v)}
              />
              <Input
                label="Địa chỉ"
                id="address"
                value={profile.address}
                onChange={(v) => handleChange("address", v)}
              />
            </div>
            <Textarea
              label="Kinh nghiệm & mô tả"
              id="experienceDescription"
              value={profile.experienceDescription}
              onChange={(v) => handleChange("experienceDescription", v)}
            />
          </Section>

          <Section
            title="Loại hình tổ chức & quy mô"
            icon={<ListChecks size={18} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Loại hình tổ chức"
                id="organizationType"
                value={profile.organizationType}
                options={dictionaries.organizationType}
                onChange={(v) => handleChange("organizationType", v)}
              />
              <Select
                label="Loại Organizer"
                id="organizerType"
                value={profile.organizerType}
                options={dictionaries.organizerType}
                onChange={(v) => handleChange("organizerType", v)}
              />
              <Select
                label="Kinh nghiệm tổ chức"
                id="eventExperienceLevel"
                value={profile.eventExperienceLevel}
                options={dictionaries.eventExperienceLevel}
                onChange={(v) => handleChange("eventExperienceLevel", v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tần suất tổ chức sự kiện"
                id="eventFrequency"
                value={profile.eventFrequency}
                options={dictionaries.eventFrequency}
                onChange={(v) => handleChange("eventFrequency", v)}
              />
              <Select
                label="Quy mô sự kiện"
                id="eventSize"
                value={profile.eventSize}
                options={dictionaries.eventSize}
                onChange={(v) => handleChange("eventSize", v)}
              />
            </div>
          </Section>
        </div>
      )}

      {/* BUSINESS TAB */}
      {activeTab === "business" && (
        <div className="space-y-6">
          <Section
            title="Thông tin doanh nghiệp"
            icon={<Building2 size={18} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên công ty"
                id="companyName"
                value={profile.companyName}
                onChange={(v) => handleChange("companyName", v)}
              />
              <Input
                label="Mã số thuế"
                id="taxCode"
                value={profile.taxCode}
                onChange={(v) => handleChange("taxCode", v)}
              />
            </div>
            <Textarea
              label="Giới thiệu công ty"
              id="companyDescription"
              value={profile.companyDescription}
              onChange={(v) => handleChange("companyDescription", v)}
            />
            <Input
              label="Website"
              id="website"
              value={profile.website}
              onChange={(v) => handleChange("website", v)}
            />
          </Section>

          <Section title="Giấy tờ xác minh" icon={<FileBadge size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                ["imgFrontIdentity", "Ảnh mặt trước CCCD"],
                ["imgBackIdentity", "Ảnh mặt sau CCCD"],
                ["imgBusinessLicense", "Giấy phép kinh doanh"],
              ].map(([key, label]) => (
                <div key={key} className="text-center">
                  <p className="text-sm mb-2 font-medium">{label}</p>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                    <img
                      src={profile[key] || "/placeholder.svg"}
                      alt={label}
                      className="object-cover w-full h-full"
                    />
                    {/*  Không cho phép upload trong editMode */}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* SOCIAL TAB */}
      {activeTab === "social" && (
        <div className="space-y-6">
          <Section title="Mạng xã hội & liên kết" icon={<Globe size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Facebook"
                id="urlFacebook"
                value={profile.urlFacebook}
                onChange={(v) => handleChange("urlFacebook", v)}
              />
              <Input
                label="Instagram"
                id="urlInstagram"
                value={profile.urlInstagram}
                onChange={(v) => handleChange("urlInstagram", v)}
              />
              <Input
                label="LinkedIn"
                id="urlLinkedIn"
                value={profile.urlLinkedIn}
                onChange={(v) => handleChange("urlLinkedIn", v)}
              />
            </div>
          </Section>
        </div>
      )}

      {/* WALLET TAB */}
      {activeTab === "wallet" && <WalletDashboard />}
    </div>
  );
}
