import { useState, createContext, useContext } from "react";

const mockUserWallet = {
  userId: "user1",
  balance: 1000000,
  currency: "VND",
  updatedAt: new Date(),
};

const mockWalletTransactions = [
  {
    id: "wt-1",
    userId: "user1",
    type: "deposit",
    amount: 500000,
    currency: "VND",
    description: "Nạp tiền qua QR Code MOMO",
    status: "completed",
    paymentMethod: "qr_momo",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(),
    metadata: { topupMethod: "qr" },
  },
  {
    id: "wt-2",
    userId: "user1",
    type: "payment",
    amount: -200000,
    currency: "VND",
    description: "Thanh toán vé sự kiện AI Summit 2025",
    status: "completed",
    paymentMethod: "wallet",
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(),
    metadata: { eventId: "event123" },
  },
  {
    id: "wt-3",
    userId: "user1",
    type: "refund",
    amount: 100000,
    currency: "VND",
    description: "Hoàn tiền vé sự kiện Blockchain Meetup",
    status: "completed",
    paymentMethod: "wallet",
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(),
    metadata: { refundId: "ref456" },
  },
  {
    id: "wt-4",
    userId: "user1",
    type: "deposit",
    amount: 300000,
    currency: "VND",
    description: "Nạp tiền qua QR Code ZALO",
    status: "pending",
    paymentMethod: "qr_zalo",
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(),
    metadata: { topupMethod: "qr" },
    qrCode: "qr_zalo_789",
  },
  {
    id: "wt-5",
    userId: "user1",
    type: "payment",
    amount: -150000,
    currency: "VND",
    description: "Thanh toán vé workshop Startup Pitch",
    status: "failed",
    paymentMethod: "wallet",
    createdAt: new Date(Date.now() - 900000),
    updatedAt: new Date(),
    metadata: { eventId: "event789" },
  },
  {
    id: "wt-6",
    userId: "user1",
    type: "deposit",
    amount: 750000,
    currency: "VND",
    description: "Nạp tiền qua QR Code VIETTEL",
    status: "completed",
    paymentMethod: "qr_viettel",
    createdAt: new Date(Date.now() - 300000),
    updatedAt: new Date(),
    metadata: { topupMethod: "qr" },
  },
];

const WalletService = {
  formatAmount: (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Math.abs(amount));
  },
};

// Context cho Tabs
const TabsContext = createContext();

// Component Tabs chính
function Tabs({ children, defaultValue, className }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className || ""}>{children}</div>
    </TabsContext.Provider>
  );
}

// Component TabsList
function TabsList({ children, className = "grid w-full grid-cols-3" }) {
  return (
    <div className={`${className} border-b border-gray-200 mb-4`}>
      {children}
    </div>
  );
}

// Component TabsTrigger
function TabsTrigger({ value, children, className }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`py-2 px-4 font-medium text-sm border-b-2 ${className || ""} ${
        activeTab === value
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

// Component TabsContent
function TabsContent({ value, children, className }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div className={className || ""}>{children}</div>;
}

const QRTopupModal = ({ children, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount) {
      onSuccess({ amount: parseInt(amount), provider: "momo" });
      setAmount("");
      setIsOpen(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Nạp tiền qua QR</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Số tiền (VND)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Nạp tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const Badge = ({ children, className, variant = "default" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    secondary: "bg-gray-200 text-gray-800",
    outline: "bg-transparent border border-gray-300 text-gray-700",
  };
  const baseClass =
    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  return (
    <span
      className={`${baseClass} ${variants[variant] || ""} ${className || ""}`}
    >
      {children}
    </span>
  );
};

const Card = ({ children, className }) => (
  <div
    className={`border border-gray-200 rounded-lg shadow-sm ${className || ""}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={`text-lg font-semibold ${className || ""}`}>{children}</h3>
);

const CardContent = ({ children, className }) => (
  <div className={`p-6 ${className || ""}`}>{children}</div>
);

