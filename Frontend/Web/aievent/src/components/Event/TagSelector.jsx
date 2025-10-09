import React, { useState, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { showSuccess, showError } from '../../lib/toastUtils';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

import { tagAPI } from '../../api/tagAPI';

const TagSelector = ({ selectedTags = [], onTagsChange = () => {}, className = '' }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Load available tags
  useEffect(() => {
    try {
      loadTags();
    } catch (error) {
      console.error('Error in TagSelector useEffect:', error);
      showError('Có lỗi xảy ra khi tải TagSelector');
    }
  }, []);

  const loadTags = async () => {
    console.log('Loading tags...');
    setIsLoading(true);
    try {
      const response = await tagAPI.getTags(1, 100);
      console.log('Tags API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response.data:', response?.data);
      console.log('Response.isSuccess:', response?.isSuccess);
      
      // Since isSuccess is undefined, check if we have data
      if (response?.data) {
        const tags = response.data.items || response.data || [];
        console.log('Extracted tags:', tags);
        console.log('Setting available tags to:', tags);
        setAvailableTags(tags);
      } else {
        console.warn('No data in tags response:', response);
        setAvailableTags([]);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      showError('Không thể tải danh sách tags');
      setAvailableTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add tag to selection
  const handleAddTag = (tag) => {
    console.log('Adding tag:', tag);
    const isAlreadySelected = selectedTags.some(selectedTag => selectedTag.tagId === tag.tagId);
    if (!isAlreadySelected) {
      const newTags = [...selectedTags, { 
        tagId: tag.tagId, 
        tagName: tag.tagName || tag.nameTag // Handle both possible property names
      }];
      onTagsChange(newTags);
    }
  };

  // Remove tag from selection
  const handleRemoveTag = (tagId) => {
    const newTags = selectedTags.filter(tag => tag.tagId !== tagId);
    onTagsChange(newTags);
  };

  // Create new tag
  const handleCreateTag = async () => {
    console.log('=== CREATING NEW TAG ===');
    console.log('Tag name:', newTagName.trim());
    
    if (!newTagName.trim()) {
      showError('Vui lòng nhập tên tag');
      return;
    }

    setIsCreatingTag(true);
    try {
      console.log('Calling tagAPI.createTag...');
      const response = await tagAPI.createTag({ nameTag: newTagName.trim() });
      console.log('Create tag response:', response);
      if (response && response.data) {
        showSuccess('Tạo tag thành công!');
        setNewTagName('');
        setIsCreateDialogOpen(false);
        
        // Reload tags and auto-select the new one
        console.log('Reloading tags after creation...');
        await loadTags();
        
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Auto-select the newly created tag
        console.log('Response data:', response.data);
        if (response.data && response.data.tagId) {
          const newTag = { 
            tagId: response.data.tagId, 
            tagName: response.data.nameTag || response.data.tagName 
          };
          console.log('New tag to add:', newTag);
          console.log('Current selected tags before adding:', selectedTags);
          
          const isAlreadySelected = selectedTags.some(selectedTag => selectedTag.tagId === newTag.tagId);
          if (!isAlreadySelected) {
            const newTags = [...selectedTags, newTag];
            console.log('About to call onTagsChange with:', newTags);
            onTagsChange(newTags);
            
            // Verify the change was applied
            setTimeout(() => {
              console.log('Selected tags after change should be:', newTags);
            }, 200);
          } else {
            console.log('Tag already selected');
          }
        } else {
          console.log('No tagId in response data');
          console.log('Available response properties:', Object.keys(response.data || {}));
        }
      } else {
        showError(response.message || 'Có lỗi xảy ra khi tạo tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      showError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  try {
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
                      disabled={isCreatingTag}
                    >
                      {isCreatingTag ? 'Đang tạo...' : 'Tạo tag'}
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
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableTags
                .filter(tag => !selectedTags.some(selectedTag => selectedTag.tagId === tag.tagId))
                .map((tag) => (
                  <Badge
                    key={tag.tagId}
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
  } catch (error) {
    console.error('Error rendering TagSelector:', error);
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-red-500">Có lỗi xảy ra khi hiển thị TagSelector</p>
        </CardContent>
      </Card>
    );
  }
};

export default TagSelector;
