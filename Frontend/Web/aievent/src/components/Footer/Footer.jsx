import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { Link } from "react-router-dom"
import { EventureLogo } from "../Logo/EventureLogo"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center">
              <EventureLogo
                size="md"
                showTagline={true}
                className="text-white [&_.text-primary]:text-accent [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-gray-300"
              />
            </div>
            <p className="text-gray-400 leading-relaxed">
              Nền tảng quản lý sự kiện hiện đại, giúp bạn khám phá và tham gia các trải nghiệm đáng nhớ nhất.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Linkedin className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-gray-400 hover:text-white transition-colors">
                  Khám phá sự kiện
                </Link>
              </li>
              <li>
                <Link href="/become-organizer" className="text-gray-400 hover:text-white transition-colors">
                  Trở thành Organizer
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                  Trợ giúp
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Danh mục sự kiện</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events?category=technology" className="text-gray-400 hover:text-white transition-colors">
                  Công nghệ
                </Link>
              </li>
              <li>
                <Link href="/events?category=music" className="text-gray-400 hover:text-white transition-colors">
                  Âm nhạc
                </Link>
              </li>
              <li>
                <Link href="/events?category=business" className="text-gray-400 hover:text-white transition-colors">
                  Kinh doanh
                </Link>
              </li>
              <li>
                <Link href="/events?category=sports" className="text-gray-400 hover:text-white transition-colors">
                  Thể thao
                </Link>
              </li>
              <li>
                <Link href="/events?category=education" className="text-gray-400 hover:text-white transition-colors">
                  Giáo dục
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">contact@eventure.vn</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+84 123 456 789</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">TP.HCM, Việt Nam</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Đăng ký nhận tin</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Email của bạn"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                />
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Đăng ký
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">© 2024 Eventure. Tất cả quyền được bảo lưu.</div>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
              Chính sách Cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}