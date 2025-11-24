import React from 'react';
import { cn } from '../../lib/utils';

export const SidebarCard = ({ title, icon, children, className, gradient = false }) => {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <div className={cn(
        "px-6 py-4 border-b border-gray-100",
        gradient ? "bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" : "bg-gray-50/50"
      )}>
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <div className="text-white">
                {icon}
              </div>
            </div>
          )}
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};