const Button = ({
  children,
  variant = "default",
  onClick,
  disabled,
  className,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default:
      "px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline:
      "px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className || ""} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
};

export default function WalletDashboard() {
  const [wallet, setWallet] = useState(mockUserWallet);
  const [transactions, setTransactions] = useState(mockWalletTransactions);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTopupSuccess = (payment) => {
    // Update wallet balance
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + payment.amount,
      updatedAt: new Date(),
    }));

    // Add transaction to list
    const newTransaction = {
      id: `wt-${Date.now()}`,
      userId: wallet.userId,
      type: "deposit",
      amount: payment.amount,
      currency: "VND",
      description: `Nạp tiền qua QR Code ${payment.provider.toUpperCase()}`,
      status: "completed",
      paymentMethod: `qr_${payment.provider}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        topupMethod: "qr",
      },
    };

    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <span className="w-4 h-4 text-green-600">⬇️</span>;
      case "payment":
        return <span className="w-4 h-4 text-red-600">➡️</span>;
      case "refund":
        return <span className="w-4 h-4 text-blue-600">🔄</span>;
      default:
        return <span className="w-4 h-4 text-gray-500">💰</span>;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "deposit":
      case "refund":
        return "text-green-600";
      case "payment":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-200">
            Hoàn thành
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
            Đang xử lý
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Thất bại</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const recentTransactions = transactions.slice(0, 5);
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="h-6 w-6">💰</span>
          <h1 className="text-2xl font-bold">Ví điện tử</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <span
            className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          >
            {isRefreshing ? "⟳" : "⟳"}
          </span>
          Làm mới
        </Button>
      </div>

      {/* Wallet Balance Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-2">Số dư khả dụng</p>
              <p className="text-3xl font-bold">
                {WalletService.formatAmount(wallet.balance)}
              </p>
              <p className="text-blue-100 text-sm mt-1">
                Cập nhật lần cuối: {wallet.updatedAt.toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="text-right">
              <span className="w-12 h-12 text-blue-200 mb-2 block">💰</span>
              <p className="text-blue-100 text-sm">Ví AIEvent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <QRTopupModal onSuccess={handleTopupSuccess}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <span className="w-8 h-8 mx-auto mb-2 text-primary block">
                📱
              </span>
              <h3 className="font-semibold mb-1">Nạp tiền QR</h3>
              <p className="text-sm text-gray-500">
                Quét mã QR để nạp tiền nhanh
              </p>
            </CardContent>
          </Card>
        </QRTopupModal>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <span className="w-8 h-8 mx-auto mb-2 text-primary block">💳</span>
            <h3 className="font-semibold mb-1">Nạp bằng thẻ</h3>
            <p className="text-sm text-gray-500">Thẻ tín dụng/ghi nợ</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <span className="w-8 h-8 mx-auto mb-2 text-primary block">📜</span>
            <h3 className="font-semibold mb-1">Lịch sử</h3>
            <p className="text-sm text-gray-500">Xem tất cả giao dịch</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transactions Alert */}
      {pendingTransactions.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 text-yellow-600">🔄</span>
              <div>
                <h3 className="font-semibold text-yellow-800">
                  Có {pendingTransactions.length} giao dịch đang xử lý
                </h3>
                <p className="text-sm text-yellow-700">
                  Vui lòng kiểm tra và hoàn tất các giao dịch chưa hoàn thành
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Gần đây</TabsTrigger>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="pending">
            Đang xử lý ({pendingTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Giao dịch gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.createdAt.toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${getTransactionColor(
                        transaction.type
                      )}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {WalletService.formatAmount(transaction.amount)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tất cả giao dịch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.createdAt.toLocaleString("vi-VN")} • ID:{" "}
                        {transaction.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${getTransactionColor(
                        transaction.type
                      )}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {WalletService.formatAmount(transaction.amount)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Giao dịch đang xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <span className="w-12 h-12 text-gray-500 mx-auto mb-4 block">
                    🔄
                  </span>
                  <p className="text-gray-500">
                    Không có giao dịch nào đang xử lý
                  </p>
                </div>
              ) : (
                pendingTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.createdAt.toLocaleString("vi-VN")}
                        </p>
                        {transaction.qrCode && (
                          <p className="text-xs text-blue-600">
                            QR: {transaction.qrCode}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${getTransactionColor(
                          transaction.type
                        )}`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {WalletService.formatAmount(transaction.amount)}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
