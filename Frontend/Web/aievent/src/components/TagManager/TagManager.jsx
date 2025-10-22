import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, X } from 'lucide-react';
import { useTags } from '../../hooks/useTags';

const TagManager = ({ searchTerm = "", sortConfig = { key: "tagName", direction: "asc" } }) => {
  const {
    tags,
    loading,
    error,
    createNewTag,
    updateExistingTag,
    removeTag,
    refreshTags
  } = useTags();

  const [newTagInput, setNewTagInput] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [editTagInput, setEditTagInput] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter and sort tags
  const processedTags = useMemo(() => {
    // Create a copy of the tags array to avoid mutating the original
    let filtered = [...tags];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tag => 
        (tag.tagName || tag.nameTag || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key] || a.tagName || a.nameTag || "";
      let bValue = b[sortConfig.key] || b.tagName || b.nameTag || "";

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [tags, searchTerm, sortConfig]);

  // Handle adding a new tag
  const handleAddTag = async () => {
    if (newTagInput.trim()) {
      try {
        await createNewTag({ nameTag: newTagInput.trim() });
        setNewTagInput('');
        refreshTags();
      } catch (err) {
        console.error('Error creating tag:', err);
      }
    }
  };

  // Handle deleting a tag
  const handleDeleteTag = async (tagId) => {
    try {
      await removeTag(tagId);
      refreshTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
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
    if (editTagInput.trim() && editingTag) {
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
        refreshTags();
      } catch (err) {
        console.error('Error updating tag:', err);
        // Show error to user
        alert('Error updating tag: ' + (err.message || 'Unknown error'));
      }
    }
  };

  if (loading) {
    return <div>Loading tags...</div>;
  }

  if (error) {
    return <div>Error loading tags: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add new tag input */}
      <div className="flex gap-2">
        <Input
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          placeholder="Nhập tên tag mới..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
          className="flex-1"
        />
        <Button onClick={handleAddTag} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm tag
        </Button>
      </div>

      {/* Display tags */}
      <div className="flex flex-wrap gap-2">
        {processedTags.map((tag) => (
          <Badge 
            key={tag.tagId} 
            variant="secondary" 
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleTagClick(tag)}
          >
            <span>{tag.tagName || tag.nameTag}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the tag click
                handleDeleteTag(tag.tagId);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Tag</DialogTitle>
            <DialogDescription>
              Chỉnh sửa tên của tag sự kiện
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-tag-input" className="text-sm font-medium">
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
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateTag}>
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManager;