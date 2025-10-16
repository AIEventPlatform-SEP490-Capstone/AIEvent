import React, { useState, useEffect, useMemo } from "react";
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

const USE_MOCK_DATA = true; // Set to false to use real API
const LARGE_PAGE_SIZE = 1000;

const API_BASE_URL = "https://your-api-endpoint.com/api";

// Mock data
const MOCK_CATEGORIES = [
  {
    eventCategoryId: "47C37D60-164A-4A45-B02D-88AF5560FD1C",
    eventCategoryName: "Âm nhạc",
  },
  {
    eventCategoryId: "1D1BC2D2-A4EA-4CD1-8EF9-DB87A5E97899",
    eventCategoryName: "Education",
  },
  {
    eventCategoryId: "384AF38C-0AE5-4E89-828E-290421517615",
    eventCategoryName: "Sports",
  },
  {
    eventCategoryId: "D53BFEF2-69DD-45B7-8D41-21C1E3011331",
    eventCategoryName: "Technology",
  },
  {
    eventCategoryId: "88D6F9FF-2542-48F0-9603-13FC23ACE929",
    eventCategoryName: "Music",
  },
];

const mockCategoriesData = [...MOCK_CATEGORIES];

// Mock API functions
const mockAPI = {
  getCategories: (page = 1, pageSize = LARGE_PAGE_SIZE) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const items = mockCategoriesData.slice(startIndex, endIndex);
        const totalItems = mockCategoriesData.length;
        const totalPages = Math.ceil(totalItems / pageSize);

        resolve({
          statusCode: "AIE20000",
          message: "EventCategory retrieved successfully",
          data: {
            items,
            totalItems,
            currentPage: page,
            totalPages,
            pageSize,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
          },
        });
      }, 500); // Simulate network delay
    });
  },

  addCategory: (categoryName) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!categoryName.trim()) {
          reject({ message: "Category name is required" });
          return;
        }

        const newCategory = {
          eventCategoryId: `cat-${String(
            mockCategoriesData.length + 1
          ).padStart(3, "0")}`,
          eventCategoryName: categoryName,
        };
        mockCategoriesData.push(newCategory);

        resolve({
          statusCode: "AIE20000",
          message: "Category added successfully",
          data: newCategory,
        });
      }, 500);
    });
  },

  updateCategory: (categoryId, categoryName) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockCategoriesData.findIndex(
          (cat) => cat.eventCategoryId === categoryId
        );

        if (index === -1) {
          reject({ message: "Category not found" });
          return;
        }

        mockCategoriesData[index].eventCategoryName = categoryName;

        resolve({
          statusCode: "AIE20000",
          message: "Category updated successfully",
          data: mockCategoriesData[index],
        });
      }, 500);
    });
  },

  deleteCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockCategoriesData.findIndex(
          (cat) => cat.eventCategoryId === categoryId
        );

        if (index === -1) {
          reject({ message: "Category not found" });
          return;
        }

        mockCategoriesData.splice(index, 1);

        resolve({
          statusCode: "AIE20000",
          message: "Category deleted successfully",
        });
      }, 500);
    });
  },
};

const EventCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Form data
  const [formData, setFormData] = useState({
    eventCategoryName: "",
  });

  // Fetch categories (always fetch all for client-side pagination)
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK_DATA) {
        const result = await mockAPI.getCategories(1, LARGE_PAGE_SIZE);
        if (result.statusCode === "AIE20000") {
          setCategories(result.data.items);
        } else {
          setError(result.message || "Failed to fetch categories");
        }
      } else {
        const response = await fetch(
          `${API_BASE_URL}/event-categories?page=1&pageSize=${LARGE_PAGE_SIZE}`
        );
        const result = await response.json();

        if (result.statusCode === "AIE20000") {
          setCategories(result.data.items);
        } else {
          setError(result.message || "Failed to fetch categories");
        }
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

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

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, []);

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
      let result;
      if (USE_MOCK_DATA) {
        result = await mockAPI.addCategory(formData.eventCategoryName);
      } else {
        const response = await fetch(`${API_BASE_URL}/event-categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventCategoryName: formData.eventCategoryName,
          }),
        });
        result = await response.json();
      }

      if (result.statusCode === "AIE20000") {
        showSuccess("Tạo danh mục sự kiện thành công!");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchCategories();
      } else {
        showError(
          "Lỗi khi tạo danh mục: " + (result.message || "Unknown error")
        );
      }
    } catch (error) {
      showError("Lỗi khi tạo danh mục: " + error.message);
    }
  };

  // Handle update category
  const handleUpdate = async () => {
    if (!formData.eventCategoryName.trim()) {
      showError("Tên danh mục là bắt buộc");
      return;
    }
    try {
      let result;
      if (USE_MOCK_DATA) {
        result = await mockAPI.updateCategory(
          selectedCategory.eventCategoryId,
          formData.eventCategoryName
        );
      } else {
        const response = await fetch(
          `${API_BASE_URL}/event-categories/${selectedCategory.eventCategoryId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventCategoryName: formData.eventCategoryName,
            }),
          }
        );
        result = await response.json();
      }

      if (result.statusCode === "AIE20000") {
        showSuccess("Cập nhật danh mục sự kiện thành công!");
        setIsEditDialogOpen(false);
        setSelectedCategory(null);
        resetForm();
        fetchCategories();
      } else {
        showError(
          "Lỗi khi cập nhật danh mục: " + (result.message || "Unknown error")
        );
      }
    } catch (error) {
      showError("Lỗi khi cập nhật danh mục: " + error.message);
    }
  };

  // Handle delete category
  const handleDelete = async (categoryId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục sự kiện này?")) {
      try {
        let result;
        if (USE_MOCK_DATA) {
          result = await mockAPI.deleteCategory(categoryId);
        } else {
          const response = await fetch(
            `${API_BASE_URL}/event-categories/${categoryId}`,
            {
              method: "DELETE",
            }
          );
          result = await response.json();
        }

        if (result.statusCode === "AIE20000") {
          showSuccess("Xóa danh mục sự kiện thành công!");
          fetchCategories();

          // Adjust page if current page becomes empty
          if (paginatedCategories.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          showError(
            "Lỗi khi xóa danh mục: " + (result.message || "Unknown error")
          );
        }
      } catch (error) {
        showError("Lỗi khi xóa danh mục: " + error.message);
      }
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
          {USE_MOCK_DATA && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Using Mock Data (Test Mode)
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchCategories} size="sm">
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

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
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
                        onClick={() => handleDelete(category.eventCategoryId)}
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
    </div>
  );
};

export default EventCategory;
