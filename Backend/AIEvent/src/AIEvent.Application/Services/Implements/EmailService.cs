using AIEvent.Application.Services.Interfaces;
using MailKit.Security;
using MailKit.Net.Smtp;
using MimeKit;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.Helpers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;

namespace AIEvent.Application.Services.Implements
{
    public class EmailService : IEmailService
    {
        public async Task<Result<UserOtpResponse>> SendOtpAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return ErrorResponse.FailureResult("Email không đc để trống", ErrorCodes.InvalidInput);

            if (!MailboxAddress.TryParse(email, out _))
                return ErrorResponse.FailureResult("Email không hợp lệ", ErrorCodes.InvalidInput);
            
            var otp = new Random().Next(100000, 999999).ToString();

            var message = new MimeMessage
            {
                Subject = "Mã OTP của bạn",
                Body = new TextPart("plain")
                {
                    Text = $"Mã xác thực của bạn là: {otp}. Mã này sẽ hết hạn sau 5 phút."
                }
            };
            message.From.Add(new MailboxAddress("AIEvent", "kietnase170077@fpt.edu.vn"));
            message.To.Add(MailboxAddress.Parse(email));

            try
            {
                using var client = new SmtpClient();
                await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("thoaidtse170076@fpt.edu.vn", "gnmjhwhbyoovvigw");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return Result<UserOtpResponse>.Success(new UserOtpResponse
                {
                    Code = otp,
                    ExpiredAt = DateTime.UtcNow.AddMinutes(5)
                });
            }
            catch
            {
                return ErrorResponse.FailureResult("Không thể gửi email. Vui lòng thử lại sau.");
            }
        }

