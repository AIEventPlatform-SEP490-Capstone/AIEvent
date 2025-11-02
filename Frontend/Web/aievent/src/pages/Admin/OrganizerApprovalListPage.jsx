// src/pages/Admin/OrganizerApprovalListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useOrganizers } from "../../hooks/useOrganizers";
import { Loader2, Search, Eye } from "lucide-react";

export default function OrganizerApprovalListPage() {
  const navigate = useNavigate();
  const { getOrganizers, organizers, loading } = useOrganizers();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Gọi danh sách Organizer
  useEffect(() => {
    getOrganizers({
      status: statusFilter !== "All" ? statusFilter : undefined,
    });
  }, [statusFilter]);

  const handleSearch = () => {
    getOrganizers({
      search,
      status: statusFilter !== "All" ? statusFilter : undefined,
    });
  };

  return (
    <div className="p-6">
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Quản lý hồ sơ Organizer
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Bộ lọc trạng thái */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="All">Tất cả</TabsTrigger>
              <TabsTrigger value="Pending">Chờ duyệt</TabsTrigger>
              <TabsTrigger value="Approve">Đã duyệt</TabsTrigger>
              <TabsTrigger value="Reject">Từ chối</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Ô tìm kiếm */}
          <div className="flex items-center gap-2 mb-4">
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

          {/* Bảng danh sách */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Logo</th>
                  <th className="p-3 text-left">Tên công ty</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">SĐT</th>
                  <th className="p-3 text-left">Loại hình</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {organizers?.length > 0 ? (
                  organizers.map((org) => (
                    <tr key={org.id} className="border-t hover:bg-muted/20">
                      <td className="p-2">
                        <img
                          src={org.imgCompany}
                          alt="logo"
                          className="w-12 h-12 object-cover rounded border"
                        />
                      </td>
                      <td className="p-2 font-semibold">{org.companyName}</td>
                      <td className="p-2">{org.contactEmail}</td>
                      <td className="p-2">{org.contactPhone}</td>
                      <td className="p-2">{org.organizationType}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            org.status === "Approve"
                              ? "bg-green-100 text-green-800"
                              : org.status === "Reject"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {org.status || "Pending"}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/admin/organizers/${org.id}`)
                          }
                        >
                          <Eye className="w-4 h-4 mr-1" /> Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-6 text-muted-foreground"
                    >
                      Không có hồ sơ nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
