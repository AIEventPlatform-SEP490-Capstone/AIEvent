import React from 'react';
import { Users, Eye, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

export const RegistrationStats = ({ event }) => {
  const totalTickets = event.totalTickets || event.totalPerson || 0;
  const soldQuantity = event.totalPersonJoin || event.soldQuantity || 0;
  const occupancyPercent = totalTickets > 0 ? (soldQuantity / totalTickets) * 100 : 0;
  const viewCount = event.viewCount || 0;
  const favoriteCount = event.favoriteCount || 0;

  return (
    <div className="space-y-5">
      {/* Progress Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Đăng ký</span>
          </div>
          <span className={cn(
            "text-sm font-bold",
            occupancyPercent >= 80 ? "text-red-500" : 
            occupancyPercent >= 50 ? "text-orange-500" : "text-blue-600"
          )}>
            {soldQuantity} / {totalTickets}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              occupancyPercent >= 80 ? "bg-gradient-to-r from-red-400 to-red-500" : 
              occupancyPercent >= 50 ? "bg-gradient-to-r from-orange-400 to-orange-500" : 
              "bg-gradient-to-r from-blue-400 to-blue-500"
            )}
            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">
          {occupancyPercent.toFixed(0)}% đã bán
        </p>
      </div>

      {/* View & Favorite Row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <Eye className="w-4 h-4" />
          <span className="text-sm">{viewCount} lượt xem</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Heart className="w-4 h-4 text-red-400" />
          <span className="text-sm">{favoriteCount} yêu thích</span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationStats;
