import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Plus, X, Music, Dumbbell, BookOpen, Utensils, Gamepad2, 
  Briefcase, Heart, Film, Palette, Zap, Users, Trophy,
  Map, Lightbulb, Calendar, Star
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { eventCategoryAPI } from '../../api/eventCategoryAPI';

// Map category names to icons
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  
  const iconMap = {
    'âm nhạc': Music,
    'thể thao': Dumbbell,
    'giáo dục': BookOpen,
    'ẩm thực': Utensils,
    'game': Gamepad2,
    'công việc': Briefcase,
    'sức khỏe': Heart,
    'phim': Film,
    'nghệ thuật': Palette,
    'công nghệ': Zap,
    'xã hội': Users,
    'cuộc thi': Trophy,
    'du lịch': Map,
    'sáng tạo': Lightbulb,
    'sự kiện': Calendar,
    'giải trí': Star,
    'music': Music,
    'sports': Dumbbell,
    'education': BookOpen,
    'food': Utensils,
    'gaming': Gamepad2,
    'work': Briefcase,
    'health': Heart,
    'movie': Film,
    'art': Palette,
    'tech': Zap,
    'social': Users,
    'competition': Trophy,
    'travel': Map,
    'creative': Lightbulb,
  };
  
  // Try exact match first
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (name.includes(key)) {
      return Icon;
    }
  }
  
  // Default icon
  return Calendar;
};

// Category color palettes
const getCategoryColor = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  
  const colorMap = {
    'âm nhạc': 'from-purple-500 to-pink-500',
    'thể thao': 'from-green-500 to-blue-500',
    'giáo dục': 'from-blue-500 to-indigo-500',
    'ẩm thực': 'from-orange-500 to-red-500',
    'game': 'from-pink-500 to-red-500',
    'công việc': 'from-blue-600 to-cyan-500',
    'sức khỏe': 'from-red-500 to-pink-500',
    'phim': 'from-purple-600 to-blue-500',
    'nghệ thuật': 'from-yellow-500 to-pink-500',
    'công nghệ': 'from-indigo-600 to-blue-500',
    'xã hội': 'from-green-500 to-emerald-500',
    'cuộc thi': 'from-yellow-500 to-orange-500',
    'du lịch': 'from-teal-500 to-blue-500',
    'sáng tạo': 'from-pink-500 to-yellow-500',
    'sự kiện': 'from-indigo-500 to-purple-500',
    'giải trí': 'from-purple-500 to-pink-500',
  };
  
  for (const [key, color] of Object.entries(colorMap)) {
    if (name.includes(key)) {
      return color;
    }
  }
  
  return 'from-indigo-500 to-blue-500';
};

const CategorySelector = ({ selectedCategories, onCategoriesChange, className }) => {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load available categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await eventCategoryAPI.getEventCategories(1, 100);
      
      if (response?.isSuccess && response?.data) {
        const categories = response.data.items || response.data || [];
        setAvailableCategories(categories);
      } else if (response?.data) {
        const categories = response.data.items || response.data || [];
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Danh mục sự kiện</h3>
          <p className="text-sm text-muted-foreground">Chọn danh mục phù hợp cho sự kiện của bạn</p>
        </div>
      </div>

      {/* Selected Categories Badge */}
      {selectedCategories.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">
            ✓ Danh mục đã chọn ({selectedCategories.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {selectedCategories.map((category) => {
              const Icon = getCategoryIcon(category.eventCategoryName);
              const colors = getCategoryColor(category.eventCategoryName);
              
              return (
                <div
                  key={category.eventCategoryId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${colors} text-white font-medium text-sm shadow-md hover:shadow-lg transition-all group`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.eventCategoryName}</span>
                  <X
                    className="h-4 w-4 cursor-pointer opacity-70 hover:opacity-100 transition-opacity ml-1"
                    onClick={() => handleRemoveCategory(category.eventCategoryId)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Selection Dropdown */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
            <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>
          </div>
        ) : (
          <Select 
            value={selectedCategories.length > 0 ? selectedCategories[0].eventCategoryId : ''} 
            onValueChange={handleAddCategory}
            disabled={selectedCategories.length > 0}
          >
            <SelectTrigger className={`bg-white dark:bg-slate-950 border-2 rounded-lg h-11 text-base transition-all ${
              selectedCategories.length > 0 
                ? 'border-indigo-300 dark:border-indigo-700 opacity-60 cursor-not-allowed bg-indigo-50 dark:bg-indigo-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}>
              <SelectValue placeholder="Chọn danh mục sự kiện" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-950">
              {selectedCategories.length > 0 ? (
                // Show only the selected category when disabled
                selectedCategories.map((category) => {
                  const Icon = getCategoryIcon(category.eventCategoryName);
                  const colors = getCategoryColor(category.eventCategoryName);
                  
                  return (
                    <SelectItem key={category.eventCategoryId} value={category.eventCategoryId} disabled>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded bg-gradient-to-br ${colors}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold">{category.eventCategoryName}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-2">✓ Đã chọn</span>
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                // Show all available categories when not selected
                availableCategories.length > 0 ? (
                  availableCategories.map((category) => {
                    const Icon = getCategoryIcon(category.eventCategoryName);
                    const colors = getCategoryColor(category.eventCategoryName);
                    
                    return (
                      <SelectItem key={category.eventCategoryId} value={category.eventCategoryId}>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded bg-gradient-to-br ${colors}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span>{category.eventCategoryName}</span>
                        </div>
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Không có danh mục nào
                  </div>
                )
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Empty State Message */}
      {selectedCategories.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <span>ℹ️</span>
            Chưa chọn danh mục nào. Vui lòng chọn ít nhất một danh mục.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
