import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  MapPin,
  Users,
  Heart,
  MessageCircle,
} from "lucide-react";

const mockEvents = [
  {
    id: "1",
    title: "Tech Conference Vietnam 2024",
    description:
      "Hội thảo công nghệ lớn nhất Việt Nam năm 2024 với sự tham gia của các chuyên gia hàng đầu.",
    location: "TP.HCM",
    date: "2024-12-15",
    time: "08:00",
    price: 500000,
    isFree: false,
    attendees: 500,
    image: "/placeholder.jpg",
    likesCount: 128,
    commentsCount: 45,
    matchPercentage: 95,
  },
  {
    id: "2",
    title: "Indie Music Concert",
    description:
      "Đêm nhạc indie với các nghệ sĩ trẻ tài năng, mang đến những giai điệu mới mẻ và sáng tạo.",
    location: "Hà Nội",
    date: "2024-12-20",
    time: "19:30",
    price: 200000,
    isFree: false,
    attendees: 150,
    image: "/placeholder.jpg",
    likesCount: 89,
    commentsCount: 23,
    matchPercentage: 88,
  },
  {
    id: "3",
    title: "Coffee & Networking",
    description:
      "Buổi gặp mặt và kết nối trong không gian ấm cúng với cà phê thơm ngon và nhiều cơ hội networking.",
    location: "Đà Nẵng",
    date: "2024-12-22",
    time: "14:00",
    price: 0,
    isFree: true,
    attendees: 75,
    image: "/placeholder.jpg",
    likesCount: 56,
    commentsCount: 12,
    matchPercentage: 82,
  },
];

export function EventDiscovery() {
  const formatPrice = (price, isFree) => {
    if (isFree || price === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl transition-all duration-300 ease-in-out">
      {/* AI Recommendations Header */}
      <div className="mb-12 transition-opacity duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl border border-blue-200/30">
            <Sparkles className="w-7 h-7 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-balance">
              Gợi ý từ AI dành cho bạn
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Được cá nhân hóa dựa trên sở thích của bạn
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/20 dark:via-indigo-950/15 dark:to-purple-950/20 rounded-3xl p-8 border border-blue-200/40 dark:border-blue-800/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-gray-900 bg-blue-100 dark:text-blue-900 dark:bg-blue-100 px-2 py-1 rounded-full">
                    AI Powered
                  </span>
                </div>
                <div className="h-1 w-1 bg-muted-foreground/40 rounded-full"></div>
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Cập nhật realtime
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">
                Tìm thấy <span className="text-blue-600">{mockEvents.length}</span>{" "}
                sự kiện phù hợp
              </h3>
              <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                Dựa trên sở thích{" "}
                <span className="font-semibold text-blue-600">công nghệ</span>,{" "}
                <span className="font-semibold text-purple-600">âm nhạc</span> và
                các hoạt động{" "}
                <span className="font-semibold text-indigo-600">networking</span>{" "}
                của bạn
              </p>
            </div>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 px-8"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Xem tất cả gợi ý
            </Button>
          </div>
        </div>
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-300">
        {mockEvents.map((event) => (
          <Card
            key={event.id}
            className="group overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border-border/50 bg-card relative hover:-translate-y-1 transition-opacity duration-300"
          >
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-blue-100 text-blue-900 font-bold shadow-lg border border-blue-200 px-3 py-1.5 rounded-full text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600 inline" />
                AI Gợi ý
              </div>
            </div>

            <div className="relative">
              <img
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="absolute top-4 right-4 flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white shadow-lg"
                >
                  <Heart className="w-4 h-4 text-gray-800" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white shadow-lg"
                >
                  <MessageCircle className="w-4 h-4 text-gray-800" />
                </Button>
              </div>

              <div className="absolute bottom-4 left-4">
                <div className="bg-white/95 backdrop-blur-sm text-gray-900 font-bold px-3 py-1.5 shadow-lg border border-white/20 rounded-full text-sm">
                  {formatPrice(event.price, event.isFree)}
                </div>
              </div>
            </div>

            <CardHeader className="pb-3 pt-5">
              <h4 className="font-bold text-lg leading-tight text-balance text-card-foreground group-hover:text-blue-600 transition-colors">
                {event.title}
              </h4>
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed line-clamp-2">
                {event.description}
              </p>

              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200/30 dark:border-blue-800/20">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-1">
                      Tại sao phù hợp với bạn:
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                      {event.matchPercentage}% phù hợp dựa trên sở thích và lịch sử tham gia sự kiện của bạn
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-5">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-800 dark:text-gray-200">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  <span>
                    {new Date(event.date).toLocaleDateString("vi-VN")} • {event.time}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-800 dark:text-gray-200">
                  <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{event.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{event.commentsCount || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    size="sm"
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    size="sm"
                  >
                    Đăng ký
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 hover:bg-blue-50 text-blue-600 bg-transparent hover:border-blue-300 transition-colors"
                  >
                    Chi tiết
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-12">
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-3 border-border hover:bg-muted text-foreground font-semibold bg-transparent"
        >
          Xem thêm sự kiện thú vị (0 sự kiện khác)
        </Button>
      </div>
    </div>
  );
}