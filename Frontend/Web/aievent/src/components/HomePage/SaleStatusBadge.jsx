import { useState, useEffect } from "react";
import { Clock, Ticket, Play, CheckCircle, XCircle } from "lucide-react";

export function SaleStatusBadge({ 
  saleStartTime, 
  saleEndTime, 
  startTime, 
  endTime, 
  onImage = false 
}) {
  const [timeStatus, setTimeStatus] = useState({
    status: "not-started",
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

      if (now > eventEnd) {
        setTimeStatus({
          status: "event-ended",
          label: "Đã kết thúc",
          description: "",
        });
        return;
      }

      if (now >= eventStart && now <= eventEnd) {
        setTimeStatus({
          status: "event-ongoing",
          label: "Đang diễn ra",
          description: "",
        });
        return;
      }

      if (now > saleEnd && now < eventStart) {
        setTimeStatus({
          status: "sale-closed",
          label: "Đóng bán",
          description: "",
        });
        return;
      }

      if (now >= saleStart && now <= saleEnd) {
        const diff = saleEnd - now;
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const totalMinutesLeft = Math.floor(diff / (1000 * 60));

        setTimeStatus({
          status: "on-sale",
          label: "Mở bán",
          description: totalMinutesLeft <= 120 ? `${hours}h ${minutes}m` : "",
        });
        return;
      }

      if (now < saleStart) {
        setTimeStatus({
          status: "not-started",
          label: "Sắp mở",
          description: "",
        });
        return;
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, [saleStartTime, saleEndTime, startTime, endTime]);

  const getIcon = () => {
    const iconClass = "w-3 h-3";
    switch (timeStatus.status) {
      case "not-started":
        return <Clock className={iconClass} />;
      case "on-sale":
        return <Ticket className={iconClass} />;
      case "sale-closed":
        return <XCircle className={iconClass} />;
      case "event-ongoing":
        return <Play className={iconClass} />;
      case "event-ended":
        return <CheckCircle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getStatusStyle = () => {
    if (onImage) {
      switch (timeStatus.status) {
        case "not-started":
          return "bg-slate-700/90 backdrop-blur-md text-white";
        case "on-sale":
          return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
        case "sale-closed":
          return "bg-gradient-to-r from-orange-500 to-amber-500 text-white";
        case "event-ongoing":
          return "bg-gradient-to-r from-violet-500 to-blue-500 text-white";
        case "event-ended":
          return "bg-gray-600/90 backdrop-blur-md text-white";
        default:
          return "bg-slate-700/90 backdrop-blur-md text-white";
      }
    } else {
      switch (timeStatus.status) {
        case "not-started":
          return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
        case "on-sale":
          return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20";
        case "sale-closed":
          return "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20";
        case "event-ongoing":
          return "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20";
        case "event-ended":
          return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
        default:
          return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
      }
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${getStatusStyle()}`}>
      {getIcon()}
      <span>{timeStatus.label}</span>
      {timeStatus.description && (
        <span className="opacity-80 font-medium">{timeStatus.description}</span>
      )}
    </div>
  );
}
