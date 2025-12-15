import { Calendar, Clock, CalendarDays, CalendarRange, RotateCcw } from 'lucide-react';

const QuickFilterChips = ({ 
  onFilterChange, 
  activeFilter = null,
  startDate,
  endDate 
}) => {
  const today = new Date();
  
  const getDateRange = (filter) => {
    const start = new Date(today);
    const end = new Date(today);
    
    switch (filter) {
      case 'today':
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      case 'this-week':
        const dayOfWeek = start.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start.setDate(start.getDate() + diffToMonday);
        end.setDate(start.getDate() + 6);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      case 'this-month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      case 'next-month':
        start.setMonth(start.getMonth() + 1);
        start.setDate(1);
        end.setMonth(end.getMonth() + 2);
        end.setDate(0);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
      default:
        return { start: '', end: '' };
    }
  };

  const handleFilterClick = (filter) => {
    if (activeFilter === filter) {
      onFilterChange({ start: '', end: '' }, null);
    } else {
      const range = getDateRange(filter);
      onFilterChange(range, filter);
    }
  };

  const filters = [
    { id: 'today', label: 'Hôm nay', icon: Clock, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'this-week', label: 'Tuần này', icon: Calendar, gradient: 'from-indigo-500 to-purple-500' },
    { id: 'this-month', label: 'Tháng này', icon: CalendarDays, gradient: 'from-violet-500 to-pink-500' },
    { id: 'next-month', label: 'Tháng sau', icon: CalendarRange, gradient: 'from-amber-500 to-orange-500' },
  ];

  const hasActiveFilter = startDate || endDate;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
        Lọc nhanh
      </span>
      
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const IconComponent = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`
                group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-300 overflow-hidden
                ${isActive 
                  ? 'text-white shadow-lg scale-[1.02]' 
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md hover:scale-[1.02]'
                }
              `}
            >
              {/* Active gradient background */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${filter.gradient}`} />
              )}
              
              {/* Hover gradient overlay for inactive */}
              {!isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${filter.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              )}
              
              <span className="relative z-10 flex items-center gap-2">
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : ''} group-hover:scale-110 transition-transform duration-200`} />
                {filter.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              )}
            </button>
          );
        })}
        
        {hasActiveFilter && (
          <button
            onClick={() => onFilterChange({ start: '', end: '' }, null)}
            className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-500" />
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickFilterChips;
