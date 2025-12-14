import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Search, ArrowUpDown, Tag, Plus, X, Sparkles, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-indigo-500/15 to-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 p-8 sm:p-10 shadow-2xl shadow-primary/25">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <Tag className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Quản Lý Tags
                  </h1>
                </div>
                <p className="text-white/80 text-base sm:text-lg max-w-md">
                  Tổ chức và quản lý tags để phân loại sự kiện một cách hiệu quả
                </p>
              </div>
            </div>
            
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold px-6 rounded-xl"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo Tag Mới
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-primary/10 rounded-lg">
                  <Search className="text-primary h-4 w-4" />
                </div>
                <Input
                  placeholder="Tìm kiếm tag theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1.5 gap-1">
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setSearchTerm("");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeFilter === "all"
                        ? "bg-white dark:bg-slate-700 text-primary shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tất Cả
                  </button>
                  <button
                    onClick={() => setActiveFilter("popular")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      activeFilter === "popular"
                        ? "bg-white dark:bg-slate-700 text-primary shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Phổ Biến
                  </button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleSort("tagName")}
                  className="h-11 px-4 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 hover:bg-primary/5 hover:border-primary/30 rounded-xl transition-all"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">{sortConfig.direction === "asc" ? "A → Z" : "Z → A"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tag List */}
        <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-lg">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Danh Sách Tags</h2>
              </div>
              <Badge className="bg-primary/10 text-primary border-0 px-3 py-1.5 text-sm font-medium">
                {filteredTagsCount} tags
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <TagManager 
              searchTerm={searchTerm} 
              sortConfig={sortConfig} 
              userRole={effectiveUserRole} 
              activeFilter={activeFilter}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog - Modern Modal */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateDialogOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200/50 dark:border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Gradient */}
            <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
            
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl shadow-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Tạo Tag Mới</h3>
                </div>
                <button 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tên Tag</label>
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Nhập tên tag..."
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Tag sẽ được sử dụng để phân loại và tìm kiếm sự kiện
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="px-5 rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleCreateTag} 
                    disabled={isCreating || !newTagInput.trim()}
                    className="px-6 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-lg hover:shadow-xl transition-all rounded-xl"
                  >
                    {isCreating ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo Tag
                      </>
                    )}
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
