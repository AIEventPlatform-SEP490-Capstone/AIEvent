import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Search, ArrowUpDown, Tag, Plus, X } from "lucide-react";
import { useSelector } from "react-redux";
import TagManager from "../../components/TagManager/TagManager";
import { useTags } from "../../hooks/useTags";

const TagManagementPage = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "tagName", direction: "asc" });
  const [activeFilter, setActiveFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const effectiveUserRole = userRole || user?.role;

  const { createNewTag, forceRefreshTags } = useTags(effectiveUserRole);

  const handleCreateTag = async () => {
    if (isCreating || !newTagInput.trim()) return;
    
    setIsCreating(true);
    try {
      await createNewTag({ nameTag: newTagInput.trim() });
      setNewTagInput('');
      setIsCreateDialogOpen(false);
      forceRefreshTags();
    } catch (err) {
      console.error('Error creating tag:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const { items: tags } = useSelector((state) => state.tags);

  const filteredTagsCount = useMemo(() => {
    if (activeFilter === "popular") {
      return tags.filter(tag => tag.quantityUsed > 10).length;
    }
    return tags.length;
  }, [tags, activeFilter]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5">
      <div className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-primary rounded-xl shadow-md">
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quản Lý Tags</h1>
              <p className="text-sm text-muted-foreground">
                Tổ chức tags cho sự kiện của bạn
              </p>
            </div>
          </div>
          <Button 
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-md"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo Tag Mới
          </Button>
        </div>

        {/* Search & Filter */}
        <Card className="border-primary/10 shadow-md bg-card/95">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-primary/20 focus:border-primary text-foreground"
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge 
                  variant={activeFilter === "all" ? "default" : "outline"} 
                  className={`px-3 py-1.5 cursor-pointer transition-all ${
                    activeFilter === "all" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchTerm("");
                  }}
                >
                  Tất Cả
                </Badge>
                <Badge 
                  variant={activeFilter === "popular" ? "default" : "outline"} 
                  className={`px-3 py-1.5 cursor-pointer transition-all ${
                    activeFilter === "popular" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => setActiveFilter("popular")}
                >
                  Phổ Biến
                </Badge>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort("tagName")}
                  className="h-8 px-3 border-primary/20 hover:bg-primary/5"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                  {sortConfig.direction === "asc" ? "A-Z" : "Z-A"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tag List */}
        <Card className="border-primary/10 shadow-lg bg-card/95">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Danh Sách Tags</h2>
              <Badge variant="secondary" className="text-xs">
                {filteredTagsCount} tags
              </Badge>
            </div>
            <TagManager 
              searchTerm={searchTerm} 
              sortConfig={sortConfig} 
              userRole={effectiveUserRole} 
              activeFilter={activeFilter}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-sm border border-border animate-scale-in">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Tạo Tag Mới</h3>
                <button 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-4">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Nhập tên tag..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="text-foreground"
                  autoFocus
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleCreateTag} 
                    disabled={isCreating || !newTagInput.trim()}
                  >
                    {isCreating ? 'Đang tạo...' : 'Tạo'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManagementPage;
