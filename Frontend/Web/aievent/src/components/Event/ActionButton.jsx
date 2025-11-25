import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'primary',
  className 
}) => {
  const variants = {
    primary: {
      button: "bg-gradient-to-r from-primary to-accent hover:shadow-lg text-white border-0",
      icon: "bg-white/20 text-white"
    },
    secondary: {
      button: "bg-white hover:bg-gray-50 text-foreground border-2 border-gray-200 hover:border-primary/30",
      icon: "bg-primary/10 text-primary"
    },
    danger: {
      button: "bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-300",
      icon: "bg-red-100 text-red-600"
    }
  };

  const config = variants[variant];

  return (
    <Button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl py-6 justify-start font-semibold transition-all duration-300 group",
        config.button,
        className
      )}
      size="lg"
    >
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center mr-3 transition-transform group-hover:scale-110",
        config.icon
      )}>
        <Icon className="w-4 h-4" />
      </div>
      {label}
    </Button>
  );
};