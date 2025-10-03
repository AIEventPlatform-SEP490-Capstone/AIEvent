import React from "react"
import { NavLink } from "react-router-dom"
import { Button } from "./ui/button"
import { Sparkles, Calendar, Users, MapPin } from "lucide-react"

export function Hero() {
  return (
    <section className="relative bg-orange-50 bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 lg:py-32 ">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Event Discovery
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Khám phá sự kiện{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                  hoàn hảo
                </span>{" "}
                cho bạn
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Sử dụng AI để tìm kiếm và gợi ý các sự kiện phù hợp với sở thích của bạn. Kết nối với cộng đồng và tạo
                ra những trải nghiệm đáng nhớ.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Calendar className="w-5 h-5 mr-2" />
                Khám phá sự kiện
              </Button>

              <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                <Users className="w-5 h-5 mr-2" />
                Trở thành Organizer
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-600">Sự kiện</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Người dùng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">25+</div>
                <div className="text-sm text-gray-600">Thành phố</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Gợi ý thông minh</h3>
                    <p className="text-sm text-gray-600">Cá nhân hóa theo sở thích</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Tech Conference Vietnam 2024</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        TP.HCM • 15/12/2024
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      95% phù hợp
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Indie Music Concert</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Hà Nội • 20/12/2024
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      88% phù hợp
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Coffee & Networking</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Đà Nẵng • 22/12/2024
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      82% phù hợp
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-amber-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  )
}