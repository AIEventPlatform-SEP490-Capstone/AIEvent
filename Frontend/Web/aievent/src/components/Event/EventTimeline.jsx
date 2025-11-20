import React from "react"

const TicketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M13 5v2"/>
    <path d="M13 17v2"/>
    <path d="M13 11v2"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const FlagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" x2="4" y1="22" y2="15"/>
  </svg>
)

export function EventTimeline({ stages, currentStage = 0 }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-border/50 shadow-sm">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">Timeline sự kiện</h3>
        <p className="text-sm text-muted-foreground">Theo dõi các giai đoạn quan trọng của sự kiện</p>
      </div>

      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background line with gradient */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-30"></div>

          {/* Animated progress line */}
          <div
            className="absolute top-8 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
            style={{
              width: `${((currentStage + 1) / stages.length) * 100}%`,
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
            }}
          ></div>

          {/* Timeline stages */}
          <div className="flex items-start justify-between relative z-10">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStage
              const isCurrent = index === currentStage
              const isUpcoming = index > currentStage
              // Handle case when currentStage is -1 (not yet started)
              const showAsUpcoming = currentStage === -1 ? index >= 0 : isUpcoming
              const showAsCurrent = currentStage === -1 ? false : isCurrent

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  {/* Dot with animation */}
                  <div className="relative mb-4">
                    {/* Outer glow ring */}
                    {showAsCurrent && (
                      <div className="absolute inset-0 animate-pulse">
                        <div className={`w-12 h-12 rounded-full ${stage.color} opacity-30 blur-lg`}></div>
                      </div>
                    )}

                    {/* Main dot */}
                    <div
                      className={`
                        relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${
                          showAsCurrent
                            ? `${stage.color} text-white shadow-lg scale-110`
                            : isCompleted
                              ? `${stage.color} text-white shadow-md`
                              : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                        }
                        ${showAsCurrent ? "ring-4 ring-offset-2 dark:ring-offset-slate-900" : ""}
                      `}
                      style={
                        showAsCurrent
                          ? {
                              boxShadow: `0 0 20px ${stage.color.replace("bg-", "")}`,
                            }
                          : {}
                      }
                    >
                      {stage.icon}
                    </div>

                    {/* Status badge */}
                    {showAsCurrent && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        Đang diễn ra
                      </div>
                    )}
                  </div>

                  {/* Stage info */}
                  <div className="text-center w-full px-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {stage.label}
                    </p>
                    <p
                      className={`text-sm font-bold transition-colors ${
                        showAsCurrent ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.time}
                    </p>
                    {/* Countdown or ongoing status */}
                    {stage.countdown}
                    {stage.ongoing}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Timeline - Vertical */}
      <div className="md:hidden space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStage
          const isCurrent = index === currentStage
          // Handle case when currentStage is -1 (not yet started)
          const showAsCurrent = currentStage === -1 ? false : isCurrent

          return (
            <div key={index} className="flex gap-4">
              {/* Vertical line and dot */}
              <div className="flex flex-col items-center">
                {/* Top line */}
                {index > 0 && (
                  <div
                    className={`w-1 h-4 mb-2 rounded-full ${
                      isCompleted ? stage.color : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  ></div>
                )}

                {/* Dot */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${
                      showAsCurrent
                        ? `${stage.color} text-white scale-110 shadow-lg`
                        : isCompleted
                          ? `${stage.color} text-white`
                          : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    }
                  `}
                >
                  {stage.icon}
                </div>

                {/* Bottom line */}
                {index < stages.length - 1 && (
                  <div
                    className={`w-1 h-4 mt-2 rounded-full ${
                      isCompleted ? stage.color : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  ></div>
                )}
              </div>

              {/* Stage info */}
              <div
                className={`pt-2 pb-4 flex-1 ${
                  showAsCurrent
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                    : ""
                }`}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {stage.label}
                </p>
                <p
                  className={`text-sm font-bold ${
                    showAsCurrent ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stage.time}
                </p>
                {/* Countdown or ongoing status for mobile */}
                {stage.countdown}
                {stage.ongoing}
                {showAsCurrent && !stage.ongoing && (
                  <div className="mt-2 inline-block bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Đang diễn ra
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EventTimeline