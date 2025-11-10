import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import {Calendar, Users, LogIn, ArrowRight, Map, User, UserRound, BookImage } from "lucide-react";
import panelImage from "../../assets/panel.webp";

export function Hero() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <section 
      className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-sky-50/40"
      style={{
        backgroundImage: `url(${panelImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Modern light gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-orange-50/5 to-sky-50/4 z-[1]"></div>
      
      {/* Animated mesh gradient - light colors */}
      <div className="absolute inset-0 opacity-5 z-[2]">
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-orange-200 rounded-full mix-blend-multiply filter blur-[128px] animate-blob"></div>
        <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-sky-200 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-orange-100 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-[3]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-8xl sm:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold text-white leading-[1.1] tracking-tight">
                Khám phá sự kiện{" "}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-500 to-orange-500 animate-gradient-x">
                    hoàn hảo
                  </span>
                  <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-300 via-sky-400 to-orange-400 rounded-full"></span>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-white/80 font-medium leading-relaxed max-w-2xl">
                Sử dụng AI để tìm kiếm và gợi ý các sự kiện phù hợp với sở thích
                của bạn. Kết nối với cộng đồng và tạo ra những trải nghiệm đáng
                nhớ.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="group bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 hover:from-blue-800 hover:via-blue-600 hover:to-blue-500 text-white px-8 py-6 text-base font-semibold shadow-xl shadow-blue-500/40 hover:shadow-blue-600/50 hover:scale-[1.02] transition-all duration-300 rounded-2xl border-0"
              >
                <NavLink to="/search">
                  <Calendar className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Khám phá sự kiện
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </NavLink>
              </Button>

              {!isAuthenticated ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-base font-semibold bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-pink-500/20 hover:from-sky-500/30 hover:via-purple-500/30 hover:to-pink-500/30 text-white hover:text-white border-2 border-purple-400/60 hover:border-purple-300/80 backdrop-blur-md rounded-2xl hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <NavLink to="/auth/login">
                    <LogIn className="w-5 h-5 mr-2 text-white" />
                    Đăng nhập
                  </NavLink>
                </Button>
              ) : (
                <NavLink to="/become-organizer">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-6 text-base font-semibold bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-pink-500/20 hover:from-sky-500/30 hover:via-purple-500/30 hover:to-pink-500/30 text-white hover:text-white border-2 border-purple-400/60 hover:border-purple-300/80 backdrop-blur-md rounded-2xl hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <UserRound className="w-5 h-5 mr-2 text-white" />
                    Trở thành Organizer
                  </Button>
                </NavLink>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-300 to-orange-300 border-2 border-white shadow-sm flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
                <span className="text-sm text-white/70 font-medium">
                  <span className="font-semibold">5+</span> người dùng
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl text-yellow-200/80">★★★★</span>
                <span className="text-sm text-white/70 font-medium">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Right Side - Stats Cards */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-6">
              {/* Card 2 */}
              <div className="group bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md">
                <div className="space-y-3">
                  <div className="p-2 bg-white/20 rounded-xl w-fit group-hover:scale-110 transition-transform shadow-md">
                    <BookImage className="w-6 h-5 text-white/90" />
                  </div>
                  <div className="text-3xl font-extrabold text-white/100">5+</div>
                  <div className="text-xs text-white/80 font-semibold">Sự kiện đang diễn ra!</div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md">
                <div className="space-y-3">
                  <div className="p-2 bg-white/20 rounded-xl w-fit group-hover:scale-110 transition-transform shadow-md">
                    <Map className="w-6 h-5 text-white/90" />
                  </div>
                  <div className="text-3xl font-extrabold text-white/100">25+</div>
                  <div className="text-xs text-white/80 font-semibold">Quận đang phủ sóng tại HCM</div>
                </div>
              </div>
            </div>

            {/* Floating element */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-sky-200 to-sky-300 rounded-full blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
          </div>

        </div>

        {/* Mobile Stats - visible only on small screens */}
        <div className="lg:hidden grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/30">
          <div className="text-center group">
            <div className="text-3xl sm:text-4xl font-bold text-white/90">
              1K+
            </div>
            <div className="text-xs sm:text-sm text-white/70 font-medium mt-2">
              Sự kiện
            </div>
          </div>
          <div className="text-center group">
            <div className="text-3xl sm:text-4xl font-bold text-white/90">
              50K+
            </div>
            <div className="text-xs sm:text-sm text-white/70 font-medium mt-2">
              Người dùng
            </div>
          </div>
          <div className="text-center group">
            <div className="text-3xl sm:text-4xl font-bold text-white/90">
              25+
            </div>
            <div className="text-xs sm:text-sm text-white/70 font-medium mt-2">
              Thành phố
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
      `}</style>
    </section>
  );
}