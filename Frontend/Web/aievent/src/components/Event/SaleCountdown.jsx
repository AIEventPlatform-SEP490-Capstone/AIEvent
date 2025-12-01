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
      <div className="absolute inset-0 rounded-lg">
        <div className="absolute bottom-2 left-2 flex flex-col items-start">
          <div className="bg-black/70 backdrop-blur-lg rounded px-2 py-1 mb-1">
            <span className="text-lg text-white font-bold">Bắt đầu sau</span>
          </div>
          <div className="flex gap-1">
            <div className="bg-blue-500 rounded px-2 py-1">
              <span className="text-white font-bold text-base">
                {timeRemaining.days}d
              </span>
            </div>
            <div className="bg-blue-500 rounded px-2 py-1">
              <span className="text-white font-bold text-base">
                {timeRemaining.hours}h
              </span>
            </div>
            <div className="bg-blue-500 rounded px-2 py-1">
              <span className="text-white font-bold text-base">
                {timeRemaining.minutes}m
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - shows full countdown below metrics
  return (
    <div className="mt-2">
      <div className="text-lg text-slate-600 dark:text-slate-400 mb-1 text-center">Bán vé bắt đầu sau</div>
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