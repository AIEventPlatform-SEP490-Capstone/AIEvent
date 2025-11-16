import React, { useEffect, useMemo, useState } from "react";
import { dashboardAPI } from "../../api/dashboardAPI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Activity, BarChart3, Calendar, Users, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

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

const ListItem = ({ title, subtitle, meta, index }) => (
  <div
    className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">
          {title}
        </div>
        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{subtitle}</div>
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

const PlatformLogActivity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [report, setReport] = useState({
    monthlyStatistics: { newUsers: 0, newEvents: 0, revenue: 0 },
    recentActivities: {
      items: [],
      totalItems: 0,
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  });

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await dashboardAPI.getAdminSystemReport({ pageNumber, pageSize });
      setReport(data);
    } catch (e) {
      console.error(e);
      setError("Không tải được dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize]);

  const { monthlyStatistics, recentActivities } = report;

  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-3">  
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReport}
          disabled={loading}
          className="gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>
    ),
    [loading]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Log Activity</h1>
          <p className="text-muted-foreground">Báo cáo hệ thống và hoạt động gần đây</p>
        </div>
        {headerRight}
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Users}
          title="Người dùng mới (tháng)"
          value={monthlyStatistics.newUsers.toLocaleString("vi-VN")}
        />
        <StatCard
          icon={Calendar}
          title="Sự kiện mới (tháng)"
          value={monthlyStatistics.newEvents.toLocaleString("vi-VN")}
        />
        <StatCard
          icon={BarChart3}
          title="Doanh thu (tháng)"
          value={(monthlyStatistics.revenue ?? 0).toLocaleString("vi-VN")}
          sub="VNĐ"
        />
      </div>

      {/* Recent Activities + Summary */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Recent Activities */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>Cập nhật mới nhất từ hệ thống</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!recentActivities.hasPreviousPage || loading}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!recentActivities.hasNextPage || loading}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading && (
              <div className="p-6 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
            )}
            {error && <div className="p-6 text-sm text-red-500">{error}</div>}
            {!loading && !error && recentActivities.items?.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground text-center">Chưa có hoạt động nào.</div>
            )}
            {!loading &&
              !error &&
              recentActivities.items?.map((item, index) => (
                <ListItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.description}
                  meta={new Date(item.createdAt).toLocaleString("vi-VN")}
                  index={index}
                />
              ))}
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground border-t">
              <span>Trang {recentActivities.currentPage}/{recentActivities.totalPages}</span>
              <span>Tổng {recentActivities.totalItems} hoạt động</span>
            </div>
          </CardContent>
        </Card>

        {/* Summary Right */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Tóm tắt nhanh</CardTitle>
            <CardDescription>Theo tháng hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Người dùng mới</div>
              <div className="font-medium">{monthlyStatistics.newUsers}</div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Sự kiện mới</div>
              <div className="font-medium">{monthlyStatistics.newEvents}</div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Doanh thu</div>
              <div className="font-medium">{(monthlyStatistics.revenue ?? 0).toLocaleString("vi-VN")} VNĐ</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformLogActivity;