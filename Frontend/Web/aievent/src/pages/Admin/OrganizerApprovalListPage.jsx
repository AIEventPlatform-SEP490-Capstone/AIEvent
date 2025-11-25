import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
} from "lucide-react";

const StatCard = ({ title, value, color, icon }) => {
  const gradients = {
    blue: "from-blue-100 to-blue-50 text-blue-700",
    yellow: "from-yellow-100 to-yellow-50 text-yellow-700",
    green: "from-green-100 to-green-50 text-green-700",
    red: "from-red-100 to-red-50 text-red-700",
  };

  return (
    <div
      className={`flex items-center justify-between p-5 rounded-2xl shadow-sm bg-gradient-to-br ${gradients[color]} transition hover:shadow-md`}
    >
      <div>
        <p className="text-sm font-medium opacity-70">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className="opacity-70">{icon}</div>
    </div>
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

  useEffect(() => {
    fetchAllData(); // load tổng cho thẻ thống kê
  }, []);

  useEffect(() => {
    fetchData(); // load theo filter
  }, [statusFilter, pageNumber]);

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
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <h1 className="text-3xl font-bold text-gray-800">
        Duyệt hồ sơ Organizer
      </h1>
      <p className="text-gray-500 mt-1">
        Quản lý và phê duyệt các hồ sơ tổ chức đăng ký trên hệ thống
      </p>

      {/*  Thẻ thống kê — luôn hiển thị tổng toàn hệ thống */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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

      {/* Bộ lọc + Tìm kiếm */}
      <div className="flex flex-wrap justify-between items-center mt-8 mb-6 gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm theo tên công ty hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" /> Tìm kiếm
          </Button>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="All">Tất cả</TabsTrigger>
            <TabsTrigger value="Pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="Approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="Rejected">Từ chối</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Danh sách hồ sơ */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : organizerData?.items?.length > 0 ? (
        <div className="grid gap-5">
          {organizerData.items.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <img
                  src={org.imgCompany}
                  alt="logo"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    {org.companyName}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ml-2 font-medium ${
                        org.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : org.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {org.status === "Approved"
                        ? "Đã duyệt"
                        : org.status === "Rejected"
                        ? "Từ chối"
                        : "Chờ duyệt"}
                    </span>
                  </h3>
                  <div className="text-sm text-gray-500 mt-1 flex flex-col sm:flex-row gap-3">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {org.contactEmail}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {org.contactPhone}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Loại hình: {org.organizationType}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="default"
                onClick={() =>
                  navigate(`/manager/organizers/${org.id}`, {
                    state: { status: org.status },
                  })
                }
                className="rounded-full"
              >
                <Eye className="w-4 h-4 mr-1" /> Xem chi tiết
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">
          Không có hồ sơ nào phù hợp
        </div>
      )}

      {/* Phân trang */}
      {organizerData.totalPages > 1 && (
        <div className="flex justify-end items-center mt-8 gap-4">
          <Button
            size="sm"
            variant="outline"
            disabled={pageNumber === 1}
            onClick={handlePrevPage}
          >
            <ChevronLeft className="w-4 h-4" /> Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {pageNumber} / {organizerData.totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={pageNumber === organizerData.totalPages}
            onClick={handleNextPage}
          >
            Sau <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
