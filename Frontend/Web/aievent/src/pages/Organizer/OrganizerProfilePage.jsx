import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import useOrganizers from "../../hooks/useOrganizers";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { dashboardAPI } from "../../api/dashboardAPI";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
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
  Wallet,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { walletAPI } from "../../api/walletAPI";

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

  // Payment information states
  const [paymentInformations, setPaymentInformations] = useState([]);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [paymentInfoError, setPaymentInfoError] = useState(null);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(null);
  const [paymentPagination, setPaymentPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasFetchedPaymentInfo = useRef(false);

  const [quickStats, setQuickStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    mostPopularCategory: null,
    loading: true
  });

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

  // Fetch quick stats (chỉ cần chạy 1 lần)
  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const [eventStats, buyerStats] = await Promise.all([
          dashboardAPI.getEventStatistics({}),
          dashboardAPI.getBuyerStatistics({})
        ]);

        // Tính danh mục có nhiều sự kiện nhất
        let mostFrequent = { name: "Chưa có", count: 0 };
        if (eventStats?.eventsByCategory && eventStats.eventsByCategory.length > 0) {
          const sorted = [...eventStats.eventsByCategory].sort((a, b) => (b.count || 0) - (a.count || 0));
          mostFrequent = {
            name: sorted[0].categoryName || "Không xác định",
            count: sorted[0].count || 0
          };
        }

        setQuickStats({
          totalEvents: eventStats?.totalEvents || 0,
          totalAttendees: buyerStats?.totalBuyers || 0,
          mostFrequentCategory: mostFrequent,
          loading: false
        });
      } catch (err) {
        console.error("Lỗi tải thống kê nhanh:", err);
        setQuickStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchQuickStats();
  }, []);

  // Fetch payment information
  const fetchPaymentInformations = useCallback(async (pageNumber = 1) => {
    setIsLoadingPaymentInfo(true);
    setPaymentInfoError(null);

    try {
      const response = await walletAPI.getPaymentInformations({ pageNumber, pageSize: 10 });
      if (response.data) {
        setPaymentInformations(response.data.items || []);
        setPaymentPagination({
          currentPage: response.data.currentPage || pageNumber,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0,
          pageSize: response.data.pageSize || 10
        });
      }
    } catch (error) {
      console.error('Error fetching payment informations:', error);
      setPaymentInfoError(error.message || 'Không thể tải thông tin thẻ');
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedPaymentInfo.current) {
      hasFetchedPaymentInfo.current = true;
      fetchPaymentInformations(1);
    }
  }, [fetchPaymentInformations]);

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

  // Payment information handlers
  const handleCopyToClipboard = async (text, accountNumber) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccountNumber(accountNumber);
      setTimeout(() => {
        setCopiedAccountNumber(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeletePaymentInfo = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông tin thẻ này?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await walletAPI.deletePaymentInformation(id);
      toast.success('Xóa thông tin thẻ thành công');
      await fetchPaymentInformations(paymentPagination.currentPage);
    } catch (error) {
      console.error('Error deleting payment information:', error);
      toast.error('Không thể xóa thông tin thẻ: ' + (error.message || 'Có lỗi xảy ra'));
    } finally {
      setIsDeleting(false);
    }
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
            className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${editMode && isEditable
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
            className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y ${editMode && isEditable
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
            className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-10 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${editMode && isEditable
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

  const UrlInput = ({ label, id, value, onChange, isEditable = true, icon: Icon }) => {
    const handleLocalChange = (e) => {
      const v = e.target.value;
      lastFocusRef.current = { id, start: e.target.selectionStart, end: e.target.selectionEnd };
      onChange(v);
      restoreFocusForId(id);
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(value || "");
      setCopiedAccountNumber(id); // tái sử dụng state copiedAccountNumber đã có sẵn
      setTimeout(() => setCopiedAccountNumber(null), 2000);
    };

    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700">{label}</label>
        <div className="relative group">
          {/* Icon bên trái */}
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Icon size={18} />
            </div>
          )}

          {/* Input thật – chỉ hiển thị khi đang edit */}
          <input
            id={id}
            type="url"
            value={value ?? ""}
            disabled={!editMode || !isEditable}
            onChange={handleLocalChange}
            placeholder="https://example.com"
            className={`block w-full ${Icon ? "pl-10" : "pl-3"} pr-12 py-2.5 rounded-lg border 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
            ${editMode && isEditable
                ? "border-gray-300 bg-white text-gray-900"
                : "border-transparent bg-transparent text-gray-500 cursor-default"
              }`}
          />

          {/* Overlay hiển thị link đẹp khi KHÔNG edit */}
          {!editMode && value && (
            <>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className={`absolute inset-0 ${Icon ? "pl-10" : "pl-3"} pr-12 py-2.5 
                flex items-center text-blue-600 hover:underline text-sm truncate pointer-events-auto`}
              >
                {value.replace(/^https?:\/\//, "").replace(/^www\./, "")}
              </a>

              {/* Nút copy */}
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-100 transition"
                title="Sao chép liên kết"
              >
                {copiedAccountNumber === id ? (
                  <CheckCircle2 size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} className="text-gray-500" />
                )}
              </button>
            </>
          )}

          {/* Khi không có dữ liệu và không edit → hiển thị placeholder xám */}
          {!editMode && !value && (
            <div className={`absolute inset-0 ${Icon ? "pl-10" : "pl-3"} flex items-center text-gray-400 text-sm`}>
              Chưa có
            </div>
          )}
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === tab
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

                {/* Thông tin thẻ */}
                <Card className="bg-white shadow-md rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-gray-700 flex items-center">
                          <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                          Thông tin thẻ
                        </h2>
                        <p className="text-xs text-gray-600 mt-1">Quản lý và xem thông tin tài khoản ngân hàng của bạn</p>
                      </div>
                      <Button
                        onClick={() => setIsAddPaymentModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm thẻ
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    {isLoadingPaymentInfo ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-2 text-sm">Đang tải thông tin thẻ...</p>
                      </div>
                    ) : paymentInfoError ? (
                      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-red-700 text-sm font-medium">{paymentInfoError}</p>
                          </div>
                        </div>
                      </div>
                    ) : paymentInformations.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-base font-medium">Chưa có thông tin thẻ nào được lưu</p>
                        <p className="text-gray-500 text-sm mt-1">Thêm thẻ để thanh toán nhanh chóng</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4">
                          {paymentInformations.map((paymentInfo) => (
                            <div
                              key={paymentInfo.paymentInformationId}
                              className="group relative overflow-hidden bg-gradient-to-br from-[#F8F8F8] to-[#E8E8E8] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#D1D5DB]"
                            >
                              {/* Decorative Pattern */}
                              <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gray-300 rounded-full -mr-24 -mt-24"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gray-300 rounded-full -ml-16 -mb-16"></div>
                              </div>

                              {/* Card Content */}
                              <div className="relative p-5">
                                {/* Top Section */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    {paymentInfo.bankLogo ? (
                                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                        <img
                                          src={paymentInfo.bankLogo}
                                          alt={paymentInfo.bankName}
                                          className="w-20 h-20 object-contain"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                        <Building2 className="w-20 h-20 text-gray-700" />
                                      </div>
                                    )}
                                    <div>
                                      <Badge className="bg-gray-300/40 text-gray-800 border border-gray-300/50 text-xs px-3 py-1 shadow-sm">
                                        {paymentInfo.bankShortName || paymentInfo.bankName}
                                      </Badge>
                                      {paymentInfo.branchName && (
                                        <p className="text-gray-600 text-xs mt-1">{paymentInfo.branchName}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                                      <CreditCard className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <button
                                      onClick={() => handleDeletePaymentInfo(paymentInfo.paymentInformationId)}
                                      disabled={isDeleting}
                                      className="w-8 h-8 bg-white hover:bg-red-50 rounded-lg flex items-center justify-center border border-gray-200 hover:border-red-300 shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                      title="Xóa thông tin thẻ"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                  </div>
                                </div>

                                {/* Account Number Section */}
                                <div className="mb-3">
                                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Số tài khoản</p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xl font-bold text-gray-900 tracking-wider">
                                      {paymentInfo.accountNumber}
                                    </p>
                                    <button
                                      onClick={() => handleCopyToClipboard(paymentInfo.accountNumber, paymentInfo.accountNumber)}
                                      className="ml-3 p-2 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:scale-105 shadow-sm"
                                      title="Sao chép số tài khoản"
                                    >
                                      {copiedAccountNumber === paymentInfo.accountNumber ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4 text-gray-700" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Account Holder Section */}
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Chủ tài khoản</p>
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 border border-gray-200 shadow-sm">
                                      <User className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <p className="text-base font-semibold text-gray-900">
                                      {paymentInfo.accountHolderName}
                                    </p>
                                  </div>
                                </div>

                                {/* Bottom Decoration */}
                                <div className="absolute bottom-3 right-3 opacity-10">
                                  <div className="grid grid-cols-4 gap-1">
                                    {[...Array(16)].map((_, i) => (
                                      <div key={i} className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {paymentPagination.totalPages > 1 && (
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              Hiển thị {(paymentPagination.currentPage - 1) * paymentPagination.pageSize + 1} - {Math.min(paymentPagination.currentPage * paymentPagination.pageSize, paymentPagination.totalItems)} trong số {paymentPagination.totalItems} thẻ
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => fetchPaymentInformations(paymentPagination.currentPage - 1)}
                                disabled={paymentPagination.currentPage === 1 || isLoadingPaymentInfo}
                                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <div className="flex items-center space-x-1">
                                {[...Array(paymentPagination.totalPages)].map((_, i) => {
                                  const page = i + 1;
                                  if (
                                    page === 1 ||
                                    page === paymentPagination.totalPages ||
                                    (page >= paymentPagination.currentPage - 1 && page <= paymentPagination.currentPage + 1)
                                  ) {
                                    return (
                                      <button
                                        key={page}
                                        onClick={() => fetchPaymentInformations(page)}
                                        disabled={isLoadingPaymentInfo}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${paymentPagination.currentPage === page
                                          ? 'bg-blue-600 text-white'
                                          : 'border border-gray-300 hover:bg-gray-50'
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                      >
                                        {page}
                                      </button>
                                    );
                                  } else if (
                                    page === paymentPagination.currentPage - 2 ||
                                    page === paymentPagination.currentPage + 2
                                  ) {
                                    return <span key={page} className="px-2">...</span>;
                                  }
                                  return null;
                                })}
                              </div>
                              <button
                                onClick={() => fetchPaymentInformations(paymentPagination.currentPage + 1)}
                                disabled={paymentPagination.currentPage === paymentPagination.totalPages || isLoadingPaymentInfo}
                                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
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
                    {/* Website – trong tab "business" */}
                    <UrlInput
                      label="Website"
                      id="website"
                      value={profile.website || ""}
                      onChange={(v) => handleChange("website", v)}
                      isEditable={isFieldEditable("website")}
                      icon={Globe}
                    />

                    {/* Facebook – trong tab "social" */}
                    <UrlInput
                      label="Facebook"
                      id="urlFacebook"
                      value={profile.urlFacebook || ""}
                      onChange={(v) => handleChange("urlFacebook", v)}
                      isEditable={isFieldEditable("urlFacebook")}
                      icon={Facebook}
                    />

                    {/* Instagram – trong tab "social" */}
                    <UrlInput
                      label="Instagram"
                      id="urlInstagram"
                      value={profile.urlInstagram || ""}
                      onChange={(v) => handleChange("urlInstagram", v)}
                      isEditable={isFieldEditable("urlInstagram")}
                      icon={Instagram}
                    />

                    {/* LinkedIn – trong tab "social" */}
                    <UrlInput
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
                {quickStats.loading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {/* Tổng sự kiện */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {quickStats.totalEvents}
                      </div>
                      <div className="text-xs text-gray-500">Sự kiện</div>
                    </div>

                    {/* Tổng người tham gia */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {quickStats.totalAttendees.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Người tham gia</div>
                    </div>

                    {/* Danh mục phổ biến nhất */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                        <Star className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="text-lg font-bold text-gray-800 max-w-[100px] truncate" title={quickStats.mostFrequentCategory?.name}>
                        {quickStats.mostFrequentCategory?.name || "Chưa có"}
                      </div>
                      <div className="text-xs text-gray-500">Danh mục phổ biến nhất</div>
                    </div>
                  </div>
                )}
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
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium whitespace-nowrap">Website:</span>
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate flex-1 min-w-0"
                          title={profile.website}
                        >
                          {profile.website.replace(/^https?:\/\//, "").replace(/^www\./, "")}
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

      {/* Add Payment Information Modal */}
      <Dialog open={isAddPaymentModalOpen} onOpenChange={setIsAddPaymentModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            <AddPaymentModal
              onClose={() => setIsAddPaymentModalOpen(false)}
              onSuccess={() => {
                setIsAddPaymentModalOpen(false);
                fetchPaymentInformations(paymentPagination.currentPage);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Payment Information Modal Component
const AddPaymentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    bankBin: '',
    bankShortName: '',
    bankLogo: ''
  });
  const [banks, setBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const response = await walletAPI.getBanksFromVietnamQR();
        if (response.data) {
          setBanks(response.data);
        }
      } catch (error) {
        console.error('Error loading banks:', error);
        setError('Không thể tải danh sách ngân hàng');
      } finally {
        setIsLoadingBanks(false);
      }
    };
    loadBanks();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankSelect = (bank) => {
    setFormData(prev => ({
      ...prev,
      bankName: bank.name,
      bankBin: bank.bin,
      bankShortName: bank.shortName,
      bankLogo: bank.logo
    }));
    setSearchTerm('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.accountHolderName.trim()) {
      setError('Vui lòng nhập tên chủ tài khoản');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('Vui lòng nhập số tài khoản');
      return;
    }
    if (formData.accountNumber.trim().length < 6) {
      setError('Số tài khoản phải có ít nhất 6 ký tự');
      return;
    }
    if (!formData.bankName) {
      setError('Vui lòng chọn ngân hàng');
      return;
    }
    if (!formData.branchName.trim()) {
      setError('Vui lòng nhập tên chi nhánh');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await walletAPI.createPaymentInformation(formData);
      toast.success('Thêm thông tin thẻ thành công');
      onSuccess();
    } catch (error) {
      console.error('Error creating payment information:', error);

      let errorMessage = 'Không thể thêm thông tin thanh toán';

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.errors && typeof errorData.errors === 'object') {
          const firstError = Object.values(errorData.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            const serverMessage = firstError[0];
            if (serverMessage.includes('AccountNumber') || serverMessage.includes('account number')) {
              if (serverMessage.includes('minimum') || serverMessage.includes('least')) {
                errorMessage = 'Số tài khoản phải có ít nhất 6 ký tự';
              } else if (serverMessage.includes('required')) {
                errorMessage = 'Vui lòng nhập số tài khoản';
              } else {
                errorMessage = 'Số tài khoản không hợp lệ';
              }
            } else if (serverMessage.includes('AccountHolderName') || serverMessage.includes('account holder')) {
              errorMessage = 'Tên chủ tài khoản không hợp lệ';
            } else if (serverMessage.includes('Bank') || serverMessage.includes('bank')) {
              errorMessage = 'Thông tin ngân hàng không hợp lệ';
            } else if (serverMessage.includes('Branch') || serverMessage.includes('branch')) {
              errorMessage = 'Thông tin chi nhánh không hợp lệ';
            } else if (serverMessage.includes('duplicate') || serverMessage.includes('already exists')) {
              errorMessage = 'Thông tin thanh toán này đã tồn tại';
            } else {
              errorMessage = serverMessage;
            }
          }
        } else if (errorData.message) {
          const serverMessage = errorData.message.toLowerCase();
          if (serverMessage.includes('accountnumber') || serverMessage.includes('account number')) {
            if (serverMessage.includes('minimum') || serverMessage.includes('least') || serverMessage.includes('6')) {
              errorMessage = 'Số tài khoản phải có ít nhất 6 ký tự';
            } else if (serverMessage.includes('required')) {
              errorMessage = 'Vui lòng nhập số tài khoản';
            } else {
              errorMessage = 'Số tài khoản không hợp lệ';
            }
          } else if (serverMessage.includes('duplicate') || serverMessage.includes('already exists')) {
            errorMessage = 'Thông tin thanh toán này đã tồn tại';
          } else if (serverMessage.includes('invalid')) {
            errorMessage = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại';
          } else {
            errorMessage = errorData.message;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'Hết thời gian chờ. Vui lòng thử lại';
        } else if (errorMsg.includes('500')) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
        } else if (errorMsg.includes('400')) {
          errorMessage = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại';
        } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
        }
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 flex items-center">
          <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
          Thêm thẻ ngân hàng mới
        </DialogTitle>
        <p className="text-gray-600 text-sm">Thêm thông tin tài khoản ngân hàng của bạn để sử dụng</p>
      </DialogHeader>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-full lg:w-[28rem] xl:w-[30rem] flex-shrink-0 space-y-6 pr-1 lg:pr-3 pb-6 lg:pb-0 lg:max-h-[70vh] lg:overflow-y-auto">
          {/* Bank Selection */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-blue-600" />
              Chọn ngân hàng <span className="text-red-500">*</span>
            </Label>
            {isLoadingBanks ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 text-sm mt-3 font-medium">Đang tải danh sách ngân hàng...</p>
              </div>
            ) : (
              <div className="relative">
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm ngân hàng..."
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                  />
                </div>

                {/* Selected Bank Display */}
                {formData.bankName && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {formData.bankLogo && (
                          <img
                            src={formData.bankLogo}
                            alt={formData.bankName}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {!formData.bankLogo && (
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{formData.bankShortName}</p>
                          <p className="text-xs text-gray-600">{formData.bankName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          bankName: '',
                          bankBin: '',
                          bankShortName: '',
                          bankLogo: ''
                        }))}
                        className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors border border-red-200"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bank List */}
                {!formData.bankName && (
                  <div className="border-2 border-gray-200 rounded-xl max-h-60 sm:max-h-64 lg:max-h-72 overflow-y-auto shadow-inner bg-gray-50">
                    {filteredBanks.length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm font-medium">Không tìm thấy ngân hàng</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 divide-y divide-gray-200">
                        {filteredBanks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => handleBankSelect(bank)}
                            className="p-4 hover:bg-blue-50 transition-colors flex items-center space-x-3 text-left w-full group"
                          >
                            {bank.logo ? (
                              <div className="w-12 h-12 bg-white rounded-lg p-2 border border-gray-200 group-hover:border-blue-300 shadow-sm">
                                <img
                                  src={bank.logo}
                                  alt={bank.shortName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{bank.shortName}</p>
                              <p className="text-xs text-gray-600 truncate">{bank.name}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Holder Name */}
          <div>
            <Label htmlFor="accountHolderName" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              Tên chủ tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountHolderName"
              value={formData.accountHolderName}
              onChange={(e) => handleInputChange('accountHolderName', e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 uppercase font-semibold tracking-wide"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập tên in hoa giống trên thẻ ngân hàng</p>
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
              Số tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                handleInputChange('accountNumber', value);
                if (error && error.includes('số tài khoản')) {
                  setError(null);
                }
              }}
              placeholder="0337252208"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 font-mono text-lg tracking-widest"
              type="text"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">Số tài khoản không có dấu cách hoặc ký tự đặc biệt</p>
          </div>

          {/* Branch Name */}
          <div>
            <Label htmlFor="branchName" className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="branchName"
              value={formData.branchName}
              onChange={(e) => handleInputChange('branchName', e.target.value)}
              placeholder="Ví dụ: Hồ Chí Minh, Hà Nội..."
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập tên chi nhánh hoặc thành phố</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Card Preview */}
        <div className="flex-1 min-w-0 w-full">
          <div className="lg:sticky lg:top-0">
            {formData.bankName ? (
              <div className="group relative overflow-hidden bg-gradient-to-br from-[#F8F8F8] to-[#E8E8E8] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-[#D1D5DB]">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gray-300 rounded-full -mr-24 -mt-24"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gray-300 rounded-full -ml-16 -mb-16"></div>
                </div>

                {/* Card Content */}
                <div className="relative p-5">
                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {formData.bankLogo ? (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <img
                            src={formData.bankLogo}
                            alt={formData.bankName}
                            className="w-20 h-20 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <Building2 className="w-20 h-20 text-gray-700" />
                        </div>
                      )}
                      <div>
                        <Badge className="bg-gray-300/40 text-gray-800 border border-gray-300/50 text-xs px-3 py-1 shadow-sm">
                          {formData.bankShortName || formData.bankName}
                        </Badge>
                        <p className="text-gray-600 text-xs mt-1">
                          {formData.branchName || 'Chưa nhập'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                        <CreditCard className="w-4 h-4 text-gray-700" />
                      </div>
                    </div>
                  </div>

                  {/* Account Number Section */}
                  <div className="mb-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Số tài khoản</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-gray-900 tracking-wider">
                        {formData.accountNumber || 'Chưa nhập'}
                      </p>
                    </div>
                  </div>

                  {/* Account Holder Section */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Chủ tài khoản</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 border border-gray-200 shadow-sm">
                        <User className="w-4 h-4 text-gray-700" />
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {formData.accountHolderName || 'Chưa nhập'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Decoration */}
                  <div className="absolute bottom-3 right-3 opacity-10">
                    <div className="grid grid-cols-4 gap-1">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-2xl p-10 sm:p-12 text-center min-h-[320px] sm:min-h-[400px] flex flex-col justify-center">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-blue-100 transform hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-16 h-16 text-blue-600" />
                </div>
                <h3 className="font-bold text-2xl text-gray-900 mb-3">Xem trước thẻ ngân hàng</h3>
                <p className="text-base text-gray-600 mb-6">Nhập thông tin bên trái để xem thẻ ngân hàng của bạn</p>
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <MapPin className="w-5 h-5" />
                  <p className="text-sm font-medium">Hãy bắt đầu bằng việc chọn ngân hàng</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:space-x-3 gap-3 sm:gap-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-300 hover:border-gray-400 px-6 w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 px-8 w-full sm:w-auto"
          >
            {isSubmitting ? 'Đang thêm...' : 'Thêm thẻ'}
          </Button>
        </div>
      </div>
    </div>
  );
};
