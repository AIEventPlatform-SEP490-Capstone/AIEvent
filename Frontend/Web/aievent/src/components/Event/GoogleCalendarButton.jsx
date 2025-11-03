import React from "react";
import { Calendar } from "lucide-react";
import { Button } from "../ui/button";

/**
 * Component để thêm sự kiện vào Google Calendar
 * @param {Object} event - Đối tượng sự kiện
 * @param {string} event.title - Tiêu đề sự kiện
 * @param {string} event.startTime - Thời gian bắt đầu (ISO string)
 * @param {string} event.endTime - Thời gian kết thúc (ISO string)
 * @param {string} event.address - Địa chỉ sự kiện
 * @param {string} event.locationName - Tên địa điểm
 * @param {string} event.description - Mô tả sự kiện
 * @param {string} event.detailedDescription - Mô tả chi tiết
 * @param {Object} className - CSS classes tùy chỉnh
 * @param {Object} variant - Button variant
 * @param {string} size - Button size
 */
const GoogleCalendarButton = ({ 
  event, 
  className = "", 
  variant = "outline",
  size = "sm" 
}) => {
  /**
   * Chuyển đổi Date sang định dạng Google Calendar (YYYYMMDDTHHmmssZ)
   * @param {Date} date - Ngày cần chuyển đổi
   * @returns {string} - Chuỗi ngày định dạng Google Calendar
   */
  const formatDateForGoogleCalendar = (date) => {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  /**
   * Tạo URL Google Calendar từ thông tin sự kiện
   * @returns {string} - URL Google Calendar
   */
  const generateGoogleCalendarUrl = () => {
    if (!event) {
      console.error("Event data is required");
      return "#";
    }

    const title = event.title || "Sự kiện";
    const startTime = event.startTime ? formatDateForGoogleCalendar(event.startTime) : "";
    const endTime = event.endTime ? formatDateForGoogleCalendar(event.endTime) : "";
    
    // Lấy địa chỉ từ locationName hoặc address
    const location = event.locationName || event.address || "";

    // Lấy mô tả từ detailedDescription hoặc description
    const description = event.detailedDescription || event.description || "";

    // Tạo URL Google Calendar
    // URLSearchParams sẽ tự động encode các giá trị
    const baseUrl = "https://calendar.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${startTime}/${endTime}`,
      details: description,
      location: location,
    });

    return `${baseUrl}?${params.toString()}`;
  };

  /**
   * Xử lý khi click vào button
   */
  const handleAddToCalendar = () => {
    const url = generateGoogleCalendarUrl();
    if (url && url !== "#") {
      // Mở Google Calendar trong tab mới
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCalendar}
      className={className}
    >
      <Calendar className="w-4 h-4 mr-2" />
      Thêm vào Google Calendar
    </Button>
  );
};

export default GoogleCalendarButton;