        public async Task SendTicketsEmailAsync(string toEmail, string subject, string? htmlBody, byte[] pdfBytes, string pdfFileName, string eventName)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("AIEvent", "kietnase170077@fpt.edu.vn"));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            htmlBody ??= $@"
            <!DOCTYPE html>
            <html lang='vi'>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <style>
                    * {{
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }}
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                        background-color: #d1d5db;
                        padding: 20px 10px;
                        line-height: 1.6;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border: 1px solid #c4c4c4;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                    }}
                    .header {{
                        background: #0194f3;
                        padding: 40px 20px;
                        text-align: center;
                        border-bottom: 3px solid #0174c4;
                    }}
                    .logo {{
                        max-width: 180px;
                        height: auto;
                        margin-bottom: 25px;
                        background: white;
                        padding: 15px 30px;
                    }}
                    .header-title {{
                        color: #ffffff;
                        font-size: 22px;
                        font-weight: 400;
                        margin-bottom: 8px;
                        line-height: 1.4;
                    }}
                    .header-subtitle {{
                        color: #ffffff;
                        font-size: 14px;
                        opacity: 0.9;
                        font-weight: 300;
                    }}
                    .content {{
                        padding: 0;
                        background: #ffffff;
                    }}
                    .greeting-section {{
                        background: #ffffff;
                        padding: 30px 25px 20px;
                    }}
                    .greeting {{
                        font-size: 15px;
                        color: #3c3c3c;
                        font-weight: 600;
                        margin-bottom: 15px;
                    }}
                    .message {{
                        color: #686868;
                        font-size: 14px;
                        line-height: 1.8;
                        margin-bottom: 10px;
                    }}
                    .section-title {{
                        background: #f5f5f5;
                        padding: 12px 25px;
                        font-size: 13px;
                        font-weight: 600;
                        color: #3c3c3c;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-top: 1px solid #e0e0e0;
                        border-bottom: 1px solid #e0e0e0;
                    }}
                    .booking-info {{
                        padding: 25px;
                        background: #ffffff;
                    }}
                    .info-row {{
                        display: flex;
                        justify-content: space-between;
                        padding: 12px 0;
                        border-bottom: 1px solid #f0f0f0;
                    }}
                    .info-row:last-child {{
                        border-bottom: none;
                    }}
                    .info-label {{
                        color: #686868;
                        font-size: 14px;
                        font-weight: 400;
                    }}
                    .info-value {{
                        color: #3c3c3c;
                        font-size: 14px;
                        font-weight: 600;
                        text-align: right;
                    }}
                    .status-confirmed {{
                        color: #0194f3;
                        font-weight: 600;
                    }}
                    .divider {{
                        height: 1px;
                        background: #e0e0e0;
                        margin: 0;
                    }}
                    .attachment-section {{
                        background: #ffffff;
                        padding: 30px 25px;
                        text-align: center;
                    }}
                    .attachment-title {{
                        color: #3c3c3c;
                        font-size: 15px;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }}
                    .attachment-subtitle {{
                        color: #686868;
                        font-size: 13px;
                        margin-bottom: 20px;
                    }}
                    .attachment-box {{
                        background: #f8f9fa;
                        border: 2px dashed #d0d0d0;
                        padding: 20px;
                        margin: 0 auto;
                        max-width: 400px;
                    }}
                    .attachment-file-name {{
                        color: #0194f3;
                        font-size: 14px;
                        font-weight: 600;
                        word-break: break-all;
                    }}
                    .security-banner {{
                        background: #fff9e6;
                        padding: 15px 25px;
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                    }}
                    .security-icon {{
                        font-size: 20px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }}
                    .security-text {{
                        color: #856404;
                        font-size: 13px;
                        line-height: 1.6;
                    }}
                    .security-text strong {{
                        font-weight: 600;
                    }}
                    .alert-box {{
                        background: #fff9e6;
                        padding: 25px;
                    }}
                    .alert-header {{
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 15px;
                    }}
                    .alert-icon {{
                        font-size: 20px;
                        color: #f59e0b;
                    }}
                    .alert-title {{
                        color: #856404;
                        font-size: 14px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                    }}
                    .alert-list {{
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }}
                    .alert-list li {{
                        color: #856404;
                        font-size: 13px;
                        padding: 8px 0;
                        padding-left: 20px;
                        position: relative;
                        line-height: 1.7;
                    }}
                    .alert-list li::before {{
                        content: '•';
                        position: absolute;
                        left: 5px;
                        color: #f59e0b;
                        font-weight: bold;
                        font-size: 16px;
                    }}
                    .footer {{
                        background: #f5f5f5;
                        padding: 30px 25px;
                        text-align: center;
                        border-top: 1px solid #e0e0e0;
                    }}
                    .footer-logo {{
                        font-size: 20px;
                        font-weight: 700;
                        color: #0194f3;
                        margin-bottom: 12px;
                    }}
                    .footer-text {{
                        color: #686868;
                        font-size: 13px;
                        line-height: 1.8;
                        margin-bottom: 15px;
                    }}
                    .footer-divider {{
                        height: 1px;
                        background: #d0d0d0;
                        margin: 20px 0;
                    }}
                    .footer-contact {{
                        color: #686868;
                        font-size: 12px;
                        line-height: 1.6;
                    }}
                    .footer-contact a {{
                        color: #0194f3;
                        text-decoration: none;
                    }}
                    .celebration {{
                        background: #ffffff;
                        padding: 25px;
                        text-align: center;
                        color: #0194f3;
                        font-size: 15px;
                        font-weight: 500;
                    }}
                </style>
            </head>
            <body>
                <div class='email-container'>
                    <!-- Header -->
                    <div class='header'>
                        <img src='https://res.cloudinary.com/dklvpvp4v/image/upload/v1760719179/z7120917022972_68f328e208cc7b01cb1411a865d51bc3_onmsdm.jpg' alt='AIEvent' class='logo'>
                        <h1 class='header-title'>Phiếu thanh toán sự kiện</h1>
                        <p class='header-subtitle'>Đặt vé thành công - Sẵn sàng cho trải nghiệm tuyệt vời</p>
                    </div>

                    <!-- Content -->
                    <div class='content'>
                        <!-- Greeting -->
                        <div class='greeting-section'>
                            <div class='greeting'>Kính gửi Quý khách,</div>
                            <p class='message'>
                                AIEvent xin thông báo vé sự kiện của bạn đã được xác nhận thành công.
                            </p>
                            <p class='message'>
                                Vé sự kiện và biên nhận thanh toán của quý khách được đính kèm trong tập tin bên dưới.
                            </p>
                        </div>

                        <!-- Section Title -->
                        <div class='section-title'>THÔNG TIN ĐẶT VÉ</div>

                        <!-- Booking Info -->
                        <div class='booking-info'>
                            <div class='info-row'>
                                <span class='info-label'>Sự kiện: </span>
                                <span class='info-value'>{ eventName}</span>
                            </div>
                            <div class='info-row'>
                                <span class='info-label'>Trạng thái: </span>
                                <span class='info-value status-confirmed'> ✓ Đã thanh toán</span>
                            </div>
                            <div class='info-row'>
                                <span class='info-label'>Ngày đặt: </span>
                                <span class='info-value'>{ DateTime.Now:dd/MM/yyyy}</span>
                            </div>
                            <div class='info-row'>
                                <span class='info-label'>Thời gian: </span>
                                <span class='info-value'>{ DateTime.Now:HH:mm}</span>
                            </div>
                        </div>

                        <div class='divider'></div>

                        <!-- Attachment Section -->
                        <div class='attachment-section'>
                            <div class='attachment-title'>Vé Điện Tử Đính Kèm</div>
                            <p class='attachment-subtitle'>Vui lòng lưu hoặc in vé để sử dụng tại sự kiện</p>
                            <div class='attachment-box'>
                                <div class='attachment-file-name'>📎 {pdfFileName}</div>
                            </div>
                        </div>

                        <div class='divider'></div>

                        <!-- Security Banner -->
                        <div class='security-banner'>
                            <span class='security-icon'>⚠️</span>
                            <div class='security-text'>
                                <strong>Vui lòng đảm bảo:</strong> Không chia sẻ mã QR hoặc thông tin vé với người khác để tránh bị lợi dụng.
                            </div>
                        </div>

                        <div class='divider'></div>

                        <!-- Alert Box -->
                        <div class='alert-box'>
                            <div class='alert-header'>
                                <span class='alert-icon'>⚠️</span>
                                <span class='alert-title'>Lưu Ý Quan Trọng</span>
                            </div>
                            <ul class='alert-list'>
                                <li>Đến sớm 15-30 phút để hoàn tất thủ tục check-in</li>
                                <li>Mang theo giấy tờ tùy thân hợp lệ (CMND/CCCD/Hộ chiếu)</li>
                                <li>Chuẩn bị vé điện tử (in hoặc hiển thị trên điện thoại)</li>
                                <li>Liên hệ ngay nếu có bất kỳ thắc mắc nào</li>
                            </ul>
                        </div>

                        <div class='divider'></div>

                        <!-- Celebration -->
                        <div class='celebration'>
                            Chúc bạn có trải nghiệm tuyệt vời!
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class='footer'>
                        <div class='footer-logo'>AIEvent</div>
                        <div class='footer-text'>
                            Nền tảng đặt vé sự kiện hàng đầu Việt Nam<br>
                            © {DateTime.UtcNow.Year} AIEvent. All rights reserved.
                        </div>
                        <div class='footer-divider'></div>
                        <div class='footer-contact'>
                            Nếu bạn cần hỗ trợ, vui lòng liên hệ:<br>
                            <a href='mailto:kietnase170077@fpt.edu.vn'>kietnase170077@fpt.edu.vn</a><br>
                            <small>Email này được gửi tự động, vui lòng không trả lời trực tiếp.</small>
                        </div>
                    </div>
                </div>
            </body>
            </html>";

            var builder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };

            // Gắn PDF
            builder.Attachments.Add(pdfFileName, pdfBytes, new ContentType("application", "pdf"));
            message.Body = builder.ToMessageBody();

            using var client = new MailKit.Net.Smtp.SmtpClient();
            await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync("thoaidtse170076@fpt.edu.vn", "gnmjhwhbyoovvigw");
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }



    }
}
