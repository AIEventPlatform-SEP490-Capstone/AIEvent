import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import DateTimePicker from '../../components/ui/date-time-picker';
import datetimeValidation from '../../utils/datetimeValidation';

// Icons giữ nguyên...
const TicketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const FlagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" x2="4" y1="22" y2="15"/>
  </svg>
);

export function EventTimeline({ 
  stages, 
  currentStage: propCurrentStage = 0, 
  isEditable = false, 
  rawTimes = [], 
  onTimeChange, 
  minDateTime,
  // Thêm props để xử lý validation
  validationTimes = {},
  onValidationChange
}) {
  const internalStages = stages.map((stage, index) => ({
    ...stage,
    rawTime: rawTimes[index]
  }));

  // FIX HOÀN CHỈNH – SIÊU ỔN ĐỊNH
  const hasAnyTimeDefined = rawTimes.some(time => 
    time && typeof time === 'string' && time.trim() !== ''
  );
  const effectiveCurrentStage = hasAnyTimeDefined ? propCurrentStage : -1;

  // Bảo vệ progress bar
  const progressWidth = effectiveCurrentStage < 0 || effectiveCurrentStage >= stages.length
    ? "0%"
    : `${((effectiveCurrentStage + 1) / stages.length) * 100}%`;

  // State để quản lý lỗi validation cho từng trường
  const [dateTimeErrors, setDateTimeErrors] = useState({});

  // Hàm xử lý thay đổi lỗi validation
  const handleDateTimeErrorChange = (index, error) => {
    setDateTimeErrors(prev => ({
      ...prev,
      [index]: error
    }));
    
    // Gọi callback nếu được cung cấp
    if (onValidationChange) {
      onValidationChange(index, error);
    }
  };

  // Field names for error messages
  const fieldNames = [
    "Thời gian mở bán vé",
    "Thời gian đóng bán vé", 
    "Thời gian bắt đầu sự kiện",
    "Thời gian kết thúc sự kiện"
  ];

  return (
    <div className="bg-white rounded-2xl p-8 border border-border/50 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-300">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">Timeline sự kiện</h3>
        <p className="text-sm text-muted-foreground">Theo dõi các giai đoạn quan trọng của sự kiện</p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-30"></div>

          <div
            className="absolute top-8 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
            style={{
              width: progressWidth,
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
            }}
          ></div>

          <div className="flex items-start justify-between relative z-10">
            {internalStages.map((stage, index) => {
              const isCompleted = index < effectiveCurrentStage;
              const isCurrent = index === effectiveCurrentStage;
              const showAsCurrent = hasAnyTimeDefined && isCurrent;
              const showAsCompleted = hasAnyTimeDefined && isCompleted;

              // Xác định min và max cho từng trường thời gian
              let minTime = minDateTime;
              let maxTime = null;
              
              // Logic xác định min/max time dựa trên các trường thời gian khác
              if (index === 0) { // Mở bán vé
                // Không có min cụ thể, chỉ cần sau thời điểm hiện tại
                maxTime = validationTimes.startTime || null; // Trước thời gian bắt đầu sự kiện
              } else if (index === 1) { // Đóng bán vé
                minTime = validationTimes.saleStartTime || minDateTime; // Sau thời gian mở bán vé
                maxTime = validationTimes.startTime || null; // Trước thời gian bắt đầu sự kiện
              } else if (index === 2) { // Sự kiện bắt đầu
                minTime = validationTimes.saleEndTime || minDateTime; // Sau thời gian đóng bán vé
              } else if (index === 3) { // Sự kiện kết thúc
                minTime = validationTimes.startTime || minDateTime; // Sau thời gian bắt đầu sự kiện
              }

              const dotContent = (
                <div className="relative mb-4">
                  {showAsCurrent && (
                    <div className="absolute inset-0 animate-pulse">
                      <div className={`w-12 h-12 rounded-full ${stage.color} opacity-30 blur-lg`}></div>
                    </div>
                  )}

                  <div
                    className={`
                      relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${showAsCurrent 
                        ? `${stage.color} text-white shadow-lg scale-110 ring-4 ring-offset-2 ring-offset-background` 
                        : showAsCompleted 
                          ? `${stage.color} text-white shadow-md`
                          : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }
                    `}
                  >
                    {stage.icon}
                  </div>

                  {showAsCurrent && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg">
                      Đang diễn ra
                    </div>
                  )}
                </div>
              );

              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  {isEditable ? (
                    <Popover>
                      <div className="flex flex-col items-center">
                        <PopoverContent className="w-80 mb-2" align="center" side="top">
                          <DateTimePicker 
                            value={stage.rawTime} 
                            onChange={(v) => onTimeChange?.(index, v)} 
                            min={minTime}
                            max={maxTime}
                            error={dateTimeErrors[index]}
                            onErrorChange={(error) => handleDateTimeErrorChange(index, error)}
                            fieldName={fieldNames[index]}
                          />
                        </PopoverContent>
                        <PopoverTrigger asChild>
                          <div className="cursor-pointer mt-2">{dotContent}</div>
                        </PopoverTrigger>
                      </div>
                    </Popover>
                  ) : dotContent}

                  <div className="text-center w-full px-2 mt-4 group-hover:bg-blue-50 group-hover:border group-hover:border-blue-300 group-hover:rounded-lg group-hover:py-2 transition-all duration-300">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {stage.label}
                    </p>
                    <p className={`text-sm font-bold ${showAsCurrent || showAsCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                      <span className="inline-block bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 text-foreground">
                        {stage.time}
                      </span>
                    </p>
                    {/* Move countdown display below the time information */}
                    {index === 0 && stage.countdown && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1 text-center">Bắt đầu sau</div>
                        <div className="flex justify-center gap-1">
                          {stage.countdown}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile - giữ nguyên logic */}
      <div className="md:hidden space-y-6">
        {internalStages.map((stage, index) => {
          const isCompleted = index < effectiveCurrentStage;
          const isCurrent = index === effectiveCurrentStage;
          const showAsCurrent = hasAnyTimeDefined && isCurrent;

          // Xác định min và max cho từng trường thời gian (mobile)
          let minTime = minDateTime;
          let maxTime = null;
          
          if (index === 0) { // Mở bán vé
            maxTime = validationTimes.startTime || null;
          } else if (index === 1) { // Đóng bán vé
            minTime = validationTimes.saleStartTime || minDateTime;
            maxTime = validationTimes.startTime || null;
          } else if (index === 2) { // Sự kiện bắt đầu
            minTime = validationTimes.saleEndTime || minDateTime;
          } else if (index === 3) { // Sự kiện kết thúc
            minTime = validationTimes.startTime || minDateTime;
          }

          const dotContent = (
            <div className="flex flex-col items-center">
              {index > 0 && (
                <div className={`w-1 h-8 rounded-full ${isCompleted ? stage.color : "bg-gray-300"}`}></div>
              )}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${showAsCurrent ? `${stage.color} text-white shadow-lg scale-110` 
                  : isCompleted ? `${stage.color} text-white` 
                  : "bg-gray-300 text-gray-600"}
              `}>
                {stage.icon}
              </div>
              {index < stages.length - 1 && (
                <div className={`w-1 h-8 rounded-full ${isCompleted ? stage.color : "bg-gray-300"} mt-2`}></div>
              )}
            </div>
          );

          return (
            <div key={index} className="flex gap-4 items-start group">
              {isEditable ? (
                <Popover>
                  <div className="flex flex-col items-center">
                    <PopoverContent className="w-80 mb-2" align="center" side="top">
                      <DateTimePicker 
                        value={stage.rawTime} 
                        onChange={(v) => onTimeChange?.(index, v)} 
                        min={minTime}
                        max={maxTime}
                        error={dateTimeErrors[index]}
                        onErrorChange={(error) => handleDateTimeErrorChange(index, error)}
                        fieldName={fieldNames[index]}
                      />
                    </PopoverContent>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer mt-2">{dotContent}</div>
                    </PopoverTrigger>
                  </div>
                </Popover>
              ) : dotContent}
              <div className={`flex-1 pt-3 group-hover:bg-blue-50 group-hover:border group-hover:border-blue-300 group-hover:rounded-lg group-hover:p-4 transition-all duration-300 ${showAsCurrent ? "bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200" : ""}`}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{stage.label}</p>
                <p className={`text-base font-bold ${showAsCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  <span className="inline-block bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 text-foreground">
                    {stage.time}
                  </span>
                </p>
                {showAsCurrent && (
                  <div className="mt-2 inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Đang diễn ra
                  </div>
                )}
                {/* Add countdown display for ticket sale start time on mobile */}
                {index === 0 && stage.countdown && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1 text-center">Bắt đầu sau</div>
                    <div className="flex justify-center gap-1">
                      {stage.countdown}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventTimeline;