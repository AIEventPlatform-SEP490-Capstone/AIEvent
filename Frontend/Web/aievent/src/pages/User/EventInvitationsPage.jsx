import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  Mail,
  ArrowLeft,
  Sparkles,
  Search as SearchIcon,
  Tag,
  Building2,
  Ticket,
  Users,
  ArrowRight,
  TrendingUp,
  Filter,
  SortDesc,
  SortAsc,
  Inbox,
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Pagination from "../../components/common/Pagination.jsx";
import { PATH } from "../../routes/path";
import { eventAPI } from "../../api/eventAPI";
import clsx from "clsx";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { Spinner } from "../../components/ui/spinner";
import imgBackup from "../../assets/loginpanel.jpg";
const SUB_TABS = [
  { key: "All", label: "Tất cả", icon: Inbox },
  { key: "Pending", label: "Đang chờ", icon: Hourglass },
  { key: "Accepted", label: "Đã chấp nhận", icon: CheckCircle },
  { key: "Rejected", label: "Đã từ chối", icon: XCircle },
];

const MAIN_TABS = [
  { key: "received", label: "Lời mời đã nhận", icon: Mail },
  { key: "sent", label: "Lời mời đã gửi", icon: Send },
];

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A";

const formatTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

const StatusPill = ({ status }) => {
  const configs = {
    Pending: {
      bg: "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200",
      text: "text-amber-700",
      icon: Hourglass,
      label: "Đang chờ",
    },
    Accepted: {
      bg: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200",
      text: "text-emerald-700",
      icon: CheckCircle,
      label: "Đã chấp nhận",
    },
    Rejected: {
      bg: "bg-gradient-to-r from-rose-50 to-red-50 border-rose-200",
      text: "text-rose-700",
      icon: XCircle,
      label: "Đã từ chối",
    },
  };
  const config = configs[status] || configs.Pending;
  const Icon = config.icon;

  return (
    <Badge
      className={`${config.bg} ${config.text} border backdrop-blur-sm shadow-sm flex items-center gap-1.5`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};

const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-white rounded-3xl shadow-sm border overflow-hidden"
      >
        <div className="h-52 bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="flex gap-3 mt-4">
            <div className="h-10 bg-gray-200 rounded-lg flex-1" />
            <div className="h-10 bg-gray-200 rounded-lg flex-1" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const getDisplayTicketPrice = (event) => {
  if (!event?.ticketDetails?.length) return "Miễn phí";
  const prices = event.ticketDetails.map((t) => t.ticketPrice || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const format = (v) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(v);
  return min === max ? format(min) : `${format(min)} - ${format(max)}`;
};

const EventInvitationsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s) => s.auth || {});
  const currentUserEmail = user?.email || "user@gmail.com";

  const [mainTab, setMainTab] = useState("received");
  const [subTab, setSubTab] = useState("All");
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState("desc");

  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    invitationId: null,
    action: null,
    loading: false,
  });
  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bạn cần đăng nhập để xem lời mời.");
      navigate(PATH.LOGIN);
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await eventAPI.getInvitationsStatus({
        pageNumber: 1,
        pageSize: 100,
      });
      if (res?.items) {
        const enriched = await Promise.all(
          res.items.map(async (inv) => {
            try {
              const eventDetail = await eventAPI.getEventById(inv.eventId);
              return { ...inv, event: eventDetail };
            } catch {
              return { ...inv, event: null };
            }
          })
        );
        setInvitations(enriched);
      } else {
        setInvitations([]);
      }
    } catch (err) {
      toast.error("Không thể tải lời mời. Vui lòng thử lại sau.");
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const roleFiltered = useMemo(() => {
    return invitations.filter((inv) =>
      mainTab === "received"
        ? (inv.invitedUserEmail || inv.invitedEmail) === currentUserEmail
        : (inv.inviteEmail || inv.inviterEmail) === currentUserEmail
    );
  }, [invitations, mainTab, currentUserEmail]);

  const statusFiltered = useMemo(() => {
    if (subTab === "All") return roleFiltered;
    return roleFiltered.filter((inv) => (inv.status || "Pending") === subTab);
  }, [roleFiltered, subTab]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return statusFiltered;
    return statusFiltered.filter((inv) => {
      const title = (inv.event?.title || inv.eventTitle || "").toLowerCase();
      const inviter = (inv.inviteName || "").toLowerCase();
      const invited = (inv.invitedUserName || "").toLowerCase();
      return `${title} ${inviter} ${invited}`.includes(q);
    });
  }, [statusFiltered, query]);

  const sorted = useMemo(() => {
    const arr = [...searched];
    arr.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });
    return arr;
  }, [searched, sortDir]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage]);

  const clearSearch = () => setQuery("");

  const stats = useMemo(() => {
    const all = roleFiltered.length;
    const pending = roleFiltered.filter((i) => i.status === "Pending").length;
    const accepted = roleFiltered.filter((i) => i.status === "Accepted").length;
    const rejected = roleFiltered.filter((i) => i.status === "Rejected").length;
    return { all, pending, accepted, rejected };
  }, [roleFiltered]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    Xin chào,
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    {user?.fullName || user?.name || currentUserEmail}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                className="hover:bg-gray-100 rounded-xl"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>

              <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg rounded-xl"
                onClick={() => navigate(PATH.HOME)}
              >
                <span className="hidden sm:inline">Khám phá sự kiện</span>
                <span className="sm:hidden">Khám phá</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.all}
                </div>
                <div className="text-xs text-gray-500 mt-1">Tổng số</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Inbox className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {stats.pending}
                </div>
                <div className="text-xs text-gray-500 mt-1">Chờ xử lý</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Hourglass className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {stats.accepted}
                </div>
                <div className="text-xs text-gray-500 mt-1">Đã chấp nhận</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-rose-600">
                  {stats.rejected}
                </div>
                <div className="text-xs text-gray-500 mt-1">Đã từ chối</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 mb-6"
        >
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setMainTab(tab.key);
                  setSubTab("All");
                  setCurrentPage(1);
                }}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200",
                  mainTab === tab.key
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                    : "bg-white border-2 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          layout
          className="bg-white rounded-2xl p-5 shadow-sm border mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-12 pr-10 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm outline-none focus:border-indigo-300 focus:bg-white transition-all"
                placeholder="Tìm theo tiêu đề, người mời, người được mời..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                {sortDir === "desc" ? (
                  <SortDesc className="w-5 h-5 text-gray-600" />
                ) : (
                  <SortAsc className="w-5 h-5 text-gray-600" />
                )}
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value)}
                  className="bg-transparent text-sm font-medium outline-none cursor-pointer"
                >
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {SUB_TABS.map((st) => {
              const Icon = st.icon;
              return (
                <button
                  key={st.key}
                  onClick={() => {
                    setSubTab(st.key);
                    setCurrentPage(1);
                  }}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    subTab === st.key
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {st.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content */}
        <main>
          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : (
            <>
              {sorted.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Không có lời mời phù hợp
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Không tìm thấy lời mời nào với bộ lọc hiện tại. Thử xóa bộ
                    lọc để xem tất cả.
                  </p>
                  <Button
                    onClick={() => {
                      setSubTab("All");
                      setQuery("");
                      setSortDir("desc");
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                </motion.div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {paged.map((inv, idx) => {
                    const title =
                      inv.event?.title || inv.eventTitle || "Tên sự kiện";
                    const image =
                      inv.event?.imgListEvent?.[0] ||
                      inv.eventImage ||
                      imgBackup ||
                      "/placeholder.jpg";
                    const roleLabel =
                      mainTab === "received"
                        ? inv.inviteName
                        : inv.invitedUserName;

                    return (
                      <motion.article
                        key={inv.invitationId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="group bg-white rounded-3xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300"
                      >
                        {/* Image Header */}
                        <div className="relative h-52 w-full overflow-hidden">
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            src={image}
                            alt={title}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                          {/* Top badges */}
                          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                            <Badge className="bg-white/95 text-gray-800 backdrop-blur-md shadow-lg border border-white/20 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(inv.createdAt)}
                            </Badge>
                            <StatusPill status={inv.status} />
                          </div>

                          {/* Overlay hover effect */}
                          <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-all duration-300" />
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                          {/* Title */}
                          <div>
                            <h3
                              className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 mb-2 line-clamp-1 cursor-pointer flex items-center gap-2"
                              onClick={() =>
                                navigate(
                                  PATH.EVENT_DETAIL.replace(":id", inv.eventId)
                                )
                              }
                            >
                              {title}
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {inv.event?.description ||
                                inv.message ||
                                "Không có mô tả."}
                            </p>
                          </div>

                          {/* Event Details */}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="p-1.5 bg-indigo-50 rounded-lg">
                                <Tag className="w-4 h-4 text-indigo-600" />
                              </div>
                              <span className="font-medium">Thể loại:</span>
                              <span className="text-gray-600">
                                {inv.event?.eventCategory?.eventCategoryName ||
                                  "Khác"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="p-1.5 bg-purple-50 rounded-lg">
                                <Building2 className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="font-medium">Tổ chức:</span>
                              <span className="text-gray-600 truncate">
                                {inv.event?.organizerEvent?.companyName ||
                                  "Không xác định"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="p-1.5 bg-emerald-50 rounded-lg">
                                <Ticket className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="font-medium">Giá vé:</span>
                              <span className="font-semibold text-emerald-600">
                                {getDisplayTicketPrice(inv.event)}
                              </span>
                            </div>

                            {/* Thời gian */}
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="p-1.5 bg-blue-50 rounded-lg">
                                <Clock className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium">Thời gian:</span>
                              <span className="font-semibold text-blue-700">
                                {inv.event?.startTime && inv.event?.endTime
                                  ? `${formatDateTime(
                                      inv.event.startTime
                                    )} → ${formatDateTime(inv.event.endTime)}`
                                  : "Chưa xác định"}
                              </span>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full">
                                  <Users className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">
                                    {mainTab === "received"
                                      ? "Người mời"
                                      : "Người được mời"}
                                  </div>
                                  <div className="text-sm font-semibold text-gray-800">
                                    {roleLabel}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {inv.respondedAt
                                    ? formatTime(inv.respondedAt)
                                    : "Chưa phản hồi"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {mainTab === "received" &&
                            inv.status === "Pending" && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 pt-2"
                              >
                                <Button
                                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg rounded-xl"
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      invitationId: inv.invitationId,
                                      action: "Approved",
                                      loading: false,
                                    })
                                  }
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Chấp nhận
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 border-2 border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl"
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      invitationId: inv.invitationId,
                                      action: "Rejected",
                                      loading: false,
                                    })
                                  }
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Từ chối
                                </Button>
                              </motion.div>
                            )}
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {sorted.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-10"
                >
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(sorted.length / pageSize) || 1}
                    onPageChange={(p) => setCurrentPage(p)}
                  />
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
      {/* Confirm Modal */}
      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.open && (
          <Dialog
            open={confirmModal.open}
            onOpenChange={(o) =>
              setConfirmModal((prev) => ({ ...prev, open: o }))
            }
          >
            <DialogContent className="bg-transparent shadow-none p-0 border-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-6 relative z-10 max-w-sm w-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Xác nhận{" "}
                    {confirmModal.action === "Approved"
                      ? "chấp nhận"
                      : "từ chối"}{" "}
                    lời mời?
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Hành động này sẽ{" "}
                    {confirmModal.action === "Approved"
                      ? "chấp nhận"
                      : "từ chối"}{" "}
                    lời mời này.
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      className="bg-gray-100 text-gray-700"
                      onClick={() =>
                        setConfirmModal((prev) => ({ ...prev, open: false }))
                      }
                      disabled={confirmModal.loading}
                    >
                      Huỷ
                    </Button>
                    <Button
                      className={clsx(
                        "text-white",
                        confirmModal.action === "Approved"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      )}
                      onClick={async () => {
                        setConfirmModal((prev) => ({ ...prev, loading: true }));
                        try {
                          await eventAPI.confirmInvitation(
                            confirmModal.invitationId,
                            { status: confirmModal.action }
                          );
                          setInvitations((prev) =>
                            prev.map((i) =>
                              i.invitationId === confirmModal.invitationId
                                ? {
                                    ...i,
                                    status: confirmModal.action,
                                    respondedAt: new Date(),
                                  }
                                : i
                            )
                          );
                          toast.success(
                            confirmModal.action === "Approved"
                              ? "Đã chấp nhận lời mời"
                              : "Đã từ chối lời mời"
                          );
                          setConfirmModal({
                            open: false,
                            invitationId: null,
                            action: null,
                            loading: false,
                          });
                          fetchData();
                        } catch (err) {
                          toast.error("Cập nhật thất bại.");
                          setConfirmModal((prev) => ({
                            ...prev,
                            loading: false,
                          }));
                        }
                      }}
                      disabled={confirmModal.loading}
                    >
                      {confirmModal.loading ? (
                        <Spinner size="sm" />
                      ) : (
                        "Xác nhận"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventInvitationsPage;
