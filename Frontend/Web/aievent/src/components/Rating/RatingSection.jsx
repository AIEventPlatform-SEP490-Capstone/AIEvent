import React, { useState, useEffect } from "react";
import {
  Star,
  MessageCircle,
  User,
  MoreHorizontal,
  Pencil,
  Trash2,
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
import { Card, CardHeader, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
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
  const [hasPurchasedTicket, setHasPurchasedTicket] = useState(true); // mặc định true để test
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  //  Kiểm tra user có mua vé event này chưa
  useEffect(() => {
    const checkUserHasTicket = async () => {
      if (!isAuthenticated || !eventId) {
        setHasPurchasedTicket(false);
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
      }
    };
    checkUserHasTicket();
  }, [isAuthenticated, eventId]);

  //  Load danh sách đánh giá
  useEffect(() => {
    if (eventId) refreshRatings();
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
    } catch (error) {
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
    <Card className="mt-8">
      <CardHeader>
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Đánh giá & Nhận xét
        </h3>
      </CardHeader>

      <CardContent>
        {/* Tổng quan */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl font-bold text-primary">{averageRating}</div>
          <div className="flex flex-col">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {ratings.length} lượt đánh giá
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Form đánh giá */}
        {isAuthenticated ? (
          hasPurchasedTicket ? (
            <div className="mb-6 space-y-3">
              {userExistingRating && !editingRatingId ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm flex items-center justify-between">
                  <span>Bạn đã tham gia và đánh giá sự kiện này.</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-blue-600"
                    onClick={() => handleEdit(userExistingRating)}
                  >
                    Cập nhật
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Star
                        key={score}
                        onClick={() => setRatingScore(score)}
                        className={`cursor-pointer w-7 h-7 transition ${
                          score <= ratingScore
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận của bạn về sự kiện..."
                    className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting
                        ? editingRatingId
                          ? "Đang cập nhật..."
                          : "Đang gửi..."
                        : editingRatingId
                        ? "Cập nhật"
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
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-center">
              <p>
                Hãy <span className="font-semibold">tham gia sự kiện</span> để
                có thể đánh giá và chia sẻ cảm nhận của bạn!
              </p>
            </div>
          )
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-center">
            <p>
              Hãy <span className="font-semibold">tham gia sự kiện</span> để có
              thể đánh giá và chia sẻ cảm nhận của bạn!
            </p>
          </div>
        )}

        {/* Danh sách đánh giá */}
        <div className="space-y-4">
          {/*  Sắp xếp & Phân trang */}
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
                  <p className="text-sm text-muted-foreground">
                    Đang tải đánh giá...
                  </p>
                ) : ratings.length === 0 ? (
                  <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-500">
                    <User className="mx-auto mb-2 w-6 h-6 text-gray-400" />
                    <p>Chưa có đánh giá nào cho sự kiện này.</p>
                  </div>
                ) : (
                  paginatedRatings.map((rating) => {
                    const isCurrentUser =
                      isAuthenticated &&
                      (rating.userId === user?.userId ||
                        rating.accountId === user?.accountId ||
                        rating.userName === user?.userName ||
                        rating.email === user?.email);

                    return (
                      <div
                        key={rating.ratingId}
                        className="border rounded-lg p-3 hover:bg-muted/40 transition"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-semibold text-sm">
                              {rating.userName}
                            </p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < rating.ratingScore
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(rating)}
                                >
                                  <Pencil className="w-4 h-4 mr-2" /> Sửa đánh
                                  giá
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(rating)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Xóa đánh
                                  giá
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {rating.comment && (
                          <p className="text-sm text-gray-600">
                            {rating.comment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(rating.createAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    );
                  })
                )}

                {/*  Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Trước
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Trang {currentPage}/{totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa đánh giá</DialogTitle>
              <DialogDescription>
                Hành động này sẽ xóa vĩnh viễn đánh giá của bạn. Bạn có chắc
                chắn muốn tiếp tục không?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RatingSection;
