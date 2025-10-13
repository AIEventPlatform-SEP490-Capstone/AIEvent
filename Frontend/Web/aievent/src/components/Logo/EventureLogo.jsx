import { cn } from "../../lib/utils"

export function EventureLogo({ className, size = "md", variant = "full", showTagline = false }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  const taglineSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const LogoIcon = () => (
    <div
      className={cn(
        "relative rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg",
        sizeClasses[size],
      )}
    >
      {/* Interlocking Circles Design */}
      <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 text-white" fill="none">
        {/* Main Circle - Events */}
        <circle cx="10" cy="12" r="6" stroke="currentColor" strokeWidth="2" className="opacity-90" />

        {/* Overlapping Circle - Connection */}
        <circle cx="14" cy="12" r="6" stroke="currentColor" strokeWidth="2" className="opacity-90" />

        {/* Central Connection Point */}
        <circle cx="12" cy="12" r="2" fill="currentColor" className="opacity-100" />

        {/* Time/Movement Indicators */}
        <path
          d="M8 8l2 2M16 8l-2 2M8 16l2-2M16 16l-2-2"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-70"
        />
      </svg>
    </div>
  )

  if (variant === "icon") {
    return <LogoIcon />
  }

  if (variant === "text") {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className={cn("font-bold text-foreground", textSizeClasses[size])}>
          <span className="text-primary font-extrabold">Event</span>
          <span className="text-foreground">ure</span>
        </div>
        {showTagline && (
          <span className={cn("text-muted-foreground font-medium", taglineSizeClasses[size])}>
            Elevate Every Experience
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoIcon />
      <div className="flex flex-col">
        <div className={cn("font-bold text-foreground leading-none", textSizeClasses[size])}>
          <span className="text-primary font-extrabold">Event</span>
          <span className="text-foreground">ure</span>
        </div>
        {showTagline && (
          <span className={cn("text-muted-foreground font-medium leading-tight", taglineSizeClasses[size])}>
            Elevate Every Experience
          </span>
        )}
      </div>
    </div>
  )
}