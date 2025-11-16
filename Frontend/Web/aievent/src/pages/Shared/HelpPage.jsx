import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";

const HelpPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trợ giúp</h1>
        <p className="text-muted-foreground">Câu hỏi thường gặp và kênh hỗ trợ</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>Những câu hỏi phổ biến</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Làm sao để mua vé?</p>
              <p className="text-sm text-muted-foreground">
                Tìm sự kiện, chọn vé, đăng nhập và thanh toán. Vé sẽ xuất hiện trong mục "Vé của tôi".
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium">Tôi có thể hoàn/đổi vé không?</p>
              <p className="text-sm text-muted-foreground">
                Chính sách hoàn/đổi phụ thuộc từng sự kiện. Hãy xem chi tiết trên trang sự kiện.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium">Không nhận được email xác nhận?</p>
              <p className="text-sm text-muted-foreground">
                Kiểm tra hộp thư rác hoặc dùng đăng nhập Google. Nếu vẫn không được, liên hệ hỗ trợ.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liên hệ hỗ trợ</CardTitle>
            <CardDescription>Chúng tôi luôn sẵn sàng giúp bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">support@aievent.vn</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Hotline</p>
              <p className="font-medium">1900 1234 (8:00 - 22:00)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Trung tâm hỗ trợ</p>
              <p className="font-medium">help.aievent.vn</p>
            </div>
            <div className="flex gap-3">
              <Button variant="default">Gửi yêu cầu</Button>
              <Button variant="outline">Chat với hỗ trợ</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpPage;


