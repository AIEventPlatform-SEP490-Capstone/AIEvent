import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

const formatCurrency = (amount, short = false) => {
  if (!amount || amount === 0) return '0đ';
  const absAmount = Math.abs(amount);
  
  if (short) {
    if (absAmount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
    } else if (absAmount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}tr`;
    } else if (absAmount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)}K`;
    }
  }
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
};

/**
 * StatBlock - Khối hiển thị thông tin thống kê
 */
const StatBlock = ({ label, value, subText, variant = 'default' }) => {
  const variants = {
    default: {
      container: 'bg-slate-100 dark:bg-slate-800',
      label: 'text-slate-600 dark:text-slate-300',
      value: 'text-slate-900 dark:text-white',
      subText: 'text-slate-500 dark:text-slate-400',
    },
    warning: {
      container: 'bg-orange-50 dark:bg-orange-900/30',
      label: 'text-orange-600 dark:text-orange-300',
      value: 'text-orange-600 dark:text-orange-400',
      subText: 'text-orange-500 dark:text-orange-400',
    },
    success: {
      container: 'bg-emerald-50 dark:bg-emerald-900/30',
      label: 'text-emerald-600 dark:text-emerald-300',
      value: 'text-emerald-600 dark:text-emerald-400',
      subText: 'text-emerald-500 dark:text-emerald-400',
    },
  };

  const style = variants[variant];

  return (
    <div className={cn(
      "flex-1 min-w-0 px-4 py-3 rounded-xl",
      style.container
    )}>
      <p className={cn("text-xs font-medium uppercase tracking-wide mb-1.5", style.label)}>
        {label}
      </p>
      <p className={cn("text-lg font-bold", style.value)}>
        {value}
      </p>
      {subText && (
        <p className={cn("text-xs mt-1", style.subText)}>
          {subText}
        </p>
      )}
    </div>
  );
};

const EventMetricsCard = ({
  event,
  isExpanded = false,
  onToggle,
  viewMode = 'list',
  showToggle = true,
  className,
}) => {
  const metrics = useMemo(() => {
    return {
      totalAmount: event.totalAmount || 0,
      platformFee: event.platformFee || 0,
      payoutAmount: event.payoutAmount || 0,
      flatformFeePercent: event.flatformFee ? (event.flatformFee * 100) : 7,
      fixFee: event.fixFee || 45000,
      datePayout: event.datePayout || 7,
    };
  }, [event]);

  // Compact view
  if (viewMode === 'compact') {
    return (
      <div className={cn("flex gap-2", className)}>
        <StatBlock
          label="Doanh thu"
          value={formatCurrency(metrics.totalAmount, true)}
        />
        <StatBlock
          label="Phí"
          value={formatCurrency(metrics.platformFee, true)}
          variant="warning"
        />
        <StatBlock
          label="Nhận"
          value={formatCurrency(metrics.payoutAmount, true)}
          variant="success"
        />
      </div>
    );
  }

  // List view
  return (
    <div className={cn("", className)}>
      {showToggle && (
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-3 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{isExpanded ? 'Ẩn thống kê' : 'Xem thống kê'}</span>
          {!isExpanded && (
            <span className="ml-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.payoutAmount, true)}
            </span>
          )}
        </button>
      )}

      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded || !showToggle ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="flex gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
          <StatBlock
            label="Doanh thu"
            value={formatCurrency(metrics.totalAmount)}
            subText={`Tổng doanh thu sự kiện`}
          />
          <StatBlock
            label="Phí nền tảng"
            value={formatCurrency(metrics.platformFee)}
            subText={`${metrics.flatformFeePercent}% Doanh Thu + ${formatCurrency(metrics.fixFee, true)}`}
            variant="warning"
          />
          <StatBlock
            label="Thanh toán"
            value={formatCurrency(metrics.payoutAmount)}
            subText={`Thanh toán sau ${metrics.datePayout} ngày`}
            variant="success"
          />
        </div>
      </div>
    </div>
  );
};

export default EventMetricsCard;
