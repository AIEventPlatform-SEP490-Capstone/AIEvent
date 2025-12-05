import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const glowKeyframes = `
  @keyframes glow-pulse {
    0%, 100% {
      box-shadow: 0 0 15px 2px rgba(255, 107, 107, 0.4), 0 10px 25px -5px rgba(255, 107, 107, 0.4);
    }
    50% {
      box-shadow: 0 0 25px 4px rgba(255, 107, 107, 0.6), 0 10px 35px -5px rgba(255, 107, 107, 0.5);
    }
  }
  
  @keyframes glow-pulse-amber {
    0%, 100% {
      box-shadow: 0 0 15px 2px rgba(251, 146, 60, 0.4), 0 10px 25px -5px rgba(251, 146, 60, 0.4);
    }
    50% {
      box-shadow: 0 0 25px 4px rgba(251, 146, 60, 0.6), 0 10px 35px -5px rgba(251, 146, 60, 0.5);
    }
  }
  
  @keyframes glow-pulse-emerald {
    0%, 100% {
      box-shadow: 0 0 15px 2px rgba(52, 211, 153, 0.4), 0 10px 25px -5px rgba(52, 211, 153, 0.4);
    }
    50% {
      box-shadow: 0 0 25px 4px rgba(52, 211, 153, 0.6), 0 10px 35px -5px rgba(52, 211, 153, 0.5);
    }
  }

  .glow-red {
    animation: glow-pulse 2s ease-in-out infinite;
  }

  .glow-amber {
    animation: glow-pulse-amber 2s ease-in-out infinite;
  }

  .glow-emerald {
    animation: glow-pulse-emerald 2s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = glowKeyframes;
  document.head.appendChild(style);
}

export function SaleStatusBadge({ saleStartTime, saleEndTime, onImage = false }) {
  const [timeStatus, setTimeStatus] = useState({
    status: "upcoming", // upcoming, ongoing, ended
    countdownText: "",
    phaseLabel: "",
  });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const startTime = new Date(saleStartTime);
      const endTime = new Date(saleEndTime);

      // Nếu hết thời gian bán vé
      if (now > endTime) {
        setTimeStatus({
          status: "ended",
          countdownText: "Đã hết hạn",
          phaseLabel: "Kết thúc bán",
        });
        return;
      }

      // Nếu chưa tới thời gian bán vé
      if (now < startTime) {
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        let countdownText = "";
        if (days > 0) {
          countdownText = `${days}d ${hours}h`;
        } else if (hours > 0) {
          countdownText = `${hours}h ${minutes}m`;
        } else {
          countdownText = `${minutes}m ${seconds}s`;
        }

        setTimeStatus({
          status: "upcoming",
          countdownText,
          phaseLabel: "Sắp bán",
        });
        return;
      }

      // Đang trong thời gian bán vé
      const diff = endTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let countdownText = "";
      if (days > 0) {
        countdownText = `${days}d ${hours}h`;
      } else if (hours > 0) {
        countdownText = `${hours}h ${minutes}m`;
      } else {
        countdownText = `${minutes}m ${seconds}s`;
      }

      setTimeStatus({
        status: "ongoing",
        countdownText,
        phaseLabel: "Đang bán",
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [saleStartTime, saleEndTime]);

  const getGlowClass = () => {
    if (!onImage) return ""; // Không có glow cho badge ở dưới ảnh
    
    if (timeStatus.status === "ended") {
      return "glow-red";
    }
    if (timeStatus.status === "upcoming") {
      return "glow-amber";
    }
    return "glow-emerald";
  };

  const getStatusStyle = () => {
    if (onImage) {
      // Style cho badge trên ảnh - màu sáng, hiện đại với gradient, blur và glow
      if (timeStatus.status === "ended") {
        return "bg-gradient-to-r from-red-500 to-pink-500 backdrop-blur-lg border border-red-300/60 shadow-2xl shadow-red-500/40 blur-0";
      }
      if (timeStatus.status === "upcoming") {
        return "bg-gradient-to-r from-amber-400 to-orange-500 backdrop-blur-lg border border-amber-300/60 shadow-2xl shadow-amber-500/40 blur-0";
      }
      return "bg-gradient-to-r from-emerald-400 to-teal-500 backdrop-blur-lg border border-emerald-300/60 shadow-2xl shadow-emerald-500/40 blur-0";
    } else {
      // Style cho badge ở dưới ảnh - nền nhạt, hiện đại
      if (timeStatus.status === "ended") {
        return "bg-red-50 border border-red-200/60 shadow-md shadow-red-100/50";
      }
      if (timeStatus.status === "upcoming") {
        return "bg-amber-50 border border-amber-200/60 shadow-md shadow-amber-100/50";
      }
      return "bg-emerald-50 border border-emerald-200/60 shadow-md shadow-emerald-100/50";
    }
  };

  const getTextStyle = () => {
    if (onImage) {
      return "text-white";
    } else {
      if (timeStatus.status === "ended") {
        return "text-red-700";
      }
      if (timeStatus.status === "upcoming") {
        return "text-amber-700";
      }
      return "text-emerald-700";
    }
  };

  const getIconStyle = () => {
    if (onImage) {
      return "text-white";
    } else {
      if (timeStatus.status === "ended") {
        return "text-red-500";
      }
      if (timeStatus.status === "upcoming") {
        return "text-amber-600";
      }
      return "text-emerald-600";
    }
  };

  if (timeStatus.status === "ended") {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${getStatusStyle()} ${getGlowClass()}`}>
        <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${getIconStyle()}`} />
        <div className="flex flex-col">
          <span className={`text-xs font-bold ${getTextStyle()}`}>
            {timeStatus.phaseLabel}
          </span>
          <span className={`text-xs font-semibold leading-none ${getTextStyle()}`}>
            {timeStatus.countdownText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${getStatusStyle()} ${getGlowClass()}`}>
      <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${getIconStyle()}`} />
      <div className="flex flex-col">
        <span className={`text-xs font-bold ${getTextStyle()}`}>
          {timeStatus.phaseLabel}
        </span>
        <span className={`text-xs font-semibold leading-none ${getTextStyle()}`}>
          {timeStatus.countdownText}
        </span>
      </div>
    </div>
  );
}
