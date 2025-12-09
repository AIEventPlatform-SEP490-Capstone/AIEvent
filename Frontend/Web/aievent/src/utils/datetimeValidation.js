// DateTime validation utilities
export const datetimeValidation = {
  // Get max date (2 months from now)
  getMaxDate: (now = new Date()) => {
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 2);
    return maxDate;
  },

  // Validate that a date is in the future
  isFutureDate: (dateString, now = new Date()) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date > now;
  },

  // Validate that a date is within 2 months from now
  isWithinTwoMonths: (dateString, now = new Date()) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const maxDate = datetimeValidation.getMaxDate(now);
    return date <= maxDate;
  },

  // Validate date relationships
  isBefore: (date1, date2) => {
    if (!date1 || !date2) return false;
    return new Date(date1) < new Date(date2);
  },

  isAfter: (date1, date2) => {
    if (!date1 || !date2) return false;
    return new Date(date1) > new Date(date2);
  },

  // Validate that sale start time is before sale end time and event start time
  validateSaleTimeRange: (saleStart, saleEnd, eventStart) => {
    const errors = [];

    if (saleStart && saleEnd) {
      if (!datetimeValidation.isBefore(saleStart, saleEnd)) {
        errors.push('Thời gian bắt đầu bán vé phải trước thời gian kết thúc bán vé');
      }
    }

    if (saleStart && eventStart) {
      if (!datetimeValidation.isBefore(saleStart, eventStart)) {
        errors.push('Thời gian bắt đầu bán vé phải trước thời gian bắt đầu sự kiện');
      }
    }

    if (saleEnd && eventStart) {
      if (!datetimeValidation.isBefore(saleEnd, eventStart)) {
        errors.push('Thời gian kết thúc bán vé phải trước thời gian bắt đầu sự kiện');
      }
    }

    return errors;
  },

  // Validate that event start time is before event end time
  validateEventTimeRange: (eventStart, eventEnd) => {
    if (eventStart && eventEnd) {
      return datetimeValidation.isBefore(eventStart, eventEnd);
    }
    return true;
  },

  // Get appropriate error message for a date based on min constraint
  getDateMinError: (dateString, minDate, fieldName) => {
    if (!dateString || !minDate) return '';
    
    const date = new Date(dateString);
    const min = new Date(minDate);
    
    if (date < min) {
      // Check if minDate is current time (within 1 second)
      const timeDiff = Math.abs(min - new Date());
      if (timeDiff < 1000) {
        return `${fieldName} phải sau thời điểm hiện tại`;
      } else {
        return `${fieldName} phải sau ${min.toLocaleString('vi-VN')}`;
      }
    }
    
    return '';
  },

  // Get appropriate error message for a date based on max constraint
  getDateMaxError: (dateString, maxDate, fieldName) => {
    if (!dateString || !maxDate) return '';
    
    const date = new Date(dateString);
    const max = new Date(maxDate);
    
    if (date > max) {
      return `${fieldName} phải trước ${max.toLocaleString('vi-VN')}`;
    }
    
    return '';
  }
};

export default datetimeValidation;