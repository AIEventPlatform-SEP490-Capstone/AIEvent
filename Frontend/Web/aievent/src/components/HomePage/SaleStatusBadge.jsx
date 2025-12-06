import React, { useState, useEffect } from "react";

// Add pulse animation styles
const pulseStyles = `
  @keyframes pulse-badge {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  .badge-pulse-urgent {
    animation: pulse-badge 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = pulseStyles;
  document.head.appendChild(style);
}

export function SaleStatusBadge({ saleStartTime, saleEndTime, onImage = false }) {
  const [timeStatus, setTimeStatus] = useState({
    status: "upcoming", // upcoming, ongoing, ended
    label: "",
    description: "",
  });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const startTime = new Date(saleStartTime);
      const endTime = new Date(saleEndTime);

      // Sale ended
      if (now > endTime) {
        setTimeStatus({
          status: "ended",
          label: "Hết hạn",
          description: "Kết thúc bán",
        });
        return;
      }

      // Upcoming sale
      if (now < startTime) {
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);

        let timeText = "";
        if (days > 0) {
          timeText = `${days}d`;
        } else if (hours > 0) {
          timeText = `${hours}h`;
        } else {
          timeText = `${minutes}m`;
        }

        setTimeStatus({
          status: "upcoming",
          label: "Sắp bán",
          description: timeText,
        });
        return;
      }

      // Sale ongoing
      const diff = endTime - now;
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      // Determine urgency level
      const totalMinutesLeft = Math.floor(diff / (1000 * 60));
      let label = "Đang bán";
      
      if (totalMinutesLeft <= 30) {
        label = "Kết thúc sớm";
      } else if (totalMinutesLeft <= 120) {
        label = "Nhanh lên";
      }

      setTimeStatus({
        status: "ongoing",
        label: label,
        description: totalMinutesLeft <= 120 ? `${hours}h ${minutes}m` : "",
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [saleStartTime, saleEndTime]);

  const getStatusStyle = () => {
    if (onImage) {
      // On-image badge - solid colors for good contrast
      switch (timeStatus.status) {
        case "ended":
          return "bg-red-600 border-0";
        case "upcoming":
          return "bg-slate-600 border-0";
        default:
          // Ongoing sales with different urgency levels
          if (timeStatus.label === "Kết thúc sớm") {
            return "bg-red-500 border-0 badge-pulse-urgent";
          } else if (timeStatus.label === "Nhanh lên") {
            return "bg-amber-500 border-0";
          }
          return "bg-emerald-500 border-0";
      }
    } else {
      // Below-image badge - light backgrounds with borders
      switch (timeStatus.status) {
        case "ended":
          return "bg-red-50 border border-red-300";
        case "upcoming":
          return "bg-slate-100 border border-slate-300";
        default:
          if (timeStatus.label === "Kết thúc sớm") {
            return "bg-red-50 border border-red-300 badge-pulse-urgent";
          } else if (timeStatus.label === "Nhanh lên") {
            return "bg-amber-50 border border-amber-300";
          }
          return "bg-emerald-50 border border-emerald-300";
      }
    }
  };

  const getTextStyle = () => {
    if (onImage) {
      return "text-white";
    } else {
      switch (timeStatus.status) {
        case "ended":
          return "text-red-700";
        case "upcoming":
          return "text-slate-700";
        default:
          if (timeStatus.label === "Kết thúc sớm") {
            return "text-red-700";
          } else if (timeStatus.label === "Nhanh lên") {
            return "text-amber-700";
          }
          return "text-emerald-700";
      }
    }
  };

  return (
    <div className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium transition-all ${getStatusStyle()} ${getTextStyle()}`}>
      {timeStatus.description ? (
        <div className="flex items-center gap-1.5">
          <span className="font-bold">{timeStatus.label}</span>
          <span className="opacity-85">{timeStatus.description}</span>
        </div>
      ) : (
        <span className="font-bold">{timeStatus.label}</span>
      )}
    </div>
  );
}
