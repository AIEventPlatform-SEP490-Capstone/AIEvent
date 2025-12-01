import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { X, AlertTriangle } from 'lucide-react';
import { useTags } from '../../hooks/useTags';
import TagList from './TagList';

const TagManager = ({ searchTerm = "", sortConfig = { key: "tagName", direction: "asc" }, userRole = null, activeFilter = "all" }) => {
  const {
    tags,
    loading,
    error,
    updateExistingTag,
    removeTag,
    forceRefreshTags,
    clearTagsError
  } = useTags(userRole);

  // Clear and reload tags when component mounts
  useEffect(() => {
    forceRefreshTags();
  }, []); // Empty dependency array means this runs once on mount

  const [editingTag, setEditingTag] = useState(null);
  const [editTagInput, setEditTagInput] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Add loading state for tag updates
  const [isDeleting, setIsDeleting] = useState(false); // Add loading state for tag deletions

  // Handle deleting a tag
  const handleDeleteTag = async (tagId) => {
    // Prevent multiple submissions
    if (isDeleting) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await removeTag(tagId);
      forceRefreshTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle opening edit dialog by clicking on the tag
  const handleTagClick = (tag) => {
    setEditingTag(tag);
    setEditTagInput(tag.tagName || tag.nameTag || '');
    setIsEditDialogOpen(true);
  };

  // Handle updating a tag
  const handleUpdateTag = async () => {
    // Prevent multiple submissions
    if (isUpdating || !editTagInput.trim() || !editingTag) {
      return;
    }
    
    setIsUpdating(true);
    try {
      // Create a complete tag object with all fields from the original tag
      const tagData = {
        ...editingTag, // Include all original fields
        nameTag: editTagInput.trim(),
        tagName: editTagInput.trim()
      };
      
      // Send the complete tag object for update
      await updateExistingTag(editingTag.tagId, tagData);
      setIsEditDialogOpen(false);
      setEditingTag(null);
      setEditTagInput('');
      forceRefreshTags();
    } catch (err) {
      console.error('Error updating tag:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-foreground">Loading tags...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-red-700 text-sm">{error}</div>
          <button 
            onClick={clearTagsError}
            className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Đóng
          </button>
        </div>
      )}
      
      {/* Tag List */}
      <TagList 
        tags={tags} 
        searchTerm={searchTerm} 
        sortConfig={sortConfig} 
        onEditTag={handleTagClick}
        onDeleteTag={handleDeleteTag}
        activeFilter={activeFilter}
      />

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Chỉnh sửa Tag</DialogTitle>
            <DialogDescription className="text-foreground/80">
              Chỉnh sửa tên của tag sự kiện
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-tag-input" className="text-sm font-medium text-foreground">
                Tên tag
              </label>
              <Input
                id="edit-tag-input"
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                placeholder="Nhập tên tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUpdateTag();
                  }
                }}
                className="text-foreground placeholder:text-foreground/70"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-foreground border-foreground/30">
                Hủy
              </Button>
              <Button onClick={handleUpdateTag} disabled={isUpdating}>
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManager;