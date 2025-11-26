import React from 'react';
import { cn } from '../../lib/utils';

export const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color = 'blue',
  className 
}) => {
  const colorVariants = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      text: "text-blue-600",
      lightBg: "bg-blue-50"
    },
    green: {
      bg: "from-green-500 to-green-600",
      text: "text-green-600",
      lightBg: "bg-green-50"
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      text: "text-purple-600",
      lightBg: "bg-purple-50"
    },
    orange: {
      bg: "from-orange-500 to-orange-600",
      text: "text-orange-600",
      lightBg: "bg-orange-50"
    },
    red: {
      bg: "from-red-500 to-red-600",
      text: "text-red-600",
      lightBg: "bg-red-50"
    }
  };

  const config = colorVariants[color];

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-4 bg-gradient-to-br border border-gray-100 hover:shadow-md transition-all duration-300",
      config.lightBg,
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg bg-gradient-to-br shadow-sm flex items-center justify-center",
          config.bg
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full",
            trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className={cn("text-2xl font-bold", config.text)}>
          {value}
        </div>
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </div>
      </div>
    </div>
  );
};