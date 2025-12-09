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

export function SaleStatusBadge({ 
  saleStartTime, 
  saleEndTime, 
  startTime, 
  endTime, 
  onImage = false 
}) {
  const [timeStatus, setTimeStatus] = useState({
    status: "not-started", // not-started, on-sale, sale-closed, event-ongoing, event-ended
    label: "",
    description: "",
  });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const saleStart = new Date(saleStartTime);
      const saleEnd = new Date(saleEndTime);
      const eventStart = new Date(startTime);
      const eventEnd = new Date(endTime);

      // Event has ended
      if (now > eventEnd) {
        setTimeStatus({
          status: "event-ended",
          label: "Sự kiện đã kết thúc",
          description: "",
        });
        return;
      }

      // Event is ongoing
      if (now >= eventStart && now <= eventEnd) {
        setTimeStatus({
          status: "event-ongoing",
          label: "Sự kiện đang diễn ra",
          description: "",
        });
        return;
      }

      // Sale has ended but event hasn't started yet
      if (now > saleEnd && now < eventStart) {
        setTimeStatus({
          status: "sale-closed",
          label: "Đóng bán vé",
          description: "",
        });
        return;
      }

      // Sale is ongoing
      if (now >= saleStart && now <= saleEnd) {
        const diff = saleEnd - now;
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);

        // Determine urgency level
        const totalMinutesLeft = Math.floor(diff / (1000 * 60));
        let label = "Đang mở bán";
        
        // if (totalMinutesLeft <= 30) {
        //   label = "Kết thúc sớm";
        // } else if (totalMinutesLeft <= 120) {
        //   label = "Nhanh lên";
        // }

        setTimeStatus({
          status: "on-sale",
          label: label,
          description: totalMinutesLeft <= 120 ? `${hours}h ${minutes}m` : "",
        });
        return;
      }

      // Sale hasn't started yet
      if (now < saleStart) {
        const diff = saleStart - now;
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
          status: "not-started",
          label: "Chưa bán vé",
          description: timeText,
        });
        return;
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [saleStartTime, saleEndTime, startTime, endTime]);

  const getStatusStyle = () => {
    if (onImage) {
      // On-image badge - solid colors for good contrast
      switch (timeStatus.status) {
        case "not-started":
          return "bg-slate-600 border-0"; // Chưa bán vé
        case "on-sale":
          // On-sale with different urgency levels
          if (timeStatus.label === "Kết thúc sớm") {
            return "bg-red-500 border-0 badge-pulse-urgent"; // Urgent
          } else if (timeStatus.label === "Nhanh lên") {
            return "bg-amber-500 border-0"; // Warning
          }
          return "bg-emerald-500 border-0"; // Normal on-sale
        case "sale-closed":
          return "bg-orange-600 border-0"; // Sale closed but event not started
        case "event-ongoing":
          return "bg-blue-600 border-0"; // Event is happening
        case "event-ended":
          return "bg-red-600 border-0"; // Event finished
        default:
          return "bg-slate-600 border-0";
      }
    } else {
      // Below-image badge - light backgrounds with borders
      switch (timeStatus.status) {
        case "not-started":
          return "bg-slate-100 border border-slate-300";
        case "on-sale":
          if (timeStatus.label === "Kết thúc sớm") {
            return "bg-red-50 border border-red-300 badge-pulse-urgent";
          } else if (timeStatus.label === "Nhanh lên") {
            return "bg-amber-50 border border-amber-300";
          }
          return "bg-emerald-50 border border-emerald-300";
        case "sale-closed":
          return "bg-orange-50 border border-orange-300";
        case "event-ongoing":
          return "bg-blue-50 border border-blue-300";
        case "event-ended":
          return "bg-red-50 border border-red-300";
        default:
          return "bg-slate-100 border border-slate-300";
      }
    }
  };

  const getTextStyle = () => {
    if (onImage) {
      return "text-white";
    } else {
      switch (timeStatus.status) {
        case "not-started":
          return "text-slate-700";
        case "on-sale":
          if (timeStatus.label === "Kết thúc sớm") {
            return "text-red-700";
          } else if (timeStatus.label === "Nhanh lên") {
            return "text-amber-700";
          }
          return "text-emerald-700";
        case "sale-closed":
          return "text-orange-700";
        case "event-ongoing":
          return "text-blue-700";
        case "event-ended":
          return "text-red-700";
        default:
          return "text-slate-700";
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
