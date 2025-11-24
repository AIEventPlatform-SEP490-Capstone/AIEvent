import React, { useState, useEffect, useMemo } from "react";
import { useCategories } from "../../hooks/useCategories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { showSuccess, showError } from "../../lib/toastUtils";

const EventCategory = () => {
  const {
    categories,
    loading,
    error,
    refreshCategories,
    createNewCategory,
    updateExistingCategory,
    deleteExistingCategory,
    clearCategoriesError,
  } = useCategories();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("eventCategoryName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  // Form data
  const [formData, setFormData] = useState({
    eventCategoryName: "",
  });

  // Filter and sort categories
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter((category) =>
      category.eventCategoryName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    // Sort categories
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [categories, searchTerm, sortBy, sortOrder]);

  // Client-side pagination
  const totalFiltered = filteredAndSortedCategories.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredAndSortedCategories.slice(
    startIndex,
    endIndex
  );

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder, itemsPerPage]);

  // Adjust page if current page becomes empty after delete
  useEffect(() => {
    if (paginatedCategories.length === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [paginatedCategories.length, currentPage]);

  // Reset form data
  const resetForm = () => {
    setFormData({
      eventCategoryName: "",
    });
  };

  // Handle create new category
  const handleCreate = async () => {
    if (!formData.eventCategoryName.trim()) {
      showError("Tên danh mục là bắt buộc");
      return;
    }
    try {
      await createNewCategory({
        eventCategoryName: formData.eventCategoryName,
      });
      await refreshCategories(); // 🔥 Refresh ngay sau khi tạo
      showSuccess("Tạo danh mục sự kiện thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      showError("Lỗi khi tạo danh mục: " + (err.message || "Unknown error"));
      clearCategoriesError();
    }
  };

  // Handle update category
  const handleUpdate = async () => {
    if (!formData.eventCategoryName.trim()) {
      showError("Tên danh mục là bắt buộc");
      return;
    }
    try {
      await updateExistingCategory(selectedCategory.eventCategoryId, {
        eventCategoryName: formData.eventCategoryName,
      });
      showSuccess("Cập nhật danh mục sự kiện thành công!");
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
    } catch (err) {
      showError(
        "Lỗi khi cập nhật danh mục: " + (err.message || "Unknown error")
      );
      clearCategoriesError();
    }
  };

  // Handle delete category
  const handleDelete = async (categoryId) => {
    try {
      await deleteExistingCategory(categoryId);
      showSuccess("Xóa danh mục sự kiện thành công!");
    } catch (err) {
      showError("Lỗi khi xóa danh mục: " + (err.message || "Unknown error"));
      clearCategoriesError();
    }
  };

  // Handle edit category
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      eventCategoryName: category.eventCategoryName || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle view category
  const handleView = (category) => {
    setSelectedCategory(category);
    setIsViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quản lý Danh mục Sự kiện
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các danh mục sự kiện ({filteredAndSortedCategories.length}{" "}
            danh mục)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshCategories} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo danh mục mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo danh mục sự kiện mới</DialogTitle>
                <DialogDescription>Tạo danh mục sự kiện mới</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventCategoryName">Tên danh mục</Label>
                  <Input
                    id="eventCategoryName"
                    value={formData.eventCategoryName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        eventCategoryName: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên danh mục sự kiện"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreate}>Tạo danh mục</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eventCategoryName">Tên danh mục</SelectItem>
                <SelectItem value="eventCategoryId">ID</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="h-10 px-3"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex gap-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-10 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-10 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Items per page */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(parseInt(value))}
          >
            <SelectTrigger className="w-[120px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 / trang</SelectItem>
              <SelectItem value="12">12 / trang</SelectItem>
              <SelectItem value="24">24 / trang</SelectItem>
              <SelectItem value="48">48 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error Display - Improved error handling */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-red-700 text-sm">{error}</div>
          <button 
            onClick={clearCategoriesError}
            className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Categories Display */}
      {paginatedCategories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Plus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm
                  ? "Không tìm thấy danh mục nào"
                  : "Chưa có danh mục sự kiện"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Tạo danh mục sự kiện đầu tiên để bắt đầu"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo danh mục đầu tiên
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Categories Grid/List */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {paginatedCategories.map((category) => (
              <Card
                key={category.eventCategoryId}
                className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:shadow-xl"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                        {category.eventCategoryName}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        ID: {category.eventCategoryId}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Danh mục
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(category)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="h-8 px-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteTargetId(category.eventCategoryId);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, totalFiltered)}{" "}
                  trong {totalFiltered} danh mục
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa danh mục sự kiện</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin danh mục sự kiện
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-eventCategoryName">Tên danh mục</Label>
              <Input
                id="edit-eventCategoryName"
                value={formData.eventCategoryName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventCategoryName: e.target.value,
                  }))
                }
                placeholder="Nhập tên danh mục sự kiện"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedCategory(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdate}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory?.eventCategoryName}</DialogTitle>
            <DialogDescription>
              ID: {selectedCategory?.eventCategoryId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Chi tiết:</h4>
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Tên:</span>
                    <span className="text-sm">
                      {selectedCategory?.eventCategoryName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">ID:</span>
                    <span className="text-sm">
                      {selectedCategory?.eventCategoryId}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirm Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn có chắc muốn xóa?</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Danh mục sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await handleDelete(deleteTargetId);
                setIsDeleteDialogOpen(false);
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCategory;
