import {
  Music,
  Palette,
  Briefcase,
  GraduationCap,
  Heart,
  Utensils,
  Plane,
  Trophy,
  Camera,
  Gamepad2,
  Sparkles,
  Users,
  Mic2,
  Film,
  BookOpen,
  Dumbbell,
  ShoppingBag,
  Landmark,
  Leaf,
  Baby,
  FolderOpen,
} from "lucide-react";

// Danh sách icon và màu sắc cho các danh mục - matching theo từ khóa trong tên
export const categoryStylesMap = [
  { icon: Music, keywords: ["âm nhạc", "nhạc", "music", "ca nhạc", "concert", "hòa nhạc"], gradient: "from-rose-500 to-pink-500", bg: "bg-rose-500" },
  { icon: Palette, keywords: ["nghệ thuật", "art", "hội họa", "triển lãm", "mỹ thuật", "sáng tạo"], gradient: "from-purple-500 to-violet-500", bg: "bg-purple-500" },
  { icon: Briefcase, keywords: ["kinh doanh", "business", "doanh nghiệp", "công ty", "hội nghị", "networking"], gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-500" },
  { icon: GraduationCap, keywords: ["giáo dục", "education", "học", "đào tạo", "workshop", "khóa học", "seminar"], gradient: "from-indigo-500 to-blue-500", bg: "bg-indigo-500" },
  { icon: Heart, keywords: ["từ thiện", "charity", "tình nguyện", "quyên góp", "thiện nguyện"], gradient: "from-pink-500 to-rose-500", bg: "bg-pink-500" },
  { icon: Utensils, keywords: ["ẩm thực", "food", "đồ ăn", "nấu ăn", "nhà hàng", "ăn uống", "cooking"], gradient: "from-orange-500 to-amber-500", bg: "bg-orange-500" },
  { icon: Plane, keywords: ["du lịch", "travel", "tour", "khám phá", "phượt", "trip"], gradient: "from-sky-500 to-blue-500", bg: "bg-sky-500" },
  { icon: Trophy, keywords: ["thể thao", "sport", "giải đấu", "thi đấu", "bóng đá", "chạy bộ", "marathon"], gradient: "from-yellow-500 to-amber-500", bg: "bg-yellow-500" },
  { icon: Camera, keywords: ["nhiếp ảnh", "photo", "chụp ảnh", "photography", "hình ảnh"], gradient: "from-fuchsia-500 to-pink-500", bg: "bg-fuchsia-500" },
  { icon: Gamepad2, keywords: ["trò chơi", "game", "gaming", "esport", "giải trí điện tử"], gradient: "from-emerald-500 to-green-500", bg: "bg-emerald-500" },
  { icon: Sparkles, keywords: ["giải trí", "entertainment", "vui chơi", "lễ hội", "festival", "party", "tiệc"], gradient: "from-violet-500 to-purple-500", bg: "bg-violet-500" },
  { icon: Users, keywords: ["cộng đồng", "community", "giao lưu", "meetup", "offline", "họp mặt"], gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-500" },
  { icon: Mic2, keywords: ["hội thảo", "conference", "talk", "diễn thuyết", "thuyết trình", "speaker"], gradient: "from-red-500 to-rose-500", bg: "bg-red-500" },
  { icon: Film, keywords: ["phim", "movie", "điện ảnh", "cinema", "film", "chiếu phim"], gradient: "from-slate-600 to-slate-500", bg: "bg-slate-600" },
  { icon: BookOpen, keywords: ["văn học", "sách", "book", "đọc sách", "thơ", "viết"], gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-500" },
  { icon: Dumbbell, keywords: ["sức khỏe", "health", "fitness", "gym", "yoga", "thể dục"], gradient: "from-lime-500 to-green-500", bg: "bg-lime-500" },
  { icon: ShoppingBag, keywords: ["mua sắm", "shopping", "sale", "chợ", "hội chợ", "bazaar"], gradient: "from-pink-500 to-fuchsia-500", bg: "bg-pink-500" },
  { icon: Landmark, keywords: ["văn hóa", "culture", "di sản", "lịch sử", "truyền thống", "heritage"], gradient: "from-stone-500 to-stone-400", bg: "bg-stone-500" },
  { icon: Leaf, keywords: ["môi trường", "environment", "xanh", "eco", "thiên nhiên", "bảo vệ"], gradient: "from-green-500 to-emerald-500", bg: "bg-green-500" },
  { icon: Baby, keywords: ["trẻ em", "kids", "children", "gia đình", "family", "thiếu nhi"], gradient: "from-cyan-500 to-teal-500", bg: "bg-cyan-500" },
];

// Style mặc định khi không match được
export const defaultCategoryStyle = { 
  icon: FolderOpen, 
  gradient: "from-slate-500 to-slate-400", 
  bg: "bg-slate-500" 
};

/**
 * Lấy style (icon, gradient, bg) cho danh mục dựa trên tên
 * @param {string} categoryName - Tên danh mục
 * @returns {Object} - { icon, gradient, bg }
 */
export const getCategoryStyle = (categoryName) => {
  if (!categoryName) return defaultCategoryStyle;
  
  const nameLower = categoryName.toLowerCase();
  
  // Tìm style phù hợp dựa trên keywords
  const matchedStyle = categoryStylesMap.find((style) =>
    style.keywords.some((keyword) => nameLower.includes(keyword))
  );
  
  return matchedStyle || defaultCategoryStyle;
};
