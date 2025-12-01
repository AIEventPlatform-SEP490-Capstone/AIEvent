import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Search, ArrowUpDown, Tag, Plus, TrendingUp, Hash, X } from "lucide-react";
import { useSelector } from "react-redux";
import TagManager from "../../components/TagManager/TagManager";
import { useTags } from "../../hooks/useTags"; // Add this import

const TagManagementPage = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "tagName", direction: "asc" });
  const [activeFilter, setActiveFilter] = useState("all"); // "all" or "popular"
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Get user role from auth state if not passed as prop
  const { user } = useSelector((state) => state.auth);
  const effectiveUserRole = userRole || user?.role;

  // Get tags hook for creating new tags
  const { createNewTag, forceRefreshTags } = useTags(effectiveUserRole); // Add this hook

  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (newTagInput.trim()) {
      try {
        await createNewTag({ nameTag: newTagInput.trim() });
        setNewTagInput('');
        setIsCreateDialogOpen(false);
        forceRefreshTags();
      } catch (err) {
        console.error('Error creating tag:', err);
      }
    }
  };

  // Get tags from Redux store
  const { items: tags } = useSelector((state) => state.tags);

  // Calculate real statistics from tags data
  const stats = useMemo(() => {
    const totalTags = tags.length;
    const activeTags = tags.filter(tag => tag.quantityUsed > 0).length;
    const popularTags = tags.filter(tag => tag.quantityUsed > 10).length; // Tags used in more than 10 events
    
    // Calculate percentage changes (mocked for now as we don't have historical data)
    const totalTagsChange = "";
    const activeTagsChange = "";
    const popularTagsChange = "";

    return [
      {
        title: "Tổng Tags",
        value: totalTags.toString(),
        change: totalTagsChange,
        trend: "",
        icon: Hash,
      },
      {
        title: "Tags Đang Hoạt Động",
        value: activeTags.toString(),
        change: activeTagsChange,
        trend: "",
        icon: Tag,
      },
      {
        title: "Tags Phổ Biến",
        value: popularTags.toString(),
        change: popularTagsChange,
        trend: "",
        icon: TrendingUp,
      },
    ];
  }, [tags]);

  // Calculate filtered tags count for display
  const filteredTagsCount = useMemo(() => {
    if (activeFilter === "popular") {
      return tags.filter(tag => tag.quantityUsed > 10).length;
    }
    // For "all" filter, show total count
    return tags.length;
  }, [tags, activeFilter]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Quản Lý Tags
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản lý và tổ chức các tags cho sự kiện của bạn
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo Tag Mới
            </Button>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
              <Tag className="h-4 w-4 mr-2 text-primary" />
              Tạo tag mới để sử dụng cho sự kiện
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-scale-in">
          {stats.map((stat, index) => (
            <Card key={index} className="border-primary/10 shadow-lg backdrop-blur-sm bg-card/95 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-primary rounded-lg shadow-md group-hover:scale-110 transition-transform">
                    {React.createElement(stat.icon, { className: "h-6 w-6 text-white drop-shadow-md" })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter Section */}
        <Card className="border-primary/10 shadow-lg backdrop-blur-sm bg-card/95 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground h-5 w-5" />
                <Input
                  placeholder="Tìm kiếm tag theo tên, mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-foreground/70"
                />
              </div>

              {/* Filter Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={activeFilter === "all" ? "secondary" : "outline"} 
                  className={`px-4 py-2 cursor-pointer transition-colors text-foreground ${activeFilter === "all" ? "bg-primary/10 hover:bg-primary/20 border-primary" : "border-foreground/30 hover:bg-primary/5"}`}
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchTerm(""); // Clear search term when "All" is clicked
                  }}
                >
                  Tất Cả
                </Badge>
                <Badge 
                  variant={activeFilter === "popular" ? "secondary" : "outline"} 
                  className={`px-4 py-2 cursor-pointer transition-colors text-foreground ${activeFilter === "popular" ? "bg-primary/10 hover:bg-primary/20 border-primary" : "border-foreground/30 hover:bg-primary/5"}`}
                  onClick={() => setActiveFilter("popular")}
                >
                  Phổ Biến
                </Badge>
              </div>

              {/* Sort Button */}
              <Button
                variant="outline"
                onClick={() => handleSort("tagName")}
                className="flex items-center gap-2 h-12 border-primary/20 hover:bg-primary/5 transition-colors whitespace-nowrap text-foreground"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sắp Xếp
                {sortConfig.key === "tagName" && (
                  <span className="text-xs text-primary">
                    {sortConfig.direction === "asc" ? "A-Z" : "Z-A"}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tag Manager Component */}
        <Card className="border-primary/10 shadow-xl backdrop-blur-sm bg-card/95 animate-scale-in">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Danh Sách Tags
              </h2>
              <Badge variant="secondary" className="px-3 py-1 text-foreground">
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

      {/* Create Tag Dialog */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity ${isCreateDialogOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-background rounded-xl shadow-2xl w-full max-w-md border border-foreground/10 overflow-hidden animate-scale-in">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Tạo Tag Mới</h3>
              <button 
                onClick={() => setIsCreateDialogOpen(false)}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-tag-input" className="text-sm font-medium text-foreground">
                  Tên tag
                </label>
                <Input
                  id="new-tag-input"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Nhập tên tag mới..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="text-foreground placeholder:text-foreground/70"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="text-foreground border-foreground/30"
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateTag}>
                  Tạo Tag
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManagementPage;