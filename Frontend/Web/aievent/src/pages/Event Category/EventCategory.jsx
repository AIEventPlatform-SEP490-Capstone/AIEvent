import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const USE_MOCK_DATA = true; // Set to false to use real API

// Mock data
const MOCK_CATEGORIES = [
  { eventCategoryId: "cat-001", eventCategoryName: "Hội nghị công nghệ" },
  { eventCategoryId: "cat-002", eventCategoryName: "Sự kiện âm nhạc" },
  { eventCategoryId: "cat-003", eventCategoryName: "Triển lãm nghệ thuật" },
  { eventCategoryId: "cat-004", eventCategoryName: "Hội thảo kinh doanh" },
  { eventCategoryId: "cat-005", eventCategoryName: "Sự kiện thể thao" },
  { eventCategoryId: "cat-006", eventCategoryName: "Workshop giáo dục" },
  { eventCategoryId: "cat-007", eventCategoryName: "Lễ hội văn hóa" },
  { eventCategoryId: "cat-008", eventCategoryName: "Networking event" },
  { eventCategoryId: "cat-009", eventCategoryName: "Sự kiện từ thiện" },
  { eventCategoryId: "cat-010", eventCategoryName: "Hội chợ thương mại" },
  { eventCategoryId: "cat-011", eventCategoryName: "Buổi ra mắt sản phẩm" },
  { eventCategoryId: "cat-012", eventCategoryName: "Sự kiện ẩm thực" },
];

const mockCategoriesData = [...MOCK_CATEGORIES];

// Mock API functions
const mockAPI = {
  getCategories: (page = 1, pageSize = 5) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const items = mockCategoriesData.slice(startIndex, endIndex);
        const totalItems = mockCategoriesData.length;
        const totalPages = Math.ceil(totalItems / pageSize);

        resolve({
          statusCode: "AIE20000",
          message: "Success",
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

export default function EventCategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 5,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  // API Base URL - Replace with your actual API endpoint
  const API_BASE_URL = "https://your-api-endpoint.com/api";

  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);

      if (USE_MOCK_DATA) {
        const result = await mockAPI.getCategories(page, pagination.pageSize);
        setCategories(result.data.items);
        setPagination({
          currentPage: result.data.currentPage,
          totalPages: result.data.totalPages,
          totalItems: result.data.totalItems,
          pageSize: result.data.pageSize,
          hasPreviousPage: result.data.hasPreviousPage,
          hasNextPage: result.data.hasNextPage,
        });
      } else {
        const response = await fetch(
          `${API_BASE_URL}/event-categories?page=${page}&pageSize=${pagination.pageSize}`
        );
        const result = await response.json();

        if (result.statusCode === "AIE20000") {
          setCategories(result.data.items);
          setPagination({
            currentPage: result.data.currentPage,
            totalPages: result.data.totalPages,
            totalItems: result.data.totalItems,
            pageSize: result.data.pageSize,
            hasPreviousPage: result.data.hasPreviousPage,
            hasNextPage: result.data.hasNextPage,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch categories",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      if (USE_MOCK_DATA) {
        await mockAPI.addCategory(categoryName);
        toast({
          title: "Success",
          description: "Category added successfully",
        });
        setIsAddModalOpen(false);
        setCategoryName("");
        fetchCategories(pagination.currentPage);
      } else {
        const response = await fetch(`${API_BASE_URL}/event-categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventCategoryName: categoryName,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          toast({
            title: "Success",
            description: "Category added successfully",
          });
          setIsAddModalOpen(false);
          setCategoryName("");
          fetchCategories(pagination.currentPage);
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to add category",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      if (USE_MOCK_DATA) {
        await mockAPI.updateCategory(
          editingCategory.eventCategoryId,
          categoryName
        );
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
        setIsEditModalOpen(false);
        setCategoryName("");
        setEditingCategory(null);
        fetchCategories(pagination.currentPage);
      } else {
        const response = await fetch(
          `${API_BASE_URL}/event-categories/${editingCategory.eventCategoryId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventCategoryName: categoryName,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          toast({
            title: "Success",
            description: "Category updated successfully",
          });
          setIsEditModalOpen(false);
          setCategoryName("");
          setEditingCategory(null);
          fetchCategories(pagination.currentPage);
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to update category",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      setSubmitting(true);

      if (USE_MOCK_DATA) {
        await mockAPI.deleteCategory(deletingCategory.eventCategoryId);
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setDeletingCategory(null);

        // If current page becomes empty after delete, go to previous page
        if (categories.length === 1 && pagination.currentPage > 1) {
          fetchCategories(pagination.currentPage - 1);
        } else {
          fetchCategories(pagination.currentPage);
        }
      } else {
        const response = await fetch(
          `${API_BASE_URL}/event-categories/${deletingCategory.eventCategoryId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          toast({
            title: "Success",
            description: "Category deleted successfully",
          });
          setIsDeleteDialogOpen(false);
          setDeletingCategory(null);

          // If current page becomes empty after delete, go to previous page
          if (categories.length === 1 && pagination.currentPage > 1) {
            fetchCategories(pagination.currentPage - 1);
          } else {
            fetchCategories(pagination.currentPage);
          }
        } else {
          const result = await response.json();
          toast({
            title: "Error",
            description: result.message || "Failed to delete category",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (category) => {
    setEditingCategory(category);
    setCategoryName(category.eventCategoryName);
    setIsEditModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Pagination handlers
  const goToPage = (page) => {
    fetchCategories(page);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Event Category Management
        </h1>
        <p className="text-muted-foreground">
          Manage your event categories - add, edit, or remove categories
        </p>
        {USE_MOCK_DATA && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Using Mock Data (Test Mode)
          </div>
        )}
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          Total: {pagination.totalItems} categories
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">No.</TableHead>
              <TableHead>Category ID</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No categories found. Add your first category to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category, index) => (
                <TableRow key={category.eventCategoryId}>
                  <TableCell className="font-medium">
                    {(pagination.currentPage - 1) * pagination.pageSize +
                      index +
                      1}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {category.eventCategoryId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.eventCategoryName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(category)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(category)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && categories.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new event category. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-category-name">Category Name</Label>
              <Input
                id="add-category-name"
                placeholder="Enter category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) {
                    handleAddCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setCategoryName("");
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={submitting}>
              {submitting ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                placeholder="Enter category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) {
                    handleUpdateCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setCategoryName("");
                setEditingCategory(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={submitting}>
              {submitting ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category "{deletingCategory?.eventCategoryName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingCategory(null);
              }}
              disabled={submitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
