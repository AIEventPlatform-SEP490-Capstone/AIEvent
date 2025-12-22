import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'primary',
  className,
  disabled = false
}) => {
  const variants = {
    primary: {
      button: "!bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700 hover:shadow-lg !text-white !border-0 disabled:!from-blue-600 disabled:!to-indigo-600 disabled:!text-white disabled:!bg-gradient-to-r",
      icon: "!bg-white/20 !text-white"
    },
    secondary: {
      button: "!bg-white hover:!bg-gray-50 !text-gray-800 !border-2 !border-gray-200 hover:!border-blue-300 disabled:!bg-white disabled:!text-gray-800",
      icon: "!bg-blue-100 !text-blue-600"
    },
    danger: {
      button: "!bg-white hover:!bg-red-50 !text-red-600 !border-2 !border-red-200 hover:!border-red-300 disabled:!bg-white disabled:!text-red-600",
      icon: "!bg-red-100 !text-red-600"
    }
  };

  const config = variants[variant];

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="ghost"
      className={cn(
        "w-full rounded-xl py-6 justify-start font-semibold transition-all duration-300 group",
        config.button,
        disabled && "!opacity-50 !cursor-not-allowed",
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