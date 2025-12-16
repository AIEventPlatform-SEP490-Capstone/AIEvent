import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutGrid, 
  Edit, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Flag,
  X
} from 'lucide-react';

const RadialStatusMenu = ({ 
  activeTab, 
  onTabChange, 
  stats = {},
  showDraft = true,
  showFlagged = false,
  EventStatus 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Update position when menu opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width / 2
      });
      // Trigger expand animation after a small delay
      const timer = setTimeout(() => setExpanded(true), 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        handleClose();
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setExpanded(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Define status items
  const statusItems = [
    {
      id: 'all',
      label: 'Tất cả',
      icon: LayoutGrid,
      bgColor: '#6366f1',
      count: stats.total || 0,
    },
    ...(showDraft ? [{
      id: 'draft',
      label: 'Bản nháp',
      icon: Edit,
      bgColor: '#64748b',
      count: stats.draft || 0,
    }] : []),
    {
      id: EventStatus?.PendingApproval,
      label: 'Chờ duyệt',
      icon: Clock,
      bgColor: '#f59e0b',
      count: stats.pendingApproval || 0,
    },
    {
      id: EventStatus?.Approved,
      label: 'Đã duyệt',
      icon: CheckCircle,
      bgColor: '#10b981',
      count: stats.approved || 0,
    },
    {
      id: EventStatus?.Rejected,
      label: 'Từ chối',
      icon: XCircle,
      bgColor: '#ef4444',
      count: stats.rejected || 0,
    },
    {
      id: EventStatus?.Cancelled,
      label: 'Đã hủy',
      icon: X,
      bgColor: '#6b7280',
      count: stats.cancelled || 0,
    },
    {
      id: EventStatus?.WaitingForPayout,
      label: 'Chờ thanh toán',
      icon: Clock,
      bgColor: '#3b82f6',
      count: stats.waitingForPayout || 0,
    },
    {
      id: EventStatus?.PaidOut,
      label: 'Đã thanh toán',
      icon: CheckCircle,
      bgColor: '#06b6d4',
      count: stats.paidOut || 0,
    },
    {
      id: EventStatus?.ErrorPayment,
      label: 'Lỗi thanh toán',
      icon: AlertTriangle,
      bgColor: '#f97316',
      count: stats.errorPayment || 0,
    },
    ...(showFlagged ? [{
      id: 'flagged',
      label: 'Gán cờ',
      icon: Flag,
      bgColor: '#f43f5e',
      count: stats.flagged || 0,
    }] : []),
  ].filter(item => item.id);

  const activeItem = statusItems.find(item => item.id === activeTab) || statusItems[0];
  const itemCount = statusItems.length;

  // Calculate position for each item in a circle
  const getItemPosition = (index, total, radius) => {
    const angleStep = 360 / total;
    const angle = -90 + (index * angleStep);
    const angleRad = (angle * Math.PI) / 180;
    
    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
      angle: angle, // Store angle for tooltip positioning
    };
  };

  // Calculate tooltip position based on item angle
  const getTooltipPosition = (angle) => {
    // Determine which side to show tooltip based on angle
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    if (normalizedAngle >= 315 || normalizedAngle < 45) {
      // Top - show tooltip above
      return { x: 0, y: -45, align: 'center' };
    } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
      // Right - show tooltip to the right
      return { x: 50, y: 0, align: 'left' };
    } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
      // Bottom - show tooltip below
      return { x: 0, y: 45, align: 'center' };
    } else {
      // Left - show tooltip to the left
      return { x: -50, y: 0, align: 'right' };
    }
  };

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    handleClose();
  };

  const expandedRadius = 70;
  const ActiveIcon = activeItem.icon;

  // Render radial menu using Portal
  const renderRadialMenu = () => {
    if (!isOpen) return null;

    return createPortal(
      <div 
        ref={menuRef}
        className="fixed"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          transform: 'translate(-50%, -50%)',
          width: '180px',
          height: '180px',
          pointerEvents: 'none',
          zIndex: 99999,
        }}
      >
        {/* Ripple background */}
        <div 
          className="absolute rounded-full"
          style={{
            top: '50%',
            left: '50%',
            width: expanded ? '160px' : '0px',
            height: expanded ? '160px' : '0px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
            zIndex: 99998,
          }}
        />

        {statusItems.map((item, index) => {
          const pos = getItemPosition(index, itemCount, expandedRadius);
          const isActive = activeTab === item.id;
          const isHovered = hoveredItem === item.id;
          const IconComponent = item.icon;
          const delay = index * 40; // Stagger delay
          const tooltipPos = getTooltipPosition(pos.angle + 90); // Adjust angle for tooltip
          
          return (
            <div key={item.id} className="absolute" style={{ top: '50%', left: '50%' }}>
              <button
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`absolute flex items-center justify-center rounded-full shadow-lg ${isActive ? 'ring-2 ring-white ring-offset-2' : ''}`}
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: item.bgColor,
                  top: 0,
                  left: 0,
                  transform: expanded 
                    ? `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${isHovered ? 1.2 : 1})`
                    : 'translate(-50%, -50%) scale(0)',
                  transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${expanded ? delay : (itemCount - index) * 25}ms, opacity 0.3s ease ${expanded ? delay : 0}ms`,
                  opacity: expanded ? 1 : 0,
                  pointerEvents: expanded ? 'auto' : 'none',
                  zIndex: isHovered ? 100000 : 99999,
                }}
              >
                <IconComponent className="w-4 h-4 text-white" />
                
                {item.count > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-slate-900 rounded-full flex items-center justify-center"
                    style={{
                      transform: expanded ? 'scale(1)' : 'scale(0)',
                      transition: `transform 0.3s ease ${expanded ? delay + 150 : 0}ms`,
                    }}
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </button>

              {/* Tooltip positioned near the item */}
              {isHovered && expanded && (
                <div 
                  className="absolute pointer-events-none"
                  style={{ 
                    top: pos.y + tooltipPos.y,
                    left: pos.x + tooltipPos.x,
                    transform: tooltipPos.align === 'center' 
                      ? 'translate(-50%, -50%)' 
                      : tooltipPos.align === 'left' 
                        ? 'translate(0, -50%)' 
                        : 'translate(-100%, -50%)',
                    zIndex: 100001,
                  }}
                >
                  <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap backdrop-blur-md"
                    style={{
                      background: `linear-gradient(135deg, ${item.bgColor}ee, ${item.bgColor}cc)`,
                      border: '1px solid rgba(255,255,255,0.2)',
                      animation: 'tooltipPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-white/90" />
                    <span className="text-white font-medium text-sm">{item.label}</span>
                    {item.count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-white text-xs font-bold">
                        {item.count}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative inline-block" style={{ width: '44px', height: '44px' }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative flex items-center justify-center rounded-full shadow-lg hover:scale-105 active:scale-95"
        style={{
          width: '44px',
          height: '44px',
          backgroundColor: activeItem.bgColor,
          zIndex: isOpen ? 99999 : 30,
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <ActiveIcon 
          className="w-5 h-5 text-white" 
          style={{ 
            transform: isOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        />
        
        {/* Show count badge for active tab when menu is closed */}
        {!isOpen && activeItem.count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {activeItem.count > 99 ? '99+' : activeItem.count}
          </span>
        )}
        
        {/* Show pending approval notification when not on pending tab */}
        {!isOpen && stats.pendingApproval > 0 && activeTab !== EventStatus?.PendingApproval && activeTab !== 'all' && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse border border-white" />
        )}
      </button>

      {renderRadialMenu()}
    </div>
  );
};

export default RadialStatusMenu;
