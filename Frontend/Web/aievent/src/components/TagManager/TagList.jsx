import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Flame,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// Function to format time difference
const formatTimeAgo = (date) => {
  if (!date) return "Không có thông tin";
  
  const now = new Date();
  const updatedDate = new Date(date);
  const diffInSeconds = Math.floor((now - updatedDate) / 1000);
  
  if (diffInSeconds < 60) {
    return "vừa xong";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} tháng trước`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} năm trước`;
  }
};

const TagList = ({ tags, searchTerm, sortConfig, onEditTag, onDeleteTag, activeFilter = "all" }) => {
  // Filter and sort tags
  const filteredTags = tags
    .filter((tag) => {
      // Apply active filter
      if (activeFilter === "popular") {
        // Show only tags with quantityUsed > 10
        if (tag.quantityUsed <= 10) {
          return false;
        }
      }
      // For "all" or any other filter, show all tags (no additional filtering)
      
      // Apply search term filter
      return (tag.tagName || tag.nameTag || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortConfig.key === "tagName") {
        const aValue = (a.tagName || a.nameTag || "").toLowerCase();
        const bValue = (b.tagName || b.nameTag || "").toLowerCase();
        if (sortConfig.direction === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      return 0;
    });

  // Generate colors for tags based on their ID for consistency
  const getColorFromClass = (tagId) => {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < tagId.length; i++) {
      hash = tagId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a color from the hash (removed green colors)
    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-orange-500",
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTags.map((tag, index) => {
          // Generate color based on tag ID for consistency
          const colorClass = getColorFromClass(tag.tagId);
          
          // Determine if tag is trending (used in more than 50 events)
          const isTrending = tag.quantityUsed > 50;
          
          // Use real quantity from the tag data
          const quantityUsed = tag.quantityUsed || 0;
          
          // Determine last updated time (use updatedDate, fallback to createdDate)
          const lastUpdated = tag.updatedDate || tag.createdDate;
          const timeAgo = formatTimeAgo(lastUpdated);
          
          return (
            <div
              key={tag.tagId}
              className="group relative p-5 rounded-2xl border-2 border-primary/10 bg-gradient-to-br from-card to-card/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Background Gradient Effect */}
              <div className={`absolute inset-0 ${colorClass} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              {/* Trending Badge */}
              {isTrending && (
                <div className="absolute top-3 right-3 z-10">
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-gradient-accent text-white border-0 shadow-lg animate-pulse">
                        <Flame className="h-3 w-3" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Đang thịnh hành</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Actions Menu */}
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <MoreVertical className="h-4 w-4 text-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => onEditTag && onEditTag(tag)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh Sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Eye className="h-4 w-4 mr-2" />
                      Xem Chi Tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive"
                      onClick={() => onDeleteTag && onDeleteTag(tag.tagId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tag Content */}
              <div className="relative space-y-4 mt-2">
                {/* Color Indicator & Name */}
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-lg ${colorClass} shadow-lg group-hover:scale-110 transition-transform`} />
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {tag.tagName || tag.nameTag}
                  </h3>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{quantityUsed}</span>
                    <span>sự kiện</span>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-foreground/70">
                    Cập nhật {timeAgo}
                  </p>
                </div>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
            </div>
          );
        })}

        {filteredTags.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="inline-block p-6 bg-muted/30 rounded-2xl mb-4">
              <Badge className="h-16 w-16 bg-gradient-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Không tìm thấy tag nào phù hợp
            </p>
            <p className="text-sm text-foreground/80">
              Thử tìm kiếm với từ khóa khác hoặc tạo tag mới
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default TagList;