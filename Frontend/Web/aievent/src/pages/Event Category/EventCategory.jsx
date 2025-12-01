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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  FolderOpen,
  X,
  MoreVertical,
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
  const [sortConfig, setSortConfig] = useState({ key: "eventCategoryName", direction: "asc" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Fixed items per page

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
  
  // Loading states for form submissions
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter and sort categories
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter((category) =>
      category.eventCategoryName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    // Sort categories
    filtered.sort((a, b) => {
      if (sortConfig.key === "eventCategoryName") {
        const aValue = (a.eventCategoryName || "").toLowerCase();
        const bValue = (b.eventCategoryName || "").toLowerCase();
        if (sortConfig.direction === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      return 0;
    });

    return filtered;
  }, [categories, searchTerm, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

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
  }, [searchTerm, sortConfig]);

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
    // Prevent multiple submissions
    if (isCreating || !formData.eventCategoryName.trim()) {
      return;
    }
    
    setIsCreating(true);
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
    } finally {
      setIsCreating(false);
    }
  };

  // Handle update category
  const handleUpdate = async () => {
    // Prevent multiple submissions
    if (isUpdating || !formData.eventCategoryName.trim()) {
      return;
    }
    
    setIsUpdating(true);
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
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete category
  const handleDelete = async (categoryId) => {
    // Prevent multiple submissions
    if (isDeleting) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteExistingCategory(categoryId);
      showSuccess("Xóa danh mục sự kiện thành công!");
    } catch (err) {
      showError("Lỗi khi xóa danh mục: " + (err.message || "Unknown error"));
      clearCategoriesError();
    } finally {
      setIsDeleting(false);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Quản Lý Danh Mục Sự Kiện
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản lý và tổ chức các danh mục cho sự kiện của bạn
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo Danh Mục Mới
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="border-primary/10 shadow-lg backdrop-blur-sm bg-card/95 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground h-5 w-5" />
                <Input
                  placeholder="Tìm kiếm danh mục theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-foreground/70"
                />
              </div>

              {/* Sort Button */}
              <Button
                variant="outline"
                onClick={() => handleSort("eventCategoryName")}
                className="flex items-center gap-2 h-12 border-primary/20 hover:bg-primary/5 transition-colors whitespace-nowrap text-foreground"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sắp Xếp
                {sortConfig.key === "eventCategoryName" && (
                  <span className="text-xs text-primary">
                    {sortConfig.direction === "asc" ? "A-Z" : "Z-A"}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories Display */}
        <Card className="border-primary/10 shadow-xl backdrop-blur-sm bg-card/95 animate-scale-in">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Danh Sách Danh Mục
              </h2>
              <Badge variant="secondary" className="px-3 py-1 text-foreground">
                {filteredAndSortedCategories.length} danh mục
              </Badge>
            </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo Danh Mục Mới</DialogTitle>
                <DialogDescription>Nhập tên danh mục sự kiện mới</DialogDescription>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreate();
                      }
                    }}
                    autoFocus
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
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? 'Đang tạo...' : 'Tạo Danh Mục'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start mb-4">
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

            {/* Categories Grid */}
            {paginatedCategories.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block p-6 bg-muted/30 rounded-2xl mb-4">
                  <FolderOpen className="h-16 w-16 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm
                    ? "Không tìm thấy danh mục nào"
                    : "Chưa có danh mục sự kiện"}
                </p>
                <p className="text-sm text-foreground/80 mb-4">
                  {searchTerm
                    ? "Thử tìm kiếm với từ khóa khác hoặc tạo danh mục mới"
                    : "Tạo danh mục sự kiện đầu tiên để bắt đầu"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo Danh Mục Đầu Tiên
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedCategories.map((category, index) => {
                  // Generate color based on category ID for consistency
                  const getColorFromClass = (categoryId) => {
                    let hash = 0;
                    const idStr = categoryId?.toString() || "";
                    for (let i = 0; i < idStr.length; i++) {
                      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    const colors = [
                      "bg-blue-500",
                      "bg-red-500",
                      "bg-yellow-500",
                      "bg-purple-500",
                      "bg-pink-500",
                      "bg-indigo-500",
                      "bg-teal-500",
                      "bg-cyan-500",
                      "bg-orange-500",
                    ];
                    const index = Math.abs(hash) % colors.length;
                    return colors[index];
                  };
                  const colorClass = getColorFromClass(category.eventCategoryId);

                  return (
                    <div
                      key={category.eventCategoryId}
                      className="group relative p-5 rounded-2xl border-2 border-primary/10 bg-gradient-to-br from-card to-card/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in overflow-hidden"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Background Gradient Effect */}
                      <div className={`absolute inset-0 ${colorClass} opacity-5 group-hover:opacity-10 transition-opacity`} />
                      
                      {/* Actions Menu */}
                      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                            >
                              <MoreVertical className="h-4 w-4 text-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleView(category)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem Chi Tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive"
                              onClick={() => {
                                setDeleteTargetId(category.eventCategoryId);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Category Content */}
                      <div className="relative space-y-4 mt-2">
                        {/* Color Indicator & Name */}
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-lg ${colorClass} shadow-lg group-hover:scale-110 transition-transform`} />
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {category.eventCategoryName}
                          </h3>
                        </div>
                      </div>

                      {/* Hover Effect Border */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground/80">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Danh Mục</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin danh mục sự kiện
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
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory?.eventCategoryName}</DialogTitle>
            <DialogDescription>
              Chi tiết danh mục sự kiện
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Thông tin:</h4>
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Tên danh mục:</span>
                    <span className="text-sm">
                      {selectedCategory?.eventCategoryName}
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
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCategory;