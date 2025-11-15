/**
 * Translate report event error messages from English to Vietnamese
 * @param {string} errorMessage - The error message from backend
 * @returns {string} - Translated Vietnamese error message
 */
export const translateReportEventError = (errorMessage) => {
  if (!errorMessage) return 'Có lỗi xảy ra khi báo cáo sự kiện.';

  const message = errorMessage.toLowerCase();

  // Map backend error messages to Vietnamese
  if (message.includes('invalid event id format') || message.includes('invalid event id')) {
    return 'Định dạng ID sự kiện không hợp lệ.';
  }

  if (message.includes('event not found') || message.includes('unavailable')) {
    return 'Không tìm thấy sự kiện hoặc sự kiện không khả dụng.';
  }

  if (message.includes('only report after the event has ended') || message.includes('event has ended')) {
    return 'Bạn chỉ có thể báo cáo sau khi sự kiện đã kết thúc.';
  }

  if (message.includes('only report events you booked and join') || message.includes('booked and join')) {
    return 'Bạn chỉ có thể báo cáo sự kiện bạn đã đặt và đã tham gia.';
  }

  if (message.includes('already reported') || message.includes('already report')) {
    return 'Bạn đã báo cáo sự kiện này rồi.';
  }

  // Return original message if no match found (might already be in Vietnamese or unknown error)
  return errorMessage;
};

// Utility exports
