// File: src/components/ui/date-time-picker.jsx
import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Card, CardContent } from './card';

const DateTimePicker = ({ value, onChange, id, className = '', min, label, ...props }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

useEffect(() => {
  if (value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      // Format as local date/time strings
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${minutes}`);
    }
  } else {
    setDate('');
    setTime('');
  }
  setError('');
}, [value]);

  const now = new Date();
  const minDate = min ? new Date(min) : now;
  const minDateStr = minDate.toISOString().slice(0, 10);
  const minTimeStr = date === minDateStr ? minDate.toISOString().slice(11, 16) : '00:00';

  const validateAndEmit = (dateVal, timeVal) => {
  if (!dateVal || !timeVal) {
    onChange('');
    return;
  }
  
  // Create date using local time components
  const [year, month, day] = dateVal.split('-');
  const [hours, minutes] = timeVal.split(':');
  
  const selected = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
  
  // Remove automatic validation
  setError('');
  onChange(selected.toISOString());
};

  const handleDate = (e) => {
    const val = e.target.value;
    setDate(val);
    validateAndEmit(val, time);
  };

  const handleTime = (e) => {
    const val = e.target.value;
    setTime(val);
    validateAndEmit(date, val);
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      <Card className="border border-input bg-background rounded-lg">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Ngày</div>
              <Input type="date" value={date} onChange={handleDate} min={minDateStr} {...props} />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Giờ</div>
              <Input type="time" value={time} onChange={handleTime} min={minTimeStr} {...props} />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default DateTimePicker;