import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import AIEventLogo from "../../assets/AIEventLogo.png";

const AboutPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img src={AIEventLogo} alt="AIEvent" className="w-12 h-12 rounded-md" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Về AIEvent</h1>
          <p className="text-muted-foreground">Nền tảng mua vé sự kiện trực tuyến</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sứ mệnh</CardTitle>
          <CardDescription>Kết nối người yêu sự kiện và nhà tổ chức</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AIEvent giúp bạn khám phá, đặt vé và trải nghiệm sự kiện một cách nhanh chóng, an toàn và tiện lợi.
          </p>
          <Separator />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="font-medium">Khám phá thông minh</p>
              <p className="text-sm text-muted-foreground">Gợi ý sự kiện dựa trên sở thích của bạn.</p>
            </div>
            <div>
              <p className="font-medium">Thanh toán an toàn</p>
              <p className="text-sm text-muted-foreground">Hỗ trợ nhiều phương thức, bảo mật cao.</p>
            </div>
            <div>
              <p className="font-medium">Quản lý vé tiện lợi</p>
              <p className="text-sm text-muted-foreground">Vé điện tử, check-in nhanh chóng.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin</CardTitle>
          <CardDescription>Phiên bản và liên hệ</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Phiên bản</p>
            <p className="font-medium">v1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Website</p>
            <p className="font-medium">www.aievent.vn</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">contact@aievent.vn</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;


