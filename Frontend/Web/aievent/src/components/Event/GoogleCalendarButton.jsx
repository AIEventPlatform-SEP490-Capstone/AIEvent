import { Button } from "../ui/button";
import { CalendarPlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";

const GoogleCalendarButton = ({ event, variant = "outline", size = "sm", className = "" }) => {
  const [added, setAdded] = useState(false);

  const addToGoogleCalendar = (e) => {
    e.stopPropagation();

    if (!event) return;

    const startTime = parseISO(event.startTime);
    const endTime = parseISO(event.endTime || event.startTime);

    const title = event.title || "Sự kiện không tên";
    const location = event.address || event.locationName || "";
    const description = `${
      event.description || event.detailedDescription || "Không có mô tả"
    }\n\nĐặt vé tại: ${window.location.origin}${window.location.pathname}`;

    // Format: YYYYMMDDTHHmmssZ
    const formatDate = (date) =>
      date.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, -1) + "Z";

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${formatDate(startTime)}/${formatDate(endTime)}&location=${encodeURIComponent(
      location
    )}&details=${encodeURIComponent(description)}&sf=true&output=xml`;

    // Mở popup Google Calendar ngay lập tức
    window.open(googleCalendarUrl, "google-calendar-popup", "width=800,height=700");

    // Hiệu ứng "Đã thêm"
    setAdded(true);
    setTimeout(() => setAdded(false), 4000);
  };

  return (
    <Button
      variant={added ? "default" : variant}
      size={size}
      onClick={addToGoogleCalendar}
      className={`transition-all duration-500 group relative overflow-hidden ${className} ${
        added ? "bg-emerald-500 hover:bg-emerald-600" : ""
      }`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {added ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Đã thêm vào Google Calendar
          </>
        ) : (
          <>
            <CalendarPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Thêm vào Google Calendar
          </>
        )}
      </span>

      {/* Hiệu ứng sóng khi thêm thành công */}
      {added && (
        <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-30 animate-ping"></span>
      )}
    </Button>
  );
};

export default GoogleCalendarButton;