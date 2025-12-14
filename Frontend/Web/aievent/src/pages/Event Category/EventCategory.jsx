import React, { useState, useEffect, useMemo } from "react";
import { useCategories } from "../../hooks/useCategories";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertTriangle,
  FolderOpen,
  X,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { showSuccess, showError } from "../../lib/toastUtils";
import { getCategoryStyle } from "../../constants/categoryStyles";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "eventCategoryName", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  const [formData, setFormData] = useState({ eventCategoryName: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter((category) =>
      category.eventCategoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (sortConfig.key === "eventCategoryName") {
        const aValue = (a.eventCategoryName || "").toLowerCase();
        const bValue = (b.eventCategoryName || "").toLowerCase();
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });
    return filtered;
  }, [categories, searchTerm, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const totalFiltered = filteredAndSortedCategories.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredAndSortedCategories.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  useEffect(() => {
    if (paginatedCategories.length === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [paginatedCategories.length, currentPage]);

  const resetForm = () => {
    setFormData({ eventCategoryName: "" });
  };

  const handleCreate = async () => {
    if (isCreating || !formData.eventCategoryName.trim()) return;
    setIsCreating(true);
    try {
      setIsSubmittingCreate(true);
      await createNewCategory({ eventCategoryName: formData.eventCategoryName });
      await refreshCategories();
      showSuccess("Tạo danh mục sự kiện thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      showError("Lỗi khi tạo danh mục: " + (err.message || "Unknown error"));
      clearCategoriesError();
    } finally {
      setIsSubmittingCreate(false);
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.eventCategoryName.trim()) return;
    try {
      setIsSubmittingUpdate(true);
      await updateExistingCategory(selectedCategory.eventCategoryId, {
        eventCategoryName: formData.eventCategoryName,
      });
      showSuccess("Cập nhật danh mục sự kiện thành công!");
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
    } catch (err) {
      showError("Lỗi khi cập nhật danh mục: " + (err.message || "Unknown error"));
      clearCategoriesError();
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (isDeleting) return;
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

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({ eventCategoryName: category.eventCategoryName || "" });
    setIsEditDialogOpen(true);
  };

  const handleView = (category) => {
    setSelectedCategory(category);
    setIsViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-indigo-500/15 to-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 p-8 sm:p-10 shadow-2xl shadow-primary/25">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Quản Lý Danh Mục
                </h1>
                <p className="text-white/80 text-base sm:text-lg max-w-md">
                  Tổ chức và quản lý các danh mục cho sự kiện của bạn
                </p>
              </div>
            </div>
            
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold px-6 rounded-xl"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo Danh Mục Mới
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-primary/10 rounded-lg">
                  <Search className="text-primary h-4 w-4" />
                </div>
                <Input
                  placeholder="Tìm kiếm danh mục theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base transition-all"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => handleSort("eventCategoryName")}
                className="h-12 px-5 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 hover:bg-primary/5 hover:border-primary/30 rounded-xl transition-all"
              >
                <ArrowUpDown className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium">{sortConfig.direction === "asc" ? "A → Z" : "Z → A"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-400 text-sm flex-1">{error}</span>
            <button 
              onClick={clearCategoriesError}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Categories List */}
        <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Danh Sách Danh Mục</h2>
              </div>
              <Badge className="bg-primary/10 text-primary border-0 px-3 py-1.5 text-sm font-medium">
                {totalFiltered} danh mục
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-6">
            {paginatedCategories.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                  <FolderOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? "Không tìm thấy danh mục nào" : "Chưa có danh mục sự kiện"}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchTerm
                    ? "Thử tìm kiếm với từ khóa khác"
                    : "Tạo danh mục sự kiện đầu tiên để bắt đầu"}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo Danh Mục Đầu Tiên
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedCategories.map((category, index) => {
                  const style = getCategoryStyle(category.eventCategoryName);
                  const IconComponent = style.icon;
                  return (
                    <div
                      key={category.eventCategoryId}
                      className="group relative p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Gradient accent */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.gradient}`} />
                      
                      {/* Actions Menu */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-sm hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleView(category)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem Chi Tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
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

                      {/* Content */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate flex-1">
                          {category.eventCategoryName}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, totalFiltered)} trong {totalFiltered} danh mục
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
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
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-9 h-9 p-0 rounded-lg ${
                              currentPage === pageNum 
                                ? "bg-gradient-to-r from-primary to-indigo-600" 
                                : ""
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg"
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

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateDialogOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200/50 dark:border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl shadow-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Tạo Danh Mục Mới</h3>
                </div>
                <button onClick={() => setIsCreateDialogOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tên Danh Mục</Label>
                  <Input
                    value={formData.eventCategoryName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eventCategoryName: e.target.value }))}
                    placeholder="Nhập tên danh mục..."
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">Danh mục sẽ được sử dụng để phân loại sự kiện</p>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="px-5 rounded-xl">
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={isSubmittingCreate || !formData.eventCategoryName.trim()}
                    className="px-6 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-lg hover:shadow-xl transition-all rounded-xl"
                  >
                    {isSubmittingCreate ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo Danh Mục
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Danh Mục</DialogTitle>
            <DialogDescription>Cập nhật thông tin danh mục sự kiện</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên danh mục</Label>
              <Input
                id="edit-name"
                value={formData.eventCategoryName}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventCategoryName: e.target.value }))}
                placeholder="Nhập tên danh mục"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmittingUpdate} className="rounded-xl">
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmittingUpdate} className="rounded-xl bg-gradient-to-r from-primary to-indigo-600">
              {isSubmittingUpdate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmittingUpdate ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCategory?.eventCategoryName}</DialogTitle>
            <DialogDescription>Chi tiết danh mục sự kiện</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Tên danh mục</p>
              <p className="font-medium">{selectedCategory?.eventCategoryName}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="rounded-xl">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Hành động này không thể hoàn tác. Danh mục sẽ bị xóa vĩnh viễn.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await handleDelete(deleteTargetId);
                setIsDeleteDialogOpen(false);
              }}
              disabled={isDeleting}
              className="rounded-xl"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCategory;
