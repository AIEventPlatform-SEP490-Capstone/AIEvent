import React, { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

import { useTags } from '../../hooks/useTags';

const TagSelector = ({ className = '' }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  
  // Use Redux store for tags
  const {
    tags: availableTags,
    selectedTags,
    loading: isLoading,
    error,
    createNewTag,
    refreshTags,
    selectTagForForm,
    unselectTagFromForm,
    clearTagsError
  } = useTags();

  // Clear error when component mounts
  React.useEffect(() => {
    if (error) {
      toast.error(`Lỗi tải tags: ${error}`);
      clearTagsError();
    }
  }, [error]);

  // Force component update when tags change
  React.useEffect(() => {
    console.log('Available tags updated:', availableTags.length, availableTags);
  }, [availableTags]);

  // Add tag to selection using Redux
  const handleAddTag = (tag) => {
    selectTagForForm(tag);
  };

  // Remove tag from selection using Redux
  const handleRemoveTag = (tagId) => {
    unselectTagFromForm(tagId);
  };

  // Create new tag using Redux
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tên tag không được để trống');
      return;
    }

    try {
      const result = await createNewTag({ nameTag: newTagName.trim() });
      
      if (result.meta.requestStatus === 'fulfilled') {
        const newTag = result.payload;
        toast.success('Tạo tag thành công!');
        setNewTagName('');
        setIsCreateDialogOpen(false);
        
        // Refresh tags để đảm bảo tag mới hiển thị
        setTimeout(() => {
          refreshTags();
        }, 500);
      } else {
        toast.error('Không thể tạo tag. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Có lỗi xảy ra khi tạo tag');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Tags sự kiện
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Tags đã chọn:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTags.map((tag) => (
                <Badge key={tag.tagId} variant="secondary" className="flex items-center gap-1">
                  {tag.tagName}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag.tagId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Tags có sẵn:</Label>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Tạo tag mới
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Tạo tag mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newTagName">Tên tag</Label>
                    <Input
                      id="newTagName"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nhập tên tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateTag();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setNewTagName('');
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateTag}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Đang tạo...' : 'Tạo tag'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Đang tải tags...</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto" key={`tags-${availableTags.length}`}>
              {availableTags
                .filter(tag => !selectedTags.some(selectedTag => selectedTag.tagId === tag.tagId))
                .map((tag) => (
                  <Badge
                    key={`${tag.tagId}-${tag.tagName || tag.nameTag}`}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag.tagName || tag.nameTag}
                  </Badge>
                ))}
              {availableTags.filter(tag => !selectedTags.some(selectedTag => selectedTag.tagId === tag.tagId)).length === 0 && (
                <p className="text-sm text-muted-foreground">Không có tags nào khả dụng</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TagSelector;
