import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin, Send, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import AIEventLogo from "../../assets/AIEventLogo.png";

const socialLinks = [
  { Icon: Facebook, href: "https://www.facebook.com/doublenh2509", color: "hover:bg-blue-600/20" },
  { Icon: Twitter, href: "https://www.facebook.com/doublenh2509", color: "hover:bg-blue-400/20" },
  { Icon: Instagram, href: "https://www.facebook.com/doublenh2509", color: "hover:bg-pink-600/20" },
  { Icon: Linkedin, href: "https://www.facebook.com/doublenh2509", color: "hover:bg-blue-700/20" },
];

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-3">
          {/* Brand & Description - Larger column */}
          <div className="lg:col-span-4 space-y-2">
            <div className="group">
              <img
                src={AIEventLogo}
                alt="AIEvent logo"
                className="h-36 w-auto object-contain mb-1 drop-shadow-2xl group-hover:scale-105 transition-all duration-500 brightness-0 invert"
              />
            </div>
            <p className="text-gray-400 leading-tight text-xs max-w-sm">
              Nền tảng quản lý sự kiện hiện đại, kết nối bạn với những trải nghiệm đáng nhớ và cơ hội networking tuyệt vời.
            </p>

            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const IconComponent = social.Icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-gray-400 hover:text-white ${social.color} hover:border-transparent transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>

          </div>

        {/* Quick Links */}
        <div className="lg:col-span-2 space-y-1.5">
          <h3 className="text-xs font-semibold text-white relative inline-block">
            Liên kết nhanh
            <span className="absolute -bottom-0.5 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
          </h3>
          <ul className="space-y-1">
            {[
              { label: "Khám phá sự kiện", href: "/events" },
              { label: "Trở thành Organizer", href: "/become-organizer" },
              { label: "Về chúng tôi", href: "/about" },
              { label: "Liên hệ", href: "/contact" },
              { label: "Trợ giúp", href: "/help" }
            ].map((link, index) => (
              <li key={index}>
                <Link
                  to={link.href}
                  className="text-gray-400 hover:text-white transition-all duration-300 text-xs flex items-center gap-2 group w-fit"
                >
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div className="lg:col-span-2 space-y-1.5">
          <h3 className="text-xs font-semibold text-white relative inline-block">
            Danh mục
            <span className="absolute -bottom-0.5 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
          </h3>
          <ul className="space-y-1">
            {[
              { label: "Công nghệ", href: "/events?category=technology" },
              { label: "Âm nhạc", href: "/events?category=music" },
              { label: "Kinh doanh", href: "/events?category=business" },
              { label: "Thể thao", href: "/events?category=sports" },
              { label: "Giáo dục", href: "/events?category=education" }
            ].map((link, index) => (
              <li key={index}>
                <Link
                  to={link.href}
                  className="text-gray-400 hover:text-white transition-all duration-300 text-xs flex items-center gap-2 group w-fit"
                >
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact & Newsletter */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-semibold text-white relative inline-block">
            Liên hệ & Đăng ký
            <span className="absolute -bottom-0.5 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
          </h3>

          {/* Contact Info */}
          <div className="space-y-1">
            {[
              { icon: Mail, text: "contact@aievent.vn" },
              { icon: Phone, text: "+84 123 456 789" },
              { icon: MapPin, text: "TP.HCM, Việt Nam" }
            ].map((contact, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 group">
                <div className="w-7 h-7 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-blue-600/20 group-hover:border-blue-500/30 transition-all duration-300">
                  <contact.icon className="w-3 h-3" />
                </div>
                <span className="text-xs">{contact.text}</span>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="space-y-1 pt-0">
            <h4 className="font-medium text-white text-xs">Nhận thông tin sự kiện mới nhất</h4>
            <div className="relative group">
              <Input
                placeholder="Nhập email của bạn"
                className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-gray-500 h-9 pr-24 rounded-lg focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-xs"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 h-7 px-2.5 rounded-md shadow-lg hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-105 text-xs"
              >
                <Send className="w-3 h-3 mr-0.5" />
                Đăng ký
              </Button>
            </div>
            <p className="text-xs text-gray-500">Chúng tôi tôn trọng quyền riêng tư của bạn</p>
          </div>
        </div>
      </div>

      {/* Divider with gradient */}
      <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      {/* Bottom Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 pb-2 px-4">
          <div className="text-gray-500 text-xs flex items-center gap-2">
            <span>© 2025 AIEvent.</span>
            <span className="hidden sm:inline">Tất cả quyền được bảo lưu.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {[
              { label: "Chính sách bảo mật", href: "/privacy" },
              { label: "Điều khoản sử dụng", href: "/terms" },
              { label: "Chính sách Cookie", href: "/cookies" },
            ].map((link, index) => (
              <Link
                key={index}
                to={link.href}
                className="text-gray-500 hover:text-white transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
