import React from 'react';
import {
  Edit,
  Eye,
  Copy,
  Trash2,
  Users,
  MessageCircle,
  MapPin,
  ExternalLink,
  User,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/button';
import { SidebarCard } from './SidebarCard';
import { ActionButton } from './ActionButton';
import { StatCard } from './StatCard';

export const EnhancedSidebar = ({
  event,
  onEdit,
  onViewPublic,
  onClone,
  onDelete,
  onViewMap,
  onOpenImage
}) => {
  const totalAvailableTickets = event.totalTickets - (event.soldQuantity || 0);
  const occupancyPercent = event.soldQuantity ? (event.soldQuantity / event.totalTickets) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <SidebarCard title="Hành động nhanh" icon={<Target className="w-4 h-4" />} gradient>
        <div className="space-y-3">
          <ActionButton
            icon={Edit}
            label="Chỉnh sửa sự kiện"
            onClick={onEdit}
            variant="primary"
          />
          
          <ActionButton
            icon={Eye}
            label="Xem trang công khai"
            onClick={onViewPublic}
            variant="secondary"
          />

          <ActionButton
            icon={Copy}
            label="Sao chép sự kiện"
            onClick={onClone}
            variant="secondary"
          />

          <div className="pt-3 border-t border-gray-100" />

          <ActionButton
            icon={Trash2}
            label="Xóa sự kiện"
            onClick={onDelete}
            variant="danger"
          />
        </div>
      </SidebarCard>

      {/* Registration Statistics */}
      <SidebarCard title="Thống kê đăng ký" icon={<TrendingUp className="w-4 h-4" />} gradient>
        <div className="space-y-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Users}
              label="Đã đăng ký"
              value={event.soldQuantity || 0}
              color="blue"
            />
            <StatCard
              icon={Target}
              label="Còn lại"
              value={totalAvailableTickets}
              color="green"
            />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Tiến độ</span>
              <span className="font-bold text-primary">{occupancyPercent.toFixed(0)}%</span>
            </div>
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {event.soldQuantity || 0} / {event.totalTickets} vé
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button 
              variant="outline"
              className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
            >
              <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Xem danh sách tham gia
            </Button>

            <Button 
              variant="outline"
              className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
            >
              <MessageCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Gửi thông báo
            </Button>
          </div>
        </div>
      </SidebarCard>

      {/* Location Card */}
      {(!event.isOnlineEvent || event.isOnlineEvent === false) &&
        (event.locationName || event.address || event.district) && (
          <SidebarCard title="Địa điểm" icon={<MapPin className="w-4 h-4" />}>
            <div className="space-y-4">
              {/* Location Info */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-sm mb-1">
                      {event.locationName}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {event.address}
                      {event.district && `, ${event.district}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map Preview */}
              <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gray-100 group hover:border-primary/30 transition-all">
                {event.latitude && event.longitude ? (
                  <>
                    <iframe
                      src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      title="Event Location Map Preview"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <span className="text-xs text-gray-400 font-medium">
                        Bản đồ không khả dụng
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* View Directions Button */}
              <Button 
                variant="outline" 
                className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
                onClick={onViewMap}
              >
                <ExternalLink className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Xem đường đi
              </Button>
            </div>
          </SidebarCard>
        )}

      {/* Evidence Images */}
      {event.imgListEvidences && event.imgListEvidences.length > 0 && event.imgListEvidences.some(img => 
        img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
      ) && (
        <SidebarCard title="Hình ảnh bằng chứng" icon={<Calendar className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-3">
            {event.imgListEvidences
              .filter(img => 
                img && typeof img === 'string' && img.trim() !== '' && !img.includes('System.Collections.Generic.List')
              )
              .map((img, index) => (
                <div 
                  key={index} 
                  className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer aspect-square"
                  onClick={() => onOpenImage(img)}
                >
                  <img
                    src={img}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <p className="text-xs font-semibold text-gray-800">Xem ảnh</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </SidebarCard>
      )}

      {/* Organizer */}
      {event.organizerEvent && (
        <SidebarCard title="Nhà tổ chức" icon={<User className="w-4 h-4" />}>
          <div className="space-y-4">
            {/* Organizer Header */}
            <div className="flex items-start gap-3">
              {event.organizerEvent.imgCompany ? (
                <div className="relative">
                  <img 
                    src={event.organizerEvent.imgCompany} 
                    alt={event.organizerEvent.companyName || "Organizer"} 
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2 border-white shadow-md ring-2 ring-primary/10"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-sm" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md flex-shrink-0">
                  <User className="h-7 w-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm mb-1 truncate">
                  {event.organizerEvent.companyName || "Nhà tổ chức"}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {event.organizerEvent.companyDescription || "Tổ chức sự kiện chuyên nghiệp"}
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {event.organizerEvent.totalEvents || "15+"}
                </div>
                <div className="text-xs font-medium text-blue-700 mt-0.5">Sự kiện</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {event.organizerEvent.rating || "4.8"}
                  <span className="text-sm">★</span>
                </div>
                <div className="text-xs font-medium text-purple-700 mt-0.5">Đánh giá</div>
              </div>
            </div>

            {/* Contact Button */}
            <Button 
              variant="outline"
              className="w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold rounded-xl py-5 transition-all group"
            >
              <MessageCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Liên hệ nhà tổ chức
            </Button>
          </div>
        </SidebarCard>
      )}
    </div>
  );
};