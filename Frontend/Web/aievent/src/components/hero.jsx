import React from "react"
import { NavLink } from "react-router-dom"
import { useSelector } from "react-redux"
import { Button } from "./ui/button"
import { Sparkles, Calendar, Users, MapPin, LogIn } from "lucide-react"

export function Hero() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <section className="relative bg-orange-50 bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 lg:py-32 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                AI-Powered Event Discovery
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Khám phá sự kiện{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-red-700 animate-gradient">
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
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl">
                <Calendar className="w-5 h-5 mr-2" />
                Khám phá sự kiện
              </Button>

              {!isAuthenticated ? (
                <Button asChild variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                  <NavLink to="/auth/login">
                    <LogIn className="w-5 h-5 mr-2" />
                    Đăng nhập
                  </NavLink>
                </Button>
              ) : (
                 <Button variant="outline" size="lg" className="px-8 py-6 text-base bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-105 transition-all duration-300 rounded-xl shadow-md hover:shadow-lg border-2">
                <Users className="w-5 h-5 mr-2" />
                Trở thành Organizer
              </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200/60">
              <div className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">1000+</div>
                <div className="text-sm text-gray-600 font-medium mt-1">Sự kiện</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">50K+</div>
                <div className="text-sm text-gray-600 font-medium mt-1">Người dùng</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">25+</div>
                <div className="text-sm text-gray-600 font-medium mt-1">Thành phố</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative animate-fade-in animation-delay-200">
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center shadow-md">
                    <Sparkles className="w-7 h-7 text-orange-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">AI Gợi ý thông minh</h3>
                    <p className="text-sm text-gray-600">Cá nhân hóa theo sở thích</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                    <Calendar className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Tech Conference Vietnam 2024</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        TP.HCM • 15/12/2024
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold shadow-sm">
                      95% phù hợp
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                    <Calendar className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Indie Music Concert</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        Hà Nội • 20/12/2024
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold shadow-sm">
                      88% phù hợp
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                    <Calendar className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Coffee & Networking</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        Đà Nẵng • 22/12/2024
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold shadow-sm">
                      82% phù hợp
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-300/40 rounded-full opacity-60 animate-pulse blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-amber-300/40 rounded-full opacity-60 animate-pulse delay-1000 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}