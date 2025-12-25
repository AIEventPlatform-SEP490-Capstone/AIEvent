// PaymentHistoryDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { dashboardAPI } from "../../api/dashboardAPI";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Activity,
  Users,
  Calendar,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
} from "lucide-react";

// Re-use StatCard & ListItem từ code cũ
const StatCard = ({ icon: Icon, title, value, sub }) => (
  <Card>
    <CardContent className="py-5 px-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-muted text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </CardContent>
  </Card>
);

const ActivityItem = ({ title, subtitle, meta, index }) => (
  <div
    className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">{title}</div>
        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {subtitle}
        </div>
      </div>
      {meta && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <Calendar className="h-3 w-3" />
          {meta}
        </div>
      )}
    </div>
  </div>
);

const PaymentItem = ({ item, index }) => {
  const isPayout =
    item.historyType === "Payout" || item.transactionType === "Payout";
  const isTopup =
    item.historyType === "Topup" || item.transactionType === "Topup";
  const isWithdraw =
    item.historyType === "Withdraw" || item.transactionType === "Withdraw";
  const isFee =
    item.historyType === "Platform fee" ||
    item.transactionType === "Platform fee";
  const isIncome = isFee || isTopup;
  const isExpense = isWithdraw || isPayout;
  const getIcon = () => {
    if (isPayout) return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
    if (isTopup) return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
    if (isWithdraw) return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
    if (isFee) return <ArrowUpCircle className="h-4 w-4 text-orange-500" />;
    return <DollarSign className="h-4 w-4" />;
  };

  const getBadgeVariant = () => {
    if (isPayout) return "default";
    if (isTopup) return "secondary";
    if (isWithdraw) return "destructive";
    if (isFee) return "outline";
    return "outline";
  };

  return (
    <div
      className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">{getIcon()}</div>
          <div>
            <div className="font-medium flex items-center gap-2">
              {item.userName || item.organizerName || "N/A"}
              <Badge variant={getBadgeVariant()} className="text-xs">
                {item.historyType || item.transactionType}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {item.description || item.note || "-"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`font-semibold ${isIncome ? "text-green-600" : isExpense ? "text-red-600" : ""
              }`}
          >
            {isIncome ? "+" : "-"}
            {Math.abs(item.amount || 0).toLocaleString("vi-VN")} VNĐ
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            {new Date(item.createdAt || item.transactionDate).toLocaleString(
              "vi-VN"
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentHistoryDashboard = () => {
  // ====== Tab chung ======
  const [activeTab, setActiveTab] = useState("activity");

  // ====== Activity Log State ======
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityReport, setActivityReport] = useState({
    monthlyStatistics: { newUsers: 0, newEvents: 0, revenue: 0 },
    recentActivities: {
      items: [],
      totalItems: 0,
      currentPage: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  });

  // ====== Payment History State ======
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [historyType, setHistoryType] = useState(null);
  const [paymentData, setPaymentData] = useState({
    items: [],
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
  });

  // Filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [search, setSearch] = useState("");

  // ====== Fetch Activity ======
  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      const data = await dashboardAPI.getAdminSystemReport({
        pageNumber: activityPage,
        pageSize: 10,
      });
      setActivityReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLoading(false);
    }
  };

  // ====== Fetch Payment History ======
  const fetchPayments = async () => {
    setPaymentLoading(true);
    try {
      const data = await dashboardAPI.getPaymentHistory({
        year: year || undefined,
        month: month || undefined,
        search: search || undefined,
        historyType: historyType || undefined,
        pageNumber: paymentPage,
        pageSize: 10,
      });
      setPaymentData(data); // giả sử API trả về { items, totalItems, currentPage, totalPages }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ====== Effects ======
  useEffect(() => {
    if (activeTab === "activity") fetchActivity();
  }, [activityPage, activeTab]);

  useEffect(() => {
    if (activeTab === "payment") fetchPayments();
  }, [paymentPage, year, month, search, historyType, activeTab]);

  // ====== Header Right (Refresh) ======
  const headerRight = useMemo(() => {
    const loading = activeTab === "activity" ? activityLoading : paymentLoading;
    const onRefresh = activeTab === "activity" ? fetchActivity : fetchPayments;

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Làm mới
      </Button>
    );
  }, [activeTab, activityLoading, paymentLoading]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Báo cáo hệ thống
          </h1>
          <p className="text-muted-foreground">
            Theo dõi hoạt động và giao dịch thanh toán
          </p>
        </div>
        {headerRight}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Hoạt động gần đây
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Lịch sử giao dịch
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB HOẠT ĐỘNG ==================== */}
        <TabsContent value="activity" className="space-y-6">
          {/* Top Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={Users}
              title="Người dùng mới (tháng)"
              value={activityReport.monthlyStatistics.newUsers.toLocaleString(
                "vi-VN"
              )}
            />
            <StatCard
              icon={Calendar}
              title="Sự kiện mới (tháng)"
              value={activityReport.monthlyStatistics.newEvents.toLocaleString(
                "vi-VN"
              )}
            />
            <StatCard
              icon={BarChart3}
              title="Doanh thu (tháng)"
              value={(
                activityReport.monthlyStatistics.revenue ?? 0
              ).toLocaleString("vi-VN")}
              sub="VNĐ"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Hoạt động gần đây</CardTitle>
                  <CardDescription>
                    Cập nhật mới nhất từ hệ thống
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      !activityReport.recentActivities.hasPreviousPage ||
                      activityLoading
                    }
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      !activityReport.recentActivities.hasNextPage ||
                      activityLoading
                    }
                    onClick={() => setActivityPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activityLoading && (
                  <div className="p-6 text-center text-muted-foreground">
                    Đang tải...
                  </div>
                )}
                {!activityLoading &&
                  activityReport.recentActivities.items.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">
                      Chưa có hoạt động nào.
                    </div>
                  )}
                {activityReport.recentActivities.items.map((item, idx) => (
                  <ActivityItem
                    key={item.id}
                    title={item.title}
                    subtitle={item.description}
                    meta={new Date(item.createdAt).toLocaleString("vi-VN")}
                    index={idx}
                  />
                ))}
                <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground border-t">
                  <span>
                    Trang {activityReport.recentActivities.currentPage}/
                    {activityReport.recentActivities.totalPages}
                  </span>
                  <span>
                    Tổng {activityReport.recentActivities.totalItems} hoạt động
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tóm tắt nhanh (giống cũ) */}
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt nhanh</CardTitle>
                <CardDescription>Theo tháng hiện tại</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Người dùng mới
                  </div>
                  <div className="font-medium">
                    {activityReport.monthlyStatistics.newUsers}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Sự kiện mới
                  </div>
                  <div className="font-medium">
                    {activityReport.monthlyStatistics.newEvents}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Doanh thu</div>
                  <div className="font-medium">
                    {(
                      activityReport.monthlyStatistics.revenue ?? 0
                    ).toLocaleString("vi-VN")}{" "}
                    VNĐ
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== TAB GIAO DỊCH THANH TOÁN ==================== */}
        <TabsContent value="payment" className="space-y-6">
          {/* Bộ lọc */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <Label htmlFor="year">Năm</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value ? Number(e.target.value) : "");
                    setPaymentPage(1);
                  }}
                  placeholder="2025"
                />
              </div>
              <div className="w-32">
                <Label htmlFor="month">Tháng</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value ? Number(e.target.value) : "");
                    setPaymentPage(1);
                  }}
                  placeholder="1-12"
                />
              </div>
              <div className="w-48">
                <Label>Loại giao dịch</Label>
                <Select
                  value={historyType || "ALL"}
                  onValueChange={(value) => {
                    setHistoryType(value === "ALL" ? null : value);
                    setPaymentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="Payout">Thanh toán tiền sự kiện</SelectItem>
                    <SelectItem value="Platform fee">Doanh thu nền tảng</SelectItem>
                    <SelectItem value="Topup">Nạp tiền</SelectItem>
                    <SelectItem value="Withdraw">Rút tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-64">
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    className="pl-10"
                    placeholder="Tên người dùng, mô tả..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPaymentPage(1);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danh sách giao dịch */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giao dịch</CardTitle>
              <CardDescription>
                Topup, Payout, Withdraw của người dùng & organizer
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {paymentLoading && (
                <div className="p-6 text-center text-muted-foreground">
                  Đang tải dữ liệu giao dịch...
                </div>
              )}
              {!paymentLoading && paymentData.items.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  Không tìm thấy giao dịch nào.
                </div>
              )}
              {paymentData.items.map((item, idx) => (
                <PaymentItem key={item.id} item={item} index={idx} />
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paymentPage <= 1 || paymentLoading}
                    onClick={() => setPaymentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      paymentPage >= paymentData.totalPages || paymentLoading
                    }
                    onClick={() => setPaymentPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  Trang {paymentData.currentPage || paymentPage}/
                  {paymentData.totalPages || 1} – Tổng{" "}
                  {paymentData.totalItems || 0} giao dịch
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentHistoryDashboard;
