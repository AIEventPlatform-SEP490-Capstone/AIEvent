import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { eventCategoryAPI } from '../../api/eventCategoryAPI';

const CategorySelector = ({ selectedCategories, onCategoriesChange, className }) => {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load available categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await eventCategoryAPI.getEventCategories(1, 100);
      console.log('Categories API response:', response);
      
      if (response?.isSuccess && response?.data) {
        const categories = response.data.items || response.data || [];
        console.log('Extracted categories:', categories);
        setAvailableCategories(categories);
      } else if (response?.data) {
        const categories = response.data.items || response.data || [];
        console.log('Direct data categories:', categories);
        setAvailableCategories(categories);
      } else {
        console.warn('Unexpected categories response structure:', response);
        setAvailableCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Không thể tải danh sách danh mục');
      setAvailableCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add category to selection
  const handleAddCategory = (categoryId) => {
    const category = availableCategories.find(cat => cat.eventCategoryId === categoryId);
    if (!category) return;

    const isAlreadySelected = selectedCategories.some(selectedCat => selectedCat.eventCategoryId === categoryId);
    if (!isAlreadySelected) {
      const newCategories = [...selectedCategories, { 
        eventCategoryId: category.eventCategoryId, 
        eventCategoryName: category.eventCategoryName 
      }];
      onCategoriesChange(newCategories);
    }
  };

  // Remove category from selection
  const handleRemoveCategory = (categoryId) => {
    const newCategories = selectedCategories.filter(cat => cat.eventCategoryId !== categoryId);
    onCategoriesChange(newCategories);
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setIsCreating(true);
    try {
      const response = await eventCategoryAPI.createEventCategory({
        eventCategoryName: newCategoryName.trim()
      });

      if (response.isSuccess) {
        toast.success('Tạo danh mục thành công!');
        setNewCategoryName('');
        setIsCreateDialogOpen(false);
        
        // Reload categories and auto-select the new one
        await loadCategories();
        
        // Auto-select the newly created category
        if (response.data) {
          handleAddCategory(response.data.eventCategoryId);
        }
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi tạo danh mục');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo danh mục');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className={`border-l-4 border-l-indigo-500 shadow-xl bg-white ${className}`}>
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-transparent">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Plus className="h-5 w-5 text-white" />
          </div>
          Danh mục sự kiện
        </CardTitle>
        <CardDescription className="text-base">
          Chọn các danh mục phù hợp cho sự kiện của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Danh mục đã chọn:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <Badge 
                  key={category.eventCategoryId} 
                  variant="secondary" 
                  className="flex items-center gap-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                >
                  {category.eventCategoryName}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-600" 
                    onClick={() => handleRemoveCategory(category.eventCategoryId)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <div className="mb-2">
            <Label className="text-sm font-medium">Chọn danh mục:</Label>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Đang tải danh mục...</p>
            </div>
          ) : (
            <Select onValueChange={handleAddCategory}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn danh mục để thêm" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {availableCategories
                  .filter(category => !selectedCategories.some(selected => selected.eventCategoryId === category.eventCategoryId))
                  .map((category) => (
                    <SelectItem key={category.eventCategoryId} value={category.eventCategoryId}>
                      {category.eventCategoryName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedCategories.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Chưa chọn danh mục nào. Vui lòng chọn ít nhất một danh mục.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CategorySelector;
