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
  TrendingUp,
  Zap,
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

  return (
    <Card
      onClick={handleCardClick}
      className="group h-full overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-blue-400/50 cursor-pointer flex flex-col bg-white rounded-xl"
    >
      {/* Image Container with Overlay */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-video">
        <img
          src={
            event.image ||
            (event.imgListEvent && event.imgListEvent[0]) ||
            "/placeholder.svg"
          }
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top Row: Status + Like Button */}
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start">
          {/* Left: Sale Status Badge */}
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

          {/* Right: Like Button with Enhanced Design */}
          <button
            onClick={handleLikeClick}
            className="h-10 w-10 rounded-full bg-white/25 backdrop-blur-md border border-white/50 hover:bg-white/40 shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-115 group-hover:opacity-100 opacity-70 hover:shadow-2xl"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                isLiked
                  ? "fill-red-500 text-red-500 scale-125"
                  : "text-white group-hover:text-red-200"
              }`}
            />
          </button>
        </div>

        {/* Bottom Row: Category + Price */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end">
          {/* Category Badge */}
          <Badge className="bg-white/95 backdrop-blur-sm text-gray-900 shadow-lg px-3 py-1 text-xs font-semibold hover:bg-white transition-colors">
            {event.category || event.eventCategoryName || "Event"}
          </Badge>

          {/* Price Badge with Emphasis */}
          <div className="bg-white rounded-lg px-3 py-1.5 shadow-lg font-bold text-gray-900 text-sm">
            {formatPrice(event)}
          </div>
        </div>

        {/* Hot/Popular Indicator */}
        {isMostlyBooked && !isSoldOut && (
          <div className="absolute top-12 right-3 z-10 flex items-center gap-1 bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
            <Zap className="w-3.5 h-3.5" />
            Đang hot
          </div>
        )}

        {/* Sold Out Badge */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-white text-center">
              <div className="text-2xl font-bold">Hết vé</div>
              <div className="text-sm mt-1">Event đã kín chỗ</div>
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <CardContent className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-base leading-snug mb-3 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
          {event.title}
        </h3>

        {/* AI Recommendation Reason */}
        {showReason && event.reason && (
          <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors duration-300">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-700">
                  ✨ Đề xuất cho bạn
                </p>
                <p className="text-xs text-blue-600 mt-1">{event.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Event Information Grid */}
        <div className="space-y-2.5 mb-5 flex-1">
          {/* Date & Time Row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 flex-1">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="font-medium truncate">
                {new Date(event.startTime || event.date).toLocaleDateString(
                  "vi-VN"
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="font-medium">
                {event.time ||
                  new Date(event.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="truncate font-medium">
              {event.locationName || event.location}
            </span>
          </div>

          {/* Ticket Capacity Section */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Users className="w-4 h-4 text-gray-500" />
                <span>
                  {event.soldQuantity || 0}/{event.totalTickets || 0} người đã mua
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span>{event.favoriteCount || 0}</span>
              </div>
            </div>

            {/* Capacity Bar with Animation */}
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${Math.min(ticketPercentage, 100)}%` }}
              />
            </div>

            {/* Ticket Status Text */}
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-semibold ${
                  isSoldOut
                    ? "text-red-600"
                    : isMostlyBooked
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {isSoldOut
                  ? "Đã hết vé"
                  : isMostlyBooked
                  ? `⚠️ Còn ${event.totalTickets - (event.soldQuantity || 0)} vé`
                  : `${100 - Math.round(ticketPercentage)}% còn lại`}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(ticketPercentage)}% đã bán
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Button
            onClick={handleRegisterClick}
            disabled={isLoading || isSoldOut}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300 group/btn rounded-lg"
          >
            {isSoldOut ? (
              "Hết vé"
            ) : (
              <>
                <span>Mua vé</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
          <Button
            onClick={handleCardClick}
            variant="outline"
            className="flex-1 border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold text-sm transition-all duration-300 rounded-lg"
          >
            Chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default EventCard;
