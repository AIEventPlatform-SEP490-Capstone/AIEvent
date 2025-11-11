using AIEvent.Application.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using AIEvent.Application.Helpers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using Microsoft.Extensions.Logging;


namespace AIEvent.Application.Services.Implements
{
    public class EmailService : IEmailService
    {
        private readonly Microsoft.Extensions.Logging.ILogger<EmailService> _logger;

        public EmailService(Microsoft.Extensions.Logging.ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public async Task<Result> SendEmailAsync(string email, MimeMessage message)
        {
            if (string.IsNullOrWhiteSpace(email))
                return ErrorResponse.FailureResult("Email cannot be blank", ErrorCodes.InvalidInput);

            if (message == null)
                return ErrorResponse.FailureResult("Email content cannot be blank", ErrorCodes.InvalidInput);

            if (!MailboxAddress.TryParse(email, out _))
                return ErrorResponse.FailureResult("Email invalid", ErrorCodes.InvalidInput);

            message.From.Add(new MailboxAddress("AIEvent", "thoaidtse170076@fpt.edu.vn"));
            message.To.Add(MailboxAddress.Parse(email));

            try
            {
                using var client = new SmtpClient();
                await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("thoaidtse170076@fpt.edu.vn", "gnmjhwhbyoovvigw");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return Result.Success();
            }
            catch
            {
                return ErrorResponse.FailureResult("Can not send email. Please try again.");
            }
        }

        public async Task SendTicketsEmailAsync(string toEmail, string subject, string? htmlBody, byte[] pdfBytes, string pdfFileName, string eventName, string userFullName, string? organizerName = null, string? organizerPhone = null, string? organizerEmail = null, DateTime? eventStartTime = null, DateTime? eventEndTime = null)
        {
            _logger.LogInformation("Preparing email to {ToEmail} with subject '{Subject}', PDF size: {PdfSize} bytes", toEmail, subject, pdfBytes.Length);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("AIEvent", "thoaidtse170076@fpt.edu.vn"));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bookingCode = $"AIE{DateTime.UtcNow:yyyyMMdd}{DateTime.UtcNow.Ticks % 1000000:D6}";
            var currentDate = DateTime.UtcNow;

            // Build organizer info section
            var organizerInfoRows = "";
            if (!string.IsNullOrWhiteSpace(organizerName))
            {
                organizerInfoRows += $@"
                                <div class='info-row'>
                                    <span class='info-label'>Nhà tổ chức:&nbsp;</span>
                                    <span class='info-value'>{organizerName}</span>
                                </div>";
            }
            if (!string.IsNullOrWhiteSpace(organizerPhone))
            {
                organizerInfoRows += $@"
                                <div class='info-row'>
                                    <span class='info-label'>Số điện thoại:&nbsp;</span>
                                    <span class='info-value'>{organizerPhone}</span>
                                </div>";
            }
            if (!string.IsNullOrWhiteSpace(organizerEmail))
            {
                organizerInfoRows += $@"
                                <div class='info-row'>
                                    <span class='info-label'>Email nhà tổ chức:&nbsp;</span>
                                    <span class='info-value'>{organizerEmail}</span>
                                </div>";
            }

            // Build event time section
            var eventTimeSection = "";
            if (eventStartTime.HasValue || eventEndTime.HasValue)
            {
                var eventTimeRows = "";
                if (eventStartTime.HasValue)
                {
                    eventTimeRows += $@"
                                <div class='info-row'>
                                    <span class='info-label'>Thời gian bắt đầu:&nbsp;</span>
                                    <span class='info-value'>{eventStartTime.Value:dd/MM/yyyy HH:mm}</span>
                                </div>";
                }
                if (eventEndTime.HasValue)
                {
                    eventTimeRows += $@"
                                <div class='info-row'>
                                    <span class='info-label'>Thời gian kết thúc:&nbsp;</span>
                                    <span class='info-value'>{eventEndTime.Value:dd/MM/yyyy HH:mm}</span>
                                </div>";
                }
                eventTimeSection = $@"
                        <!-- Event Time -->
                        <div class='info-section'>
                            <div class='section-title'>THỜI GIAN SỰ KIỆN</div>
                            <div class='info-box'>
                                {eventTimeRows}
                            </div>
                        </div>";
            }

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
                    html {{
                        background-color: #e5e5e5 !important;
                        background: #e5e5e5 !important;
                    }}
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #e5e5e5 !important;
                        background: #e5e5e5 !important;
                        padding: 20px 10px;
                        line-height: 1.6;
                        margin: 0;
                        min-height: 100vh;
                    }}
                    table {{
                        background-color: #e5e5e5 !important;
                        background: #e5e5e5 !important;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        background: #ffffff;
                        padding: 30px 30px 20px;
                        border-bottom: 3px solid #0064d2;
                        text-align: center;
                    }}
                    .logo-wrapper {{
                        margin-bottom: 25px;
                        text-align: center;
                    }}
                    .logo {{
                        max-width: 220px;
                        height: auto;
                    }}
                    .header-title {{
                        color: #333333;
                        font-size: 26px;
                        font-weight: 600;
                        margin-bottom: 8px;
                        line-height: 1.4;
                        text-align: center;
                    }}
                    .content {{
                        background: #ffffff;
                        padding: 30px;
                    }}
                    .greeting {{
                        color: #333333;
                        font-size: 18px;
                        margin-bottom: 20px;
                        line-height: 1.6;
                    }}
                    .greeting strong {{
                        font-weight: 700;
                    }}
                    .greeting .username {{
                        font-weight: 700;
                        color: #0064d2;
                    }}
                    .message {{
                        color: #555555;
                        font-size: 14px;
                        line-height: 1.7;
                        margin-bottom: 15px;
                    }}
                    .info-section {{
                        margin: 35px 0;
                    }}
                    .section-title {{
                        color: #333333;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 18px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }}
                    .info-box {{
                        background: #f8f9fa;
                        border-left: none;
                        padding: 24px 24px;
                        margin-bottom: 0;
                        border-radius: 0 6px 6px 0;
                        position: relative;
                        overflow: hidden;
                    }}
                    .info-box::before {{
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 4px;
                        height: 100%;
                        background: linear-gradient(180deg, #003d7a 0%, #0064d2 50%, #4da6ff 100%);
                        background-size: 100% 200%;
                        animation: gradientMove 3s ease infinite;
                    }}
                    @keyframes gradientMove {{
                        0% {{
                            background-position: 0% 0%;
                        }}
                        50% {{
                            background-position: 0% 100%;
                        }}
                        100% {{
                            background-position: 0% 0%;
                        }}
                    }}
                    .info-row {{
                        display: flex;
                        justify-content: space-between;
                        padding-top: 28px;
                        padding-bottom: 28px;
                        padding-left: 0;
                        padding-right: 0;
                        font-size: 14px;
                        border-bottom: 1px solid #e9ecef;
                        min-height: 60px;
                        box-sizing: border-box;
                    }}
                    .info-row:last-child {{
                        border-bottom: none;
                        padding-bottom: 28px;
                    }}
                    .info-row:first-child {{
                        padding-top: 28px;
                    }}
                    .info-label {{
                        color: #666666;
                        font-weight: 500;
                    }}
                    .info-value {{
                        color: #333333;
                        font-weight: 600;
                        text-align: right;
                    }}
                    .status-badge {{
                        background: #d4edda;
                        color: #155724;
                        padding: 4px 12px;
                        border-radius: 4px;
                        font-size: 13px;
                        font-weight: 600;
                        display: inline-block;
                    }}
                    .ticket-box {{
                        background: #fff9e6;
                        border: 1px solid #ffd700;
                        border-radius: 6px;
                        padding: 20px;
                        margin: 20px 0;
                        text-align: center;
                    }}
                    .ticket-icon {{
                        width: 48px;
                        height: 48px;
                        margin: 0 auto 15px;
                        background: #ffd700;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }}
                    .ticket-icon svg {{
                        width: 24px;
                        height: 24px;
                        fill: #333333;
                    }}
                    .ticket-title {{
                        color: #333333;
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 8px;
                    }}
                    .ticket-subtitle {{
                        color: #666666;
                        font-size: 13px;
                        margin-bottom: 15px;
                    }}
                    .file-attachment {{
                        background: #ffffff;
                        border: 2px dashed #dddddd;
                        border-radius: 6px;
                        padding: 15px;
                        display: inline-flex;
                        align-items: center;
                        gap: 12px;
                        text-align: left;
                    }}
                    .file-icon {{
                        width: 36px;
                        height: 36px;
                        background: #0064d2;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }}
                    .file-icon svg {{
                        width: 20px;
                        height: 20px;
                        stroke: white;
                        fill: none;
                    }}
                    .file-info {{
                        text-align: left;
                    }}
                    .file-name {{
                        color: #0064d2;
                        font-size: 13px;
                        font-weight: 600;
                        word-break: break-all;
                    }}
                    .file-size {{
                        color: #999999;
                        font-size: 12px;
                    }}
                    .alert-box {{
                        background: #fff3cd;
                        border-left: none;
                        padding: 18px 22px 18px 10px;
                        margin: 30px 0;
                        border-radius: 0 6px 6px 0;
                        position: relative;
                        overflow: hidden;
                    }}
                    .alert-box::before {{
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 4px;
                        height: 100%;
                        background: linear-gradient(180deg, #ff8c00 0%, #ffc107 50%, #ffd700 100%);
                        background-size: 100% 200%;
                        animation: gradientMove 3s ease infinite;
                    }}
                    .alert-title {{
                        color: #856404;
                        font-size: 13px;
                        font-weight: 600;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding-left: 0;
                        margin-left: 0;
                    }}
                    .alert-icon {{
                        width: 18px;
                        height: 18px;
                        flex-shrink: 0;
                    }}
                    .alert-icon svg {{
                        width: 100%;
                        height: 100%;
                        stroke: #856404;
                        fill: none;
                        stroke-width: 2;
                    }}
                    .alert-text {{
                        color: #856404;
                        font-size: 13px;
                        line-height: 1.6;
                    }}
                    .help-section {{
                        background: #f8f9fa;
                        padding: 25px 22px;
                        margin: 35px 0;
                        border-radius: 6px;
                        text-align: center;
                    }}
                    .help-title {{
                        color: #333333;
                        font-size: 15px;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }}
                    .help-text {{
                        color: #666666;
                        font-size: 13px;
                        margin-bottom: 15px;
                        line-height: 1.6;
                    }}
                    .help-links {{
                        display: flex;
                        justify-content: center;
                        gap: 30px;
                        flex-wrap: wrap;
                    }}
                    .help-link {{
                        color: #0064d2;
                        text-decoration: none;
                        font-size: 13px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        white-space: nowrap;
                    }}
                    .help-link:hover {{
                        text-decoration: underline;
                    }}
                    .help-link svg {{
                        width: 14px;
                        height: 14px;
                        stroke: #333333;
                        fill: none;
                        stroke-width: 2;
                    }}
                    .footer {{
                        background: #f8f9fa;
                        padding: 25px 30px;
                        text-align: center;
                        border-top: 1px solid #e9ecef;
                    }}
                    .footer-logo {{
                        font-size: 18px;
                        font-weight: 700;
                        color: #0064d2;
                        margin-bottom: 15px;
                    }}
                    .footer-text {{
                        color: #666666;
                        font-size: 12px;
                        line-height: 1.7;
                        margin-bottom: 12px;
                    }}
                    .footer-links {{
                        margin: 15px 0;
                    }}
                    .footer-link {{
                        color: #0064d2;
                        text-decoration: none;
                        font-size: 12px;
                        margin: 0 10px;
                    }}
                    .footer-link:hover {{
                        text-decoration: underline;
                    }}
                    .footer-divider {{
                        height: 1px;
                        background: #dee2e6;
                        margin: 20px 0;
                    }}
                    .footer-contact {{
                        color: #999999;
                        font-size: 11px;
                        line-height: 1.6;
                    }}
                    .footer-contact a {{
                        color: #0064d2;
                        text-decoration: none;
                    }}
                    .footer-contact a:hover {{
                        text-decoration: underline;
                    }}
                    .divider {{
                        height: 1px;
                        background: #e9ecef;
                        margin: 35px 0;
                    }}
                    .guest-name {{
                        color: #87ceeb;
                        font-weight: 600;
                        font-size: 15px;
                    }}
                    .guest-section {{
                        margin: 35px 0;
                    }}
                </style>
            </head>
            <body style='background-color: #e5e5e5; background: #e5e5e5; margin: 0; padding: 20px 10px;'>
                <div class='email-container' style='background-color: #ffffff; background: #ffffff;'>
                    <!-- Header -->
                    <div class='header'>
                        <div class='logo-wrapper'>
                            <img src='https://res.cloudinary.com/dklvpvp4v/image/upload/v1760719179/z7120917022972_68f328e208cc7b01cb1411a865d51bc3_onmsdm.jpg' alt='AIEvent' class='logo'>
                        </div>
                        <h1 class='header-title'>Vé của quý khách đã được mua thành công!</h1>
                    </div>

                    <!-- Content -->
                    <div class='content'>
                        <div class='greeting'>
                            Kính gửi quý khách <span class='username'>{userFullName}</span>,
                        </div>
                        
                        <p class='message'>
                            <strong>AIEvent</strong> xin cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ đặt vé trực tuyến của chúng tôi!
                        </p>
                        
                        <p class='message'>
                            Vé điện tử đã được đính kèm trong email này. Vui lòng kiểm tra và lưu giữ để sử dụng tại sự kiện.
                        </p>

                        <div class='divider'></div>

                        <!-- Booking Information -->
                        <div class='info-section'>
                            <div class='section-title'>THÔNG TIN ĐẶT VÉ</div>
                            <div class='info-box'>
                                <div class='info-row'>
                                    <span class='info-label'>Sự kiện:&nbsp;</span>
                                    <span class='info-value'>{eventName}</span>
                                </div>
                                {organizerInfoRows}
                            </div>
                        </div>

                        <!-- Guest Name Section -->
                        <div class='guest-section'>
                            <div class='section-title'>TÊN KHÁCH</div>
                            <div class='info-box'>
                                <div class='info-row'>
                                    <span class='info-label'>Họ tên khách:&nbsp;</span>
                                    <span class='info-value guest-name'>{userFullName}</span>
                                </div>
                                <div class='info-row'>
                                    <span class='info-label'>Mã đặt chỗ:&nbsp;</span>
                                    <span class='info-value'>{bookingCode}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Alert -->
                        <div class='alert-box'>
                            <div class='alert-title'>
                                <div class='alert-icon'>
                                    <svg viewBox='0 0 20 20' fill='none'>
                                        <circle cx='10' cy='10' r='8' stroke='currentColor' stroke-width='2'/>
                                        <path d='M10 6v4M10 14h.01' stroke='currentColor' stroke-width='2' stroke-linecap='round'/>
                                    </svg>
                                </div>
                                LƯU Ý QUAN TRỌNG
                            </div>
                            <div class='alert-text'>
                                Vui lòng bảo mật thông tin vé và mã QR của bạn. Không chia sẻ cho bất kỳ ai để tránh trường hợp vé bị sử dụng trái phép. Chúng tôi không chịu trách nhiệm cho các trường hợp vé bị đánh cắp hoặc đã sử dụng trước khi sự kiện diễn ra!
                            </div>
                        </div>

                        {eventTimeSection}

                        <div class='divider'></div>

                        <!-- Help Section -->
                        <div class='help-section'>
                            <div class='help-title'>Bạn cần trợ giúp?</div>
                            <p class='help-text'>
                                Mọi thắc mắc và giải đáp xin vui lòng liên hệ Quản Trị Viên hệ thống để được giải đáp! 
                            </p>
                            <div class='help-links'>
                                <a href='mailto:thoaidtse170076@fpt.edu.vn' class='help-link'>
                                    <svg viewBox='0 0 24 24' fill='none' stroke-width='2'>
                                        <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' stroke='currentColor'/>
                                        <polyline points='22,6 12,13 2,6' stroke='currentColor'/>
                                    </svg>
                                    Liên hệ Email&nbsp;
                                </a>
                                <a href='#' class='help-link'>
                                    <svg viewBox='0 0 24 24' fill='none' stroke-width='2'>
                                        <circle cx='12' cy='12' r='10' stroke='currentColor'/>
                                        <path d='M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01' stroke='currentColor' stroke-linecap='round'/>
                                    </svg>
                                    Trung tâm trợ giúp
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class='footer'>
                        <div class='footer-logo'>AIEvent</div>
                        <div class='footer-text'>
                            Nền tảng đặt vé sự kiện thông minh và hiện đại
                        </div>
                        
                        <div class='footer-links'>
                            <a href='#' class='footer-link'>Điều khoản sử dụng</a>
                            <a href='#' class='footer-link'>Chính sách bảo mật</a>
                            <a href='#' class='footer-link'>Liên hệ</a>
                        </div>
                        
                        <div class='footer-divider'></div>
                        
                        <div class='footer-contact'>
                            © {currentDate.Year} AIEvent. All rights reserved.<br>
                            Email: <a href='mailto:thoaidtse170076@fpt.edu.vn'>thoaidtse170076@fpt.edu.vn</a><br>
                            <br>
                            <em>Email này được gửi tự động, vui lòng không trả lời trực tiếp.</em>
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

            try
            {
                _logger.LogInformation("Connecting to SMTP server...");
                using var client = new MailKit.Net.Smtp.SmtpClient();
                await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                _logger.LogInformation("Authenticating...");
                await client.AuthenticateAsync("thoaidtse170076@fpt.edu.vn", "gnmjhwhbyoovvigw");
                _logger.LogInformation("Sending email...");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail}. Error: {ErrorMessage}", toEmail, ex.Message);
                throw;
            }
        }

    }
}