import React, { useState } from 'react';
import { Input } from './input';
import { Card, CardContent } from './card';

const DateTimePicker = ({ value, onChange, id, className = '', min, label, ...props }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Initialize from value prop
  React.useEffect(() => {
    if (value) {
      // Handle both datetime-local format and ISO string format
      let dateObj;
      if (typeof value === 'string' && value.includes('T')) {
        // ISO string format
        dateObj = new Date(value);
      } else if (typeof value === 'string') {
        // datetime-local format
        dateObj = new Date(value);
      } else {
        dateObj = new Date(value);
      }
      
      // Format date as YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      
      // Format time as HH:MM
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    } else {
      setDate('');
      setTime('');
    }
  }, [value]);

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    if (newDate && time) {
      const dateTimeString = `${newDate}T${time}`;
      onChange && onChange(dateTimeString);
    }
  };

  // Handle time change
  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (date && newTime) {
      const dateTimeString = `${date}T${newTime}`;
      onChange && onChange(dateTimeString);
    }
  };

  // Extract date part from min attribute
  const minDate = min ? min.split('T')[0] : undefined;

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      <Card className="border border-input bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Ngày</div>
              <Input
                type="date"
                id={`${id}-date`}
                value={date}
                onChange={handleDateChange}
                min={minDate}
                className="h-10 w-full"
                {...props}
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Giờ</div>
              <Input
                type="time"
                id={`${id}-time`}
                value={time}
                onChange={handleTimeChange}
                className="h-10 w-full"
                {...props}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateTimePicker;