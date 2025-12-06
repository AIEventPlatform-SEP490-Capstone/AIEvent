import React, { useState, useEffect, useMemo } from 'react';
import { Input } from './input';
import datetimeValidation from '../../utils/datetimeValidation';

// Icons
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16" stroke="white" strokeWidth="2.5"/>
  </svg>
);

const DateTimePicker = ({ 
  value, 
  onChange, 
  id, 
  className = '', 
  min, 
  max, 
  label, 
  error, 
  onErrorChange,
  fieldName = 'Thời gian',
  ...props 
}) => {
  const [date, setDate] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        setDate(`${year}-${month}-${day}`);
        setHours(d.getHours());
        setMinutes(d.getMinutes());
      }
    } else {
      setDate('');
      setHours(0);
      setMinutes(0);
    }
  }, [value]);

  const now = new Date();
  const minDate = min ? new Date(min) : now;
  const minDateStr = minDate.toISOString().slice(0, 10);
  
  let maxDateStr = '';
  if (max) {
    const maxDate = new Date(max);
    maxDateStr = maxDate.toISOString().slice(0, 10);
  }

  const validateAndEmit = (dateVal, h, m) => {
    if (!dateVal) {
      onChange('');
      if (onErrorChange) {
        onErrorChange('');
      }
      return;
    }
    
    const [year, month, day] = dateVal.split('-');
    const selected = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      h,
      m
    );
    
    // Kiểm tra strictly sau thời gian hiện tại (không bằng)
    if (selected <= minDate) {
      if (onErrorChange) {
        onErrorChange(`${fieldName} phải sau ${minDate.toLocaleString('vi-VN')}`);
      }
      return;
    }
    
    // Kiểm tra trước thời gian kết thúc nếu có
    if (max) {
      if (selected > new Date(max)) {
        if (onErrorChange) {
          onErrorChange(`${fieldName} không được sau ${new Date(max).toLocaleString('vi-VN')}`);
        }
        return;
      }
    }
    
    if (onErrorChange) {
      onErrorChange('');
    }
    
    onChange(selected.toISOString());
  };

  const handleDate = (e) => {
    const val = e.target.value;
    setDate(val);
    validateAndEmit(val, hours, minutes);
  };

  const handleHourChange = (e) => {
    const h = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
    setHours(h);
    validateAndEmit(date, h, minutes);
  };

  const handleMinuteChange = (e) => {
    const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
    setMinutes(m);
    validateAndEmit(date, hours, m);
  };

  // Format display
  const displayValue = useMemo(() => {
    if (!date) return '';
    try {
      const [year, month, day] = date.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      return `${dateStr} ${timeStr}`;
    } catch {
      return '';
    }
  }, [date, hours, minutes]);

  const hasError = !!error;
  const isValid = !hasError && date;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Main Input Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2.5 rounded-lg border-2 transition-all text-left
            flex items-center gap-3 font-medium
            ${hasError
              ? 'border-red-300 bg-red-50 text-red-900 dark:bg-red-950/20 dark:border-red-700'
              : isOpen
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-600 text-gray-900 dark:text-gray-100'
              : isValid
              ? 'border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 text-gray-900 dark:text-gray-100'
              : 'border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {hasError && <AlertCircleIcon className="text-red-500" />}
            {isValid && !hasError && <CheckCircleIcon className="text-green-500" />}
            {!hasError && !isValid && <CalendarIcon className="text-gray-500 dark:text-gray-400" />}
          </div>
          <span className="flex-1">
            {displayValue || 'Chọn ngày giờ...'}
          </span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-lg shadow-xl z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Date Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Chọn Ngày
              </label>
              <Input
                type="date"
                value={date}
                onChange={handleDate}
                min={minDateStr}
                max={maxDateStr}
                className="w-full h-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Time Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Chọn Giờ
              </label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Giờ</div>
                  <input
                    type="number"
                    value={hours}
                    onChange={handleHourChange}
                    min="0"
                    max="23"
                    className="w-full h-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-center font-semibold text-lg rounded-md focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="text-2xl font-light text-gray-400">:</div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Phút</div>
                  <input
                    type="number"
                    value={minutes}
                    onChange={handleMinuteChange}
                    min="0"
                    max="59"
                    className="w-full h-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-center font-semibold text-lg rounded-md focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            {(min || max) && (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                {min && <div>📌 Từ: {new Date(min).toLocaleString('vi-VN')}</div>}
                {max && <div>📌 Đến: {new Date(max).toLocaleString('vi-VN')}</div>}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-sm"
              >
                Xác Nhận
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircleIcon className="text-red-500 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;