import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export function AIRecommendationWidget({
  userId,
  className = "",
  showFeedback = true,
  limit = 6,
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(new Set());

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const recs = [];

      setRecommendations(recs);
      setEvents([]);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackReason = (event) => {
    const reasons = [
      "Sự kiện phổ biến trong khu vực của bạn",
      "Phù hợp với xu hướng hiện tại",
      "Nhiều người quan tâm đến loại sự kiện này",
      "Thời gian và địa điểm thuận tiện",
      "Giá cả hợp lý cho chất lượng sự kiện",
      "Được đánh giá cao bởi cộng đồng",
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  useEffect(() => {
    loadRecommendations();
  }, [userId, limit]);

  const handleEventClick = (eventId) => {
    console.log("Track user activity: view_event", eventId);
    window.location.href = `/event/${eventId}`;
  };

  const handleBooking = (eventId) => {
    console.log("Track user activity: book_event", eventId);
    window.location.href = `/booking/${eventId}`;
  };

  const handleFeedback = (eventId, feedback) => {
    console.log("Provide feedback:", feedback, eventId);
    setFeedbackGiven((prev) => new Set([...prev, eventId]));

    alert(
      feedback === "positive"
        ? "Cảm ơn phản hồi!\nChúng tôi sẽ gợi ý nhiều sự kiện tương tự hơn"
        : "Đã ghi nhận\nChúng tôi sẽ cải thiện gợi ý cho bạn"
    );
  };

  const formatPrice = (price, isFree) => {
    if (isFree || price === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600 animate-pulse" />
            <CardTitle className="text-lg">AI đang phân tích...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-lg -m-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <CardTitle className="text-lg font-bold">
                Gợi ý từ AI dành cho bạn
              </CardTitle>
              <p className="text-sm text-white/90">
                Được cá nhân hóa dựa trên sở thích của bạn
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRecommendations}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/20 rounded-full">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              AI Powered
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            • Cập nhật realtime
          </span>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Tìm thấy <span className="text-orange-600">{events.length}</span> sự
            kiện phù hợp
          </h3>
          <p className="text-sm text-muted-foreground">
            Dựa trên sở thích{" "}
            <span className="text-orange-600 font-medium">công nghệ</span>,{" "}
            <span className="text-orange-600 font-medium">âm nhạc</span> và các
            hoạt động{" "}
            <span className="text-orange-600 font-medium">networking</span> của
            bạn
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Không tìm thấy sự kiện nào</p>
              <p className="text-sm">
                Hãy tương tác với các sự kiện để AI học được sở thích của bạn
              </p>
            </div>
          ) : (
            events.map((event, index) => {
              const recommendation = recommendations[index];
              return (
                <div
                  key={event.id}
                  className="group border rounded-lg p-6 hover:shadow-md transition-all duration-200 w-full"
                >
                  <div className="flex gap-6 w-full">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <h4
                          className="font-semibold text-lg leading-tight cursor-pointer hover:text-orange-600 transition-colors text-balance flex-1"
                          onClick={() => handleEventClick(event.id)}
                        >
                          {event.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-sm flex-shrink-0 whitespace-nowrap"
                        >
                          {Math.round(recommendation.score)}% phù hợp
                        </Badge>
                      </div>
                      <div className="space-y-3 mb-5">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>
                            {new Date(event.date).toLocaleDateString("vi-VN")} •{" "}
                            {event.time}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-md p-4 mb-5">
                        <p className="text-sm text-orange-700 dark:text-orange-300 font-medium leading-relaxed">
                          <Sparkles className="w-4 h-4 inline mr-2 flex-shrink-0" />
                          {recommendation.reason}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <Badge
                            variant="secondary"
                            className="text-sm whitespace-nowrap"
                          >
                            {formatPrice(event.price, event.isFree)}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center whitespace-nowrap">
                            <Users className="w-4 h-4 mr-1" />
                            {event.attendees}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {showFeedback && !feedbackGiven.has(event.id) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600"
                                onClick={() =>
                                  handleFeedback(event.id, "positive")
                                }
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                onClick={() =>
                                  handleFeedback(event.id, "negative")
                                }
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-sm text-orange-600 hover:text-orange-700 whitespace-nowrap"
                            onClick={() => handleBooking(event.id)}
                          >
                            Đặt vé
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {events.length > 0 && (
          <div className="pt-6 border-t mt-8">
            <Button
              variant="outline"
              className="w-full bg-transparent border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
              onClick={() => (window.location.href = "/discover")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Xem tất cả gợi ý
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
