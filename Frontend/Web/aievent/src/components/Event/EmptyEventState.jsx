import { Plus, Filter, Calendar, Search, FolderOpen, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const EmptyEventState = ({ 
  type = 'no-events',
  categoryName = '',
  onCreateEvent,
  onClearFilters,
  showCreateButton = true
}) => {
  const configs = {
    'no-events': {
      icon: Calendar,
      iconBg: 'from-indigo-500 to-purple-600',
      title: 'Chưa có sự kiện nào',
      description: 'Bắt đầu tạo sự kiện đầu tiên của bạn ngay bây giờ!',
      suggestions: [
        'Tạo sự kiện mới để bắt đầu',
        'Khám phá các mẫu sự kiện có sẵn',
        'Xem hướng dẫn tạo sự kiện hiệu quả'
      ]
    },
    'no-results': {
      icon: Search,
      iconBg: 'from-amber-500 to-orange-600',
      title: 'Không tìm thấy kết quả',
      description: 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc',
      suggestions: [
        'Kiểm tra lại từ khóa tìm kiếm',
        'Xóa bộ lọc ngày tháng',
        'Thử tìm kiếm với từ khóa khác'
      ]
    },
    'no-category': {
      icon: FolderOpen,
      iconBg: 'from-emerald-500 to-teal-600',
      title: `Không có sự kiện "${categoryName}"`,
      description: 'Hiện tại không có sự kiện nào trong danh mục này',
      suggestions: [
        'Xem tất cả sự kiện',
        'Tạo sự kiện mới',
        'Kiểm tra các danh mục khác'
      ]
    }
  };

  const config = configs[type] || configs['no-events'];
  const IconComponent = config.icon;

  return (
    <div className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/50 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-slate-500/10 dark:shadow-black/20">
        {/* Animated Icon */}
        <div className="relative inline-flex mb-8">
          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-r ${config.iconBg} rounded-3xl blur-2xl opacity-30 animate-pulse`} />
          
          {/* Icon container */}
          <div className={`relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br ${config.iconBg} rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300`}>
            <IconComponent className="w-12 h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
          </div>
          
          {/* Sparkle decoration */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
          {config.title}
        </h3>
        
        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto text-base md:text-lg leading-relaxed">
          {config.description}
        </p>

        {/* Suggestions */}
        <div className="mb-10">
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-4 font-medium uppercase tracking-wider">
            Gợi ý cho bạn
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {config.suggestions.map((suggestion, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 text-slate-700 dark:text-slate-300 text-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-default"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                {suggestion}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          {showCreateButton && onCreateEvent && (
            <Button
              onClick={onCreateEvent}
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] hover:bg-right text-white shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-purple-500/40 rounded-2xl px-8 py-3 h-auto font-semibold text-base transition-all duration-500"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Tạo sự kiện mới
              </span>
            </Button>
          )}
          
          {type === 'no-results' && onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="group rounded-2xl px-8 py-3 h-auto font-semibold text-base border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-300"
            >
              <Filter className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyEventState;
