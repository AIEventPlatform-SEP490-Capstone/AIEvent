import { useState } from "react";
import WalletDashboard from "./WalletDashboard";

export default function OrganizerProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({
    name: "Vietnam Tech Community",
    email: "contact@vtechcommunity.com",
    phone: "0123456789",
    bio: "Cộng đồng công nghệ hàng đầu Việt Nam, tổ chức các sự kiện chất lượng cao về AI, Blockchain và Startup",
    location: "Hà Nội",
    website: "https://vtechcommunity.com",
    avatar: "/tech-community-logo.png",
    companyName: "Vietnam Tech Community",
    taxCode: "0123456789",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    bankAccount: "1234567890",
    bankName: "Vietcombank",
  });

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailPayments: true,
    emailRefunds: true,
    pushBookings: true,
    pushPayments: false,
    smsImportant: true,
  });

  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showEvents: true,
    showStats: false,
    allowMessages: true,
  });

  const organizerStats = {
    totalEvents: 24,
    totalAttendees: 15420,
    totalRevenue: 2450000000,
    avgRating: 4.7,
    totalReviews: 1250,
    successRate: 98.5,
    repeatCustomers: 65,
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const SwitchComponent = ({ checked, onChange, id, label, description }) => (
    <div className="flex items-center justify-between mb-4">
      <div>
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
      />
    </div>
  );

  const SelectComponent = ({ value, onChange, children, label, id }) => (
    <div className="space-y-2 mb-4">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {children}
      </select>
    </div>
  );

  const AvatarComponent = ({ src, fallback, className }) => (
    <div
      className={`relative inline-flex items-center justify-center w-24 h-24 overflow-hidden bg-gray-100 rounded-full ${className}`}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
      {!src && <span className="text-gray-500 font-medium">{fallback}</span>}
    </div>
  );

  const BadgeComponent = ({ children, className }) => (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );

  const Card = ({ children, className }) => (
    <div className={`border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children }) => (
    <div className="px-6 py-4 border-b border-gray-200">{children}</div>
  );

  const CardTitle = ({ children, className }) => (
    <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
  );

  const CardContent = ({ children, className }) => (
    <div className={`p-6 ${className}`}>{children}</div>
  );

  const Button = ({
    children,
    variant = "default",
    size = "default",
    onClick,
    className,
    type = "button",
  }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
      default:
        "px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      outline:
        "px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    };
    const sizes = {
      default: "text-sm",
      sm: "text-xs px-3 py-1.5",
    };
    return (
      <button
        type={type}
        onClick={onClick}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  const Input = ({ id, type = "text", value, onChange, className }) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    />
  );

  const Label = ({ htmlFor, children, className }) => (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 ${className}`}
    >
      {children}
    </label>
  );

  const Textarea = ({ id, value, onChange, rows = 3, className }) => (
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={onChange}
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    />
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <span className="h-6 w-6 text-gray-500">👤</span>
        <h1 className="text-3xl font-bold">Hồ sơ Organizer</h1>
      </div>

      <div className="space-y-6">
        {/* Tabs List */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {["profile", "business", "wallet", "notifications", "privacy"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "profile" && "Hồ sơ"}
                  {tab === "business" && "Doanh nghiệp"}
                  {tab === "wallet" && "Ví & Thanh toán"}
                  {tab === "notifications" && "Thông báo"}
                  {tab === "privacy" && "Quyền riêng tư"}
                </button>
              )
            )}
          </nav>
        </div>

        {/* Tab Contents */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-5 w-5 text-gray-500">👤</span>
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <AvatarComponent
                    src={profile.avatar || "/placeholder.svg"}
                    fallback={profile.name.charAt(0)}
                    className="h-24 w-24"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{profile.name}</h2>
                      <BadgeComponent className="bg-blue-100 text-blue-800">
                        ✅ Đã xác minh
                      </BadgeComponent>
                      <BadgeComponent className="bg-green-100 text-green-800">
                        🏆 Organizer Pro
                      </BadgeComponent>
                    </div>
                    <p className="text-gray-500 mb-4">{profile.bio}</p>
                    <Button variant="outline">Thay đổi ảnh đại diện</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên tổ chức</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Giới thiệu tổ chức</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={4}
                  />
                </div>

                <SelectComponent
                  value={profile.location}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, location: value }))
                  }
                  label="Địa điểm hoạt động"
                  id="location"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Toàn quốc">Toàn quốc</option>
                </SelectComponent>
              </CardContent>
            </Card>

            {/* Organizer Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-5 w-5 text-gray-500">📈</span>
                  Thống kê hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="h-8 w-8 text-blue-500">📅</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {organizerStats.totalEvents}
                    </div>
                    <p className="text-sm text-gray-500">Sự kiện đã tổ chức</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="h-8 w-8 text-green-500">👥</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {organizerStats.totalAttendees.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">Tổng người tham gia</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="h-8 w-8 text-purple-500">📈</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {(organizerStats.totalRevenue / 1000000000).toFixed(1)}B đ
                    </div>
                    <p className="text-sm text-gray-500">Tổng doanh thu</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="h-8 w-8 text-yellow-500">⭐</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {organizerStats.avgRating}
                    </div>
                    <p className="text-sm text-gray-500">Đánh giá trung bình</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "business" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-5 w-5 text-gray-500">🏢</span>
                  Thông tin doanh nghiệp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Tên công ty</Label>
                    <Input
                      id="companyName"
                      value={profile.companyName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxCode">Mã số thuế</Label>
                    <Input
                      id="taxCode"
                      value={profile.taxCode}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          taxCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ công ty</Label>
                  <Textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Số tài khoản ngân hàng</Label>
                    <Input
                      id="bankAccount"
                      value={profile.bankAccount}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          bankAccount: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <SelectComponent
                      value={profile.bankName}
                      onChange={(value) =>
                        setProfile((prev) => ({ ...prev, bankName: value }))
                      }
                      label="Tên ngân hàng"
                      id="bankName"
                    >
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="VietinBank">VietinBank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="Agribank">Agribank</option>
                      <option value="Techcombank">Techcombank</option>
                      <option value="MB Bank">MB Bank</option>
                    </SelectComponent>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Tài liệu xác minh</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <span className="h-8 w-8 mx-auto mb-2 text-gray-500 block">
                        🏢
                      </span>
                      <p className="text-sm text-gray-500 mb-2">
                        Giấy phép kinh doanh
                      </p>
                      <Button variant="outline" size="sm">
                        Tải lên
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <span className="h-8 w-8 mx-auto mb-2 text-gray-500 block">
                        💳
                      </span>
                      <p className="text-sm text-gray-500 mb-2">
                        Chứng minh tài khoản ngân hàng
                      </p>
                      <Button variant="outline" size="sm">
                        Tải lên
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="space-y-6">
            <WalletDashboard />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-5 w-5 text-gray-500">🔔</span>
                  Cài đặt thông báo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <SwitchComponent
                    checked={notifications.emailBookings}
                    onChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        emailBookings: checked,
                      }))
                    }
                    id="emailBookings"
                    label="Email đặt vé mới"
                    description="Thông báo khi có người đặt vé sự kiện"
                  />
                  <SwitchComponent
                    checked={notifications.emailPayments}
                    onChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        emailPayments: checked,
                      }))
                    }
                    id="emailPayments"
                    label="Email thanh toán"
                    description="Thông báo về các giao dịch thanh toán"
                  />
                  <SwitchComponent
                    checked={notifications.emailRefunds}
                    onChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        emailRefunds: checked,
                      }))
                    }
                    id="emailRefunds"
                    label="Email hoàn tiền"
                    description="Thông báo về yêu cầu hoàn tiền"
                  />
                  <SwitchComponent
                    checked={notifications.pushBookings}
                    onChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        pushBookings: checked,
                      }))
                    }
                    id="pushBookings"
                    label="Push notification đặt vé"
                    description="Thông báo đẩy trên thiết bị"
                  />
                  <SwitchComponent
                    checked={notifications.smsImportant}
                    onChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        smsImportant: checked,
                      }))
                    }
                    id="smsImportant"
                    label="SMS quan trọng"
                    description="Tin nhắn SMS cho thông báo quan trọng"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-5 w-5 text-gray-500">🛡️</span>
                  Cài đặt quyền riêng tư
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <SwitchComponent
                    checked={privacy.profilePublic}
                    onChange={(checked) =>
                      setPrivacy((prev) => ({
                        ...prev,
                        profilePublic: checked,
                      }))
                    }
                    id="profilePublic"
                    label="Hồ sơ công khai"
                    description="Cho phép người dùng xem thông tin tổ chức"
                  />
                  <SwitchComponent
                    checked={privacy.showEvents}
                    onChange={(checked) =>
                      setPrivacy((prev) => ({ ...prev, showEvents: checked }))
                    }
                    id="showEvents"
                    label="Hiển thị danh sách sự kiện"
                    description="Cho phép xem các sự kiện đã tổ chức"
                  />
                  <SwitchComponent
                    checked={privacy.showStats}
                    onChange={(checked) =>
                      setPrivacy((prev) => ({ ...prev, showStats: checked }))
                    }
                    id="showStats"
                    label="Hiển thị thống kê"
                    description="Cho phép xem số liệu thống kê hoạt động"
                  />
                  <SwitchComponent
                    checked={privacy.allowMessages}
                    onChange={(checked) =>
                      setPrivacy((prev) => ({
                        ...prev,
                        allowMessages: checked,
                      }))
                    }
                    id="allowMessages"
                    label="Cho phép nhắn tin"
                    description="Nhận tin nhắn từ người tham gia sự kiện"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-6">
        <Button className="flex-1">Lưu tất cả thay đổi</Button>
        <Button variant="outline">Hủy</Button>
      </div>
    </div>
  );
}
