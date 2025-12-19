import React, { useEffect, useMemo, useState } from "react";
import { dashboardAPI } from "../../api/dashboardAPI";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "../../components/ui/select";

import { 
  ChevronLeft, ChevronRight, Search, Calendar, 
  Users, Eye, Filter, ArrowUpDown 
} from "lucide-react";

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  const configs = {
    approved: { 
      label: "Đã duyệt",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
    },
    pendingapproval: { 
      label: "Chờ duyệt",
      className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
    },
    rejected: { 
      label: "Từ chối",
      className: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
    },
  };

  const config = configs[normalized] || { 
    label: status,
    className: "bg-gray-50 text-gray-700 border-gray-200" 
  };

  return (
    <Badge variant="outline" className={`${config.className} font-medium px-3 py-1`}>
      {config.label}
    </Badge>
  );
};

const AdminEventManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAtDesc");

  const [list, setList] = useState({
    items: [],
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await dashboardAPI.getAdminEventManagement({
        pageNumber,
        pageSize
      });
      setList(data);
    } catch (e) {
      console.error(e);
      setError("Không tải được danh sách sự kiện.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pageNumber, pageSize]);

  const filteredSortedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = [...(list.items || [])];

    if (q) {
      items = items.filter((it) =>
        ["title", "organizerName", "status"].some((k) =>
          String(it[k] || "").toLowerCase().includes(q)
        )
      );
    }

    items.sort((a, b) => {
      switch (sortKey) {
        case "titleAsc":
          return a.title.localeCompare(b.title);
        case "titleDesc":
          return b.title.localeCompare(a.title);
        case "createdAtAsc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "createdAtDesc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "participantsAsc":
          return (a.participantCount ?? 0) - (b.participantCount ?? 0);
        case "participantsDesc":
          return (b.participantCount ?? 0) - (a.participantCount ?? 0);
        case "statusAsc":
          return a.status.localeCompare(b.status);
        case "statusDesc":
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });

    return items;
  }, [list.items, search, sortKey]);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Quản lý Sự kiện
          </h1>
          <p className="text-gray-500 text-base">
            Theo dõi và kiểm duyệt các sự kiện trong hệ thống
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-12 h-12 border-gray-200 rounded-xl"
              placeholder="Tìm kiếm theo tên, tổ chức..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="lg:w-64 h-12 border-gray-200 rounded-xl">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAtDesc">Mới nhất</SelectItem>
              <SelectItem value="createdAtAsc">Cũ nhất</SelectItem>
              <SelectItem value="titleAsc">Tên A-Z</SelectItem>
              <SelectItem value="titleDesc">Tên Z-A</SelectItem>
              <SelectItem value="participantsDesc">Người tham gia ↓</SelectItem>
              <SelectItem value="participantsAsc">Người tham gia ↑</SelectItem>
              <SelectItem value="statusAsc">Trạng thái A-Z</SelectItem>
              <SelectItem value="statusDesc">Trạng thái Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LIST */}
        <div className="border border-gray-200 rounded-3xl overflow-hidden">

          {loading && (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          )}

          {error && (
            <div className="p-12 text-center text-red-500">{error}</div>
          )}

          {!loading && !error && filteredSortedItems.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Không tìm thấy kết quả.</p>
            </div>
          )}

          {!loading && !error && filteredSortedItems.length > 0 && (
            <div className="divide-y divide-gray-100">
              {filteredSortedItems.map((ev, idx) => (
                <div 
                  key={ev.eventId} 
                  className="p-6 hover:bg-gray-50/50 transition-all group"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
                  }}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* IMAGE */}
                    <div className="flex-shrink-0">
                      {ev.imageUrl ? (
                        <img 
                          src={ev.imageUrl} 
                          alt={ev.title} 
                          className="w-full lg:w-32 h-32 object-cover rounded-xl border border-gray-200"
                        />
                      ) : (
                        <div className="w-full lg:w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {ev.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Tổ chức bởi <span className="font-medium text-gray-700">
                            {ev.organizerName}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(ev.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{ev.participantCount ?? 0}</span>
                          <span className="text-gray-400">người tham gia</span>
                        </div>

                        <div className="ml-auto">
                          <StatusBadge status={ev.status} />
                        </div>
                      </div>
                    </div>       

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {!loading && !error && filteredSortedItems.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Trang <span className="font-semibold">{list.currentPage}</span> / <span className="font-semibold">{list.totalPages}</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!list.hasPreviousPage} 
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  className="border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> 
                  Trước
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!list.hasNextPage} 
                  onClick={() => setPageNumber(p => p + 1)}
                  className="border-gray-200"
                >
                  Sau 
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                Tổng <span className="font-semibold">{list.totalItems}</span> sự kiện
              </div>
            </div>
          )}

        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminEventManagement;
