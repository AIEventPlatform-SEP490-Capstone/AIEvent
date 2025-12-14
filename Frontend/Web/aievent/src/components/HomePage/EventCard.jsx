import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
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
    const actualPrice =
      price?.ticketPrice !== undefined ? price.ticketPrice : price;
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
  const isMostlyBooked = ticketPercentage >= 80;

  const now = new Date();
  const saleStartTime = event.saleStartTime ? new Date(event.saleStartTime) : null;
  const isNotOnSale = saleStartTime && saleStartTime > now;

  // Format date nicely
  const eventDate = new Date(event.startTime || event.date);
  const dayOfWeek = eventDate.toLocaleDateString("vi-VN", { weekday: "short" });
  const dayNum = eventDate.getDate();
  const month = eventDate.toLocaleDateString("vi-VN", { month: "short" });

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]"
      style={{ 
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={
            event.image ||
            (event.imgListEvent && event.imgListEvent[0]) ||
            "/placeholder.svg"
          }
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          {/* Status Badge */}
          <div>
            {event.saleStartTime && event.saleEndTime && event.startTime && event.endTime && (
              <SaleStatusBadge
                saleStartTime={event.saleStartTime}
                saleEndTime={event.saleEndTime}
                startTime={event.startTime}
                endTime={event.endTime}
                onImage={true}
              />
            )}
          </div>

          {/* Like Button - Glassmorphism style */}
          <button
            onClick={handleLikeClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md ${
              isLiked 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-transform duration-300 ${
                isLiked ? "fill-current scale-110" : "group-hover:scale-110"
              }`}
            />
          </button>
        </div>

        {/* Hot badge */}
        {isMostlyBooked && !isSoldOut && (
          <div className="absolute top-16 right-4 z-10">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              HOT
            </div>
          </div>
        )}

        {/* Date badge - Floating card style */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white rounded-xl px-3 py-2 shadow-lg text-center min-w-[60px]">
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{dayOfWeek}</div>
            <div className="text-xl font-bold text-gray-900 leading-tight">{dayNum}</div>
            <div className="text-xs font-medium text-gray-600">{month}</div>
          </div>
        </div>

        {/* Price tag */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
            <span className="text-sm font-bold text-gray-900">{formatPrice(event)}</span>
          </div>
        </div>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
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
          <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            {event.category || event.eventCategoryName || "Event"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {event.title}
        </h3>

        {/* AI Reason */}
        {showReason && event.reason && (
          <div className="mb-4 p-3 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100/50">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-violet-700 mb-0.5">Gợi ý cho bạn</p>
                <p className="text-xs text-gray-600 leading-relaxed">{event.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Event info */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {event.time ||
                new Date(event.startTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{event.locationName || event.location}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span>{event.soldQuantity || 0}/{event.totalTickets || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Heart className="w-3 h-3" />
              <span>{event.favoriteCount || 0}</span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isSoldOut 
                  ? "bg-gray-400" 
                  : isMostlyBooked 
                    ? "bg-gradient-to-r from-orange-400 to-red-500" 
                    : "bg-gradient-to-r from-blue-500 to-violet-500"
              }`}
              style={{ width: `${Math.min(ticketPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleRegisterClick}
            disabled={isLoading || isSoldOut || isNotOnSale}
            className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold text-sm rounded-xl transition-all duration-300 group/btn"
          >
            {isSoldOut ? (
              "Hết vé"
            ) : isNotOnSale ? (
              "Chưa mở bán"
            ) : (
              <span className="flex items-center justify-center gap-2">
                Đặt vé
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
            className="h-11 px-4 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 font-medium text-sm rounded-xl transition-all"
          >
            Chi tiết
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
