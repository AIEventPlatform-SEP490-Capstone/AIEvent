import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Clock,
  ArrowRight,
  Sparkles,
  Flame,
  Ticket,
} from "lucide-react";
import { SaleStatusBadge } from "./SaleStatusBadge";

export function EventCard({
  event,
  onLike,
  onViewDetail,
  isLiked = false,
  showReason = false,
  onRegister,
  isLoading = false,
}) {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    const actualPrice = price?.ticketPrice !== undefined ? price.ticketPrice : price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(actualPrice);
  };

  const handleCardClick = () => {
    if (onViewDetail) {
      onViewDetail(event.eventId || event.id);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onLike) {
      onLike(event.eventId || event.id);
    }
  };

  const handleRegisterClick = (e) => {
    e.stopPropagation();
    if (onRegister) {
      onRegister(event.eventId || event.id);
    } else {
      navigate(`/booking/${event.eventId || event.id}`);
    }
  };

  const ticketPercentage = event.totalTickets
    ? ((event.soldQuantity || 0) / event.totalTickets) * 100
    : 0;

  const isSoldOut = ticketPercentage >= 100;
  const isHot = ticketPercentage >= 70;

  const now = new Date();
  const saleStartTime = event.saleStartTime ? new Date(event.saleStartTime) : null;
  const isNotOnSale = saleStartTime && saleStartTime > now;

  const eventDate = new Date(event.startTime || event.date);
  const dayNum = eventDate.getDate();
  const month = eventDate.toLocaleDateString("vi-VN", { month: "short" });

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2"
      style={{
        boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.image || (event.imgListEvent && event.imgListEvent[0]) || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <div className="flex items-center gap-2">
            {event.saleStartTime && event.saleEndTime && event.startTime && event.endTime && (
              <SaleStatusBadge
                saleStartTime={event.saleStartTime}
                saleEndTime={event.saleEndTime}
                startTime={event.startTime}
                endTime={event.endTime}
                onImage={true}
              />
            )}
            {isHot && !isSoldOut && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                <Flame className="w-3 h-3" />
                HOT
              </div>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md ${
              isLiked
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <Heart className={`w-5 h-5 transition-all ${isLiked ? "fill-current scale-110" : ""}`} />
          </button>
        </div>

        {/* Bottom Info on Image */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
          {/* Date Badge */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 text-center shadow-xl">
            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{dayNum}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{month}</div>
          </div>

          {/* Price */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(event)}</span>
          </div>
        </div>

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <div className="text-white text-xl font-bold">Hết vé</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-3 py-1.5 rounded-full">
            {event.category || event.eventCategoryName || "Event"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
          {event.title}
        </h3>

        {/* AI Reason */}
        {showReason && event.reason && (
          <div className="mb-4 p-4 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-500/10 dark:to-blue-500/10 rounded-2xl border border-violet-100 dark:border-violet-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-1">AI gợi ý</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{event.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Event Info */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <span>
              {event.time ||
                new Date(event.startTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-gray-500" />
            </div>
            <span className="truncate">{event.locationName || event.location}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span className="font-medium">{event.soldQuantity || 0}/{event.totalTickets || 0} vé</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Heart className="w-3.5 h-3.5" />
              <span>{event.favoriteCount || 0}</span>
            </div>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isSoldOut
                  ? "bg-gray-400"
                  : isHot
                  ? "bg-gradient-to-r from-orange-400 to-red-500"
                  : "bg-gradient-to-r from-violet-500 to-blue-500"
              }`}
              style={{ width: `${Math.min(ticketPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleRegisterClick}
            disabled={isLoading || isSoldOut || isNotOnSale}
            className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 group/btn"
          >
            {isSoldOut ? (
              "Hết vé"
            ) : isNotOnSale ? (
              "Chưa mở bán"
            ) : (
              <span className="flex items-center justify-center gap-2">
                Đặt vé ngay
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </span>
            )}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            variant="outline"
            className="h-12 px-5 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-xl transition-all"
          >
            Chi tiết
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
