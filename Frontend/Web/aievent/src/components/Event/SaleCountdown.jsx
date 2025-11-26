import React, { useState, useEffect } from 'react';

const SaleCountdown = ({ saleStartTime, variant = 'default' }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [saleStarted, setSaleStarted] = useState(false);

  useEffect(() => {
    if (!saleStartTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const saleStart = new Date(saleStartTime);
      
      // If sale has already started, hide the countdown
      if (now >= saleStart) {
        setSaleStarted(true);
        setTimeRemaining(null);
        return;
      }
      
      // Calculate time remaining
      const diff = saleStart - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
      setSaleStarted(false);
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [saleStartTime]);

  // If sale has started or no start time, don't show anything
  if (saleStarted || !saleStartTime || !timeRemaining) {
    return null;
  }

  // Thumbnail variant - shows compact countdown overlay on image
  if (variant === 'thumbnail') {
    return (
      <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-white font-bold text-center">
            <div>Bắt đầu sau</div>
            <div className="flex gap-1 mt-1">
              <div className="bg-blue-500 rounded px-1 py-0.5">
                {timeRemaining.days}d
              </div>
              <div className="bg-blue-500 rounded px-1 py-0.5">
                {timeRemaining.hours}h
              </div>
              <div className="bg-blue-500 rounded px-1 py-0.5">
                {timeRemaining.minutes}m
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - shows full countdown below metrics
  return (
    <div className="mt-2">
      <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 text-center">Bán vé bắt đầu sau</div>
      <div className="flex justify-center gap-1">
        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
          {timeRemaining.days}d
        </div>
        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
          {timeRemaining.hours}h
        </div>
        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
          {timeRemaining.minutes}m
        </div>
        <div className="bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
          {timeRemaining.seconds}s
        </div>
      </div>
    </div>
  );
};

export default SaleCountdown;