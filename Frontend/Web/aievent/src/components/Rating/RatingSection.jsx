import React, { useState, useEffect } from "react";
import {
  Star,
  MessageCircle,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

import { Button } from "../../components/ui/button";
import { useRatings } from "../../hooks/useRatings";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { bookingAPI } from "../../api/bookingAPI";

const RatingSection = ({ eventId }) => {
  const {
    ratings,
    loading,
    createNewRating,
    updateExistingRating,
    deleteExistingRating,
    refreshRatings,
  } = useRatings(eventId);

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [ratingScore, setRatingScore] = useState(0);
  const [comment, setComment] = useState("");
  const [editingRatingId, setEditingRatingId] = useState(null);
  const [userExistingRating, setUserExistingRating] = useState(null);
  const [hasPurchasedTicket, setHasPurchasedTicket] = useState(null); // null = đang kiểm tra, true/false = đã kiểm tra xong
  const [isCheckingTicket, setIsCheckingTicket] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  //  Kiểm tra user có mua vé event này chưa
  useEffect(() => {
    const checkUserHasTicket = async () => {
      setIsCheckingTicket(true);
      if (!isAuthenticated || !eventId) {
        setHasPurchasedTicket(false);
        setIsCheckingTicket(false);
        return;
      }
      try {
        const data = await bookingAPI.getEvents();
        const bookedEvents = data?.items || [];
        const hasTicket = bookedEvents.some((e) => e.eventId === eventId);
        setHasPurchasedTicket(hasTicket);
      } catch (err) {
        console.error("Error checking ticket:", err);
        setHasPurchasedTicket(false);
      } finally {
        setIsCheckingTicket(false);
      }
    };
    checkUserHasTicket();
  }, [isAuthenticated, eventId]);

  //  Load danh sách đánh giá
  useEffect(() => {
    if (eventId) refreshRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  //  Tìm comment của user hiện tại
  useEffect(() => {
    if (isAuthenticated && ratings.length > 0) {
      const existing = ratings.find(
        (r) =>
          r.userId === user?.userId ||
          r.accountId === user?.accountId ||
          r.userName === user?.userName ||
          r.email === user?.email
      );
      setUserExistingRating(existing || null);
    } else {
      setUserExistingRating(null);
    }
  }, [ratings, isAuthenticated, user]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đánh giá sự kiện.");
      return;
    }

    if (!hasPurchasedTicket) {
      toast.error("Bạn cần tham gia sự kiện trước khi đánh giá.");
      return;
    }

    if (ratingScore === 0) {
      toast.error("Hãy chọn số sao trước khi gửi đánh giá.");
      return;
    }
    setIsSubmitting(true); //  hiển thị đang gửi
    try {
      if (userExistingRating && editingRatingId) {
        await updateExistingRating(editingRatingId, { ratingScore, comment });
        toast.success("Cập nhật đánh giá thành công!");
        setEditingRatingId(null);
      } else {
        await createNewRating({ ratingScore, comment });
        toast.success("Cảm ơn bạn đã gửi đánh giá!");
      }
      setRatingScore(0);
      setComment("");
      refreshRatings();
    } catch (error) {
      if (error?.code === "AIE40001") {
        toast.error("Bạn đã đánh giá sự kiện này rồi.");
      } else {
        toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false); //  tắt trạng thái đang gửi
    }
  };

  const handleEdit = (rating) => {
    setEditingRatingId(rating.ratingId);
    setRatingScore(rating.ratingScore);
    setComment(rating.comment);
  };

  const handleDelete = (rating) => {
    setRatingToDelete(rating);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ratingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExistingRating(ratingToDelete.ratingId);
      toast.success("Đã xóa đánh giá!");
      setUserExistingRating(null);
      setEditingRatingId(null);
      refreshRatings();
    } catch {
      toast.error("Không thể xóa đánh giá. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setRatingToDelete(null);
    }
  };

  const averageRating =
    ratings.length > 0
      ? (
          ratings.reduce((acc, r) => acc + r.ratingScore, 0) / ratings.length
        ).toFixed(1)
      : 0;

  return (
    <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900">
          Đánh giá & Nhận xét
        </h3>
      </div>

      {/* Tổng quan Rating */}
      <div className="flex items-center gap-8 mb-10 pb-8 border-b border-gray-100">
        <div className="flex flex-col items-center justify-center min-w-[120px]">
          <div className="text-6xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {averageRating}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 transition-all ${
                  i < Math.round(averageRating)
                    ? "fill-amber-400 text-amber-400 scale-110"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-gray-600 text-sm mb-1">
            Dựa trên <span className="font-semibold text-gray-900">{ratings.length}</span> đánh giá
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full flex-1 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(averageRating / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {averageRating}/5
            </span>
          </div>
        </div>
      </div>

      {/* Form đánh giá */}
      {isAuthenticated ? (
        isCheckingTicket ? (
          // Đang kiểm tra - không hiển thị gì hoặc hiển thị loading nhẹ
          <div className="mb-10"></div>
        ) : hasPurchasedTicket ? (
          <div className="mb-10">
            {userExistingRating && !editingRatingId ? (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    Bạn đã đánh giá sự kiện này
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => handleEdit(userExistingRating)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Cập nhật
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 space-y-5 border border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Đánh giá của bạn
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setRatingScore(score)}
                        className="group"
                      >
                        <Star
                          className={`w-8 h-8 transition-all duration-200 ${
                            score <= ratingScore
                              ? "fill-amber-400 text-amber-400 scale-110 drop-shadow-sm"
                              : "text-gray-300 group-hover:text-amber-300 group-hover:scale-105"
                          }`}
                        />
                      </button>
                    ))}
                    {ratingScore > 0 && (
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {ratingScore} sao
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận của bạn về sự kiện này..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    rows="4"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting
                      ? editingRatingId
                        ? "Đang cập nhật..."
                        : "Đang gửi..."
                      : editingRatingId
                      ? "Cập nhật đánh giá"
                      : "Gửi đánh giá"}
                  </Button>

                  {editingRatingId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingRatingId(null);
                        setRatingScore(0);
                        setComment("");
                      }}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      Hủy
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-10 bg-amber-50 border border-amber-100 rounded-xl p-5 text-center shadow-sm">
            <p className="text-amber-800 text-sm">
              Hãy <span className="font-semibold">tham gia sự kiện</span> để có thể đánh giá và chia sẻ cảm nhận của bạn!
            </p>
          </div>
        )
      ) : (
        <div className="mb-10 bg-amber-50 border border-amber-100 rounded-xl p-5 text-center shadow-sm">
          <p className="text-amber-800 text-sm">
            Hãy <span className="font-semibold">đăng nhập và tham gia sự kiện</span> để có thể đánh giá và chia sẻ cảm nhận của bạn!
          </p>
        </div>
      )}

      {/* Danh sách đánh giá */}
      <div>
        {(() => {
          const sortedRatings = [...ratings].sort(
            (a, b) => new Date(b.createAt) - new Date(a.createAt)
          );
          const totalPages = Math.ceil(sortedRatings.length / pageSize);
          const startIndex = (currentPage - 1) * pageSize;
          const paginatedRatings = sortedRatings.slice(
            startIndex,
            startIndex + pageSize
          );

          return (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm">Đang tải đánh giá...</p>
                  </div>
                </div>
              ) : ratings.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Chưa có đánh giá nào</p>
                  <p className="text-gray-400 text-sm mt-1">Hãy là người đầu tiên đánh giá sự kiện này!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedRatings.map((rating) => {
                    const isCurrentUser =
                      isAuthenticated &&
                      (rating.userId === user?.userId ||
                        rating.accountId === user?.accountId ||
                        rating.userName === user?.userName ||
                        rating.email === user?.email);

                    return (
                      <div
                        key={rating.ratingId}
                        className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {rating.userName?.[0]?.toUpperCase() || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {rating.userName}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 transition-all ${
                                        i < rating.ratingScore
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {rating.comment && (
                          <p className="text-gray-700 text-sm leading-relaxed mb-3 pl-[52px]">
                            {rating.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 pl-[52px]">
                          {new Date(rating.createAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>
                  <div className="flex items-center gap-1 mx-4">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                              currentPage === page
                                ? "bg-primary text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Xác nhận xóa đánh giá</DialogTitle>
            <DialogDescription className="text-gray-600">
              Hành động này sẽ xóa vĩnh viễn đánh giá của bạn. Bạn có chắc chắn muốn tiếp tục không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="border-gray-200 hover:bg-gray-50"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RatingSection;
