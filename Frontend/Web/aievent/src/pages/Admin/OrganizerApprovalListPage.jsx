import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useOrganizers } from "../../hooks/useOrganizers";
import {
  Loader2,
  Search,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  Users,
} from "lucide-react";

const StatCard = ({ title, value, color, icon }) => {
  const colorConfigs = {
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-700",
      cardBg: "from-blue-50 to-blue-100/50",
    },
    yellow: {
      bg: "bg-yellow-500",
      text: "text-yellow-700",
      cardBg: "from-yellow-50 to-yellow-100/50",
    },
    green: {
      bg: "bg-green-500",
      text: "text-green-700",
      cardBg: "from-green-50 to-green-100/50",
    },
    red: {
      bg: "bg-red-500",
      text: "text-red-700",
      cardBg: "from-red-50 to-red-100/50",
    },
  };

  const config = colorConfigs[color] || colorConfigs.blue;

  return (
    <Card className="border-primary/10 shadow-lg backdrop-blur-sm bg-card/95 hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${config.bg} rounded-lg shadow-md group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon, { className: "h-6 w-6 text-white drop-shadow-md" })}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
          <p className={`text-3xl font-bold ${config.text} group-hover:text-primary transition-colors`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function OrganizerApprovalListPage() {
  const navigate = useNavigate();
  const { getOrganizers, loading } = useOrganizers();

  const [organizerData, setOrganizerData] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
    totalItems: 0,
  });
  const [allOrganizers, setAllOrganizers] = useState([]); //  dùng cho thống kê

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchAllData(); // load tổng cho thẻ thống kê
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsTransitioning(true);
    fetchData(); // load theo filter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pageNumber]);

  useEffect(() => {
    if (!loading && organizerData?.items) {
      // Delay nhỏ để fade in mượt mà
      const timer = setTimeout(() => setIsTransitioning(false), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, organizerData?.items]);

  //  Gọi API theo filter
  const fetchData = async () => {
    const statusMap = {
      All: undefined,
      Pending: "Pending",
      Approved: "Approved",
      Rejected: "Rejected",
    };

    const data = await getOrganizers({
      status: statusMap[statusFilter],
      search,
      pageNumber,
      pageSize: 10,
    });
    // if (data) setOrganizerData(data);
    if (data?.items) {
      //  Sắp xếp đơn mới nhất lên đầu
      const sortedItems = [...data.items].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.CreatedAt || 0);
        const dateB = new Date(b.createdAt || b.CreatedAt || 0);
        return dateB - dateA; // giảm dần
      });

      setOrganizerData({
        ...data,
        items: sortedItems,
      });
    }
  };

  //  Gọi API lấy tất cả để tính thống kê (không phân trang)
  const fetchAllData = async () => {
    const data = await getOrganizers({ pageSize: 9999 }); // load tất cả
    if (data?.items) setAllOrganizers(data.items);
  };

  const handleSearch = () => {
    setPageNumber(1);
    fetchData();
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (pageNumber < organizerData.totalPages) setPageNumber(pageNumber + 1);
  };

  //  Tính thống kê dựa trên allOrganizers (toàn bộ)
  const totalAll = allOrganizers.length;
  const totalApprove = allOrganizers.filter(
    (o) => o.status === "Approved"
  ).length;
  const totalReject = allOrganizers.filter(
    (o) => o.status === "Rejected"
  ).length;
  const totalPending = allOrganizers.filter(
    (o) => o.status === "Pending"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Duyệt Hồ Sơ Organizer
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản lý và phê duyệt các hồ sơ tổ chức đăng ký trên hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-in">
        <StatCard
          title="Tổng số hồ sơ"
          value={totalAll}
          color="blue"
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="Chờ duyệt"
          value={totalPending}
          color="yellow"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          title="Đã duyệt"
          value={totalApprove}
          color="green"
          icon={<CheckCircle className="w-6 h-6" />}
        />
        <StatCard
          title="Từ chối"
          value={totalReject}
          color="red"
          icon={<XCircle className="w-6 h-6" />}
        />
      </div>

        {/* Search and Filter Section */}
        <Card className="border-primary/10 shadow-lg backdrop-blur-sm bg-card/95 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground h-5 w-5" />
                <Input
                  placeholder="Tìm kiếm theo tên công ty hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-12 h-12 text-base border-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-foreground/70"
                />
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                className="h-12 px-6 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <Search className="h-4 w-4 mr-2" />
                Tìm Kiếm
              </Button>

              {/* Filter Tabs */}
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
                <TabsList className="h-12 bg-muted/50">
                  <TabsTrigger value="All" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Tất cả
                  </TabsTrigger>
                  <TabsTrigger value="Pending" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Chờ duyệt
                  </TabsTrigger>
                  <TabsTrigger value="Approved" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Đã duyệt
                  </TabsTrigger>
                  <TabsTrigger value="Rejected" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Từ chối
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Organizers List */}
        <Card className="border-primary/10 shadow-xl backdrop-blur-sm bg-card/95">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Danh Sách Hồ Sơ
              </h2>
              <Badge variant="secondary" className="px-3 py-1 text-foreground">
                {organizerData?.items?.length || 0} hồ sơ
              </Badge>
            </div>

            <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : organizerData?.items?.length > 0 ? (
              <div className="grid gap-4">
                {organizerData.items.map((org) => (
                  <div
                    key={org.id}
                    className="group relative p-5 rounded-2xl border-2 border-primary/10 bg-gradient-to-br from-card to-card/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Background Gradient Effect */}
                    <div className="absolute inset-0 bg-blue-500 opacity-5 group-hover:opacity-10 transition-opacity" />
                    
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={org.imgCompany || "/placeholder-company.png"}
                            alt={org.companyName}
                            className="w-20 h-20 object-cover rounded-xl border-2 border-primary/20 shadow-md group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              // Chỉ set placeholder một lần để tránh vòng lặp
                              if (e.target.src !== window.location.origin + "/placeholder-company.png" && 
                                  !e.target.src.includes("placeholder-company.png")) {
                                e.target.src = "/placeholder-company.png";
                                e.target.onerror = null; // Ngăn vòng lặp
                              }
                            }}
                            loading="lazy"
                          />
                          <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full border-2 border-primary/20">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {org.companyName}
                            </h3>
                            <Badge
                              className={`text-xs px-3 py-1 font-medium ${
                                org.status === "Approved"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : org.status === "Rejected"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }`}
                            >
                              {org.status === "Approved"
                                ? "● Đã duyệt"
                                : org.status === "Rejected"
                                ? "● Từ chối"
                                : "● Chờ duyệt"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="truncate">{org.contactEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>{org.contactPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs border-primary/20">
                                {org.organizationType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/manager/organizers/${org.id}`, {
                            state: { status: org.status },
                          })
                        }
                        className="bg-gradient-primary hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem Chi Tiết
                      </Button>
                    </div>

                    {/* Hover Effect Border */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-block p-6 bg-muted/30 rounded-2xl mb-4">
                  <Users className="h-16 w-16 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">
                  Không có hồ sơ nào phù hợp
                </p>
                <p className="text-sm text-foreground/80">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {organizerData.totalPages > 1 && (
          <Card className="border-primary/10 shadow-lg backdrop-blur-sm bg-card/95">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground/80">
                  Trang {pageNumber} / {organizerData.totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={pageNumber === 1}
                    className="border-primary/20 hover:bg-primary/5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={pageNumber === organizerData.totalPages}
                    className="border-primary/20 hover:bg-primary/5"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
