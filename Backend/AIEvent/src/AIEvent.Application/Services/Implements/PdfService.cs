using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AIEvent.Application.Services.Implements
{
    public class TicketForPdf
    {
        public string TicketCode { get; set; } = "";
        public string EventName { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public string TicketType { get; set; } = "";
        public decimal Price { get; set; }
        public string QrUrl { get; set; } = "";
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Address { get; set; } = "";
    }

    public interface IPdfService
    {
        Task<byte[]> GenerateTicketsPdfAsync(List<TicketForPdf> tickets, string eventName, string buyer, string email);
    }

    public class PdfService : IPdfService
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public PdfService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<byte[]> GenerateTicketsPdfAsync(List<TicketForPdf> tickets, string eventName, string buyer, string email)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var http = _httpClientFactory.CreateClient();
            var qrImages = new Dictionary<string, byte[]>();

            byte[] logoBytes = Array.Empty<byte>();
            try
            {
                logoBytes = await http.GetByteArrayAsync("https://res.cloudinary.com/dklvpvp4v/image/upload/v1760719179/z7120917022972_68f328e208cc7b01cb1411a865d51bc3_onmsdm.jpg");
            }
            catch
            {
                // Logo không tải được
            }

            // Tải QR async
            foreach (var t in tickets)
            {
                try
                {
                    qrImages[t.TicketCode] = await http.GetByteArrayAsync(t.QrUrl);
                }
                catch
                {
                    qrImages[t.TicketCode] = Array.Empty<byte>();
                }
            }

            // Color palette - Traveloka style
            var travelokaBlue = Color.FromHex("#0194f3");
            var darkText = Color.FromHex("#3c3c3c");
            var mediumText = Color.FromHex("#686868");
            var lightGray = Color.FromHex("#f5f5f5");
            var borderGray = Color.FromHex("#e0e0e0");
            var yellowWarning = Color.FromHex("#ffc107");
            var yellowBg = Color.FromHex("#fffbeb");

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(0);
                    page.Size(PageSizes.A4);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontColor(darkText).FontFamily("Arial"));

                    page.Content().Column(mainCol =>
                    {
                        // Header with logo
                        mainCol.Item().Background(Colors.White).Padding(25).Row(headerRow =>
                        {
                            headerRow.RelativeItem().Column(col =>
                            {
                                col.Item().Text("Vé Sự Kiện").FontSize(28).Bold().FontColor(darkText);
                            });

                            // Logo AIEvent
                            headerRow.ConstantItem(200).AlignRight().AlignMiddle().Element(logoContainer =>
                            {
                                if (logoBytes.Any())
                                {
                                    logoContainer.Height(70).Image(logoBytes);
                                }
                                else
                                {
                                    logoContainer.Container()
                                        .Background(travelokaBlue)
                                        .Padding(10)
                                        .AlignCenter()
                                        .Text("AIEvent")
                                        .FontSize(16)
                                        .Bold()
                                        .FontColor(Colors.White);
                                }
                            });
                        });

                        mainCol.Item().PaddingHorizontal(25).LineHorizontal(1).LineColor(borderGray);

                        // Main content
                        mainCol.Item().Padding(25).Column(contentCol =>
                        {
                            // Order info section
                            contentCol.Item().Column(orderCol =>
                            {
                                orderCol.Item().PaddingTop(12).Column(col =>
                                {
                                    col.Item().Text("Đặt vé thành công bởi").FontSize(10).FontColor(mediumText);
                                    col.Item().PaddingTop(3).Text("AIEvent").FontSize(12).SemiBold().FontColor(darkText);
                                });
                            });

                            // Event details section
                            contentCol.Item().PaddingTop(30).Column(eventCol =>
                            {
                                eventCol.Item().Row(r =>
                                {
                                    r.RelativeItem().Text(eventName).FontSize(16).Bold().FontColor(darkText);
                                    r.ConstantItem(80).AlignRight().Text("⭐⭐").FontSize(12);
                                });

                                if (tickets.Any())
                                {
                                    var firstTicket = tickets.First();
                                    eventCol.Item().PaddingTop(8).Text(firstTicket.Address)
                                        .FontSize(11).FontColor(mediumText);

                                    eventCol.Item().PaddingTop(12).Column(contactCol =>
                                    {
                                        contactCol.Item().Row(r =>
                                        {
                                            r.ConstantItem(100).Text("Email:").FontSize(10).FontColor(mediumText);
                                            r.RelativeItem().Text(email).FontSize(10).FontColor(darkText);
                                        });
                                        contactCol.Item().PaddingTop(5).Row(r =>
                                        {
                                            r.ConstantItem(100).Text("Khách hàng:").FontSize(10).FontColor(mediumText);
                                            r.RelativeItem().Text(buyer).FontSize(10).FontColor(travelokaBlue);
                                        });
                                    });
                                }
                            });

                            // Warning banner
                            contentCol.Item().PaddingTop(20).Background(yellowBg)
                                .Border(1).BorderColor(Color.FromHex("#ffc107"))
                                .Padding(12).Row(r =>
                                {
                                    r.ConstantItem(25).AlignMiddle().Text("⚠️").FontSize(16);
                                    r.RelativeItem().PaddingLeft(8).AlignMiddle()
                                        .Text("Vui lòng đảm bảo rằng bạn đã nắm rõ thời gian nhận phòng và trả phòng như sau.")
                                        .FontSize(10).FontColor(Color.FromHex("#856404"));
                                });

                            // Event time section
                            if (tickets.Any())
                            {
                                var firstTicket = tickets.First();
                                contentCol.Item().PaddingTop(20).Row(timeRow =>
                                {
                                    timeRow.RelativeItem().Border(1).BorderColor(travelokaBlue)
                                        .Padding(15).Column(col =>
                                        {
                                            col.Item().Text("Thời gian bắt đầu").FontSize(10).Bold().FontColor(darkText);
                                            col.Item().PaddingTop(5).Text(firstTicket.StartTime.ToString("dd MMM yyyy"))
                                                .FontSize(14).Bold().FontColor(darkText);
                                            col.Item().PaddingTop(3).Row(r =>
                                            {
                                                r.ConstantItem(20).Text("🕐").FontSize(12);
                                                r.RelativeItem().PaddingLeft(5).Text(firstTicket.StartTime.ToString("HH:mm"))
                                                    .FontSize(12).FontColor(travelokaBlue);
                                            });
                                        });

                                    timeRow.ConstantItem(30);

                                    timeRow.RelativeItem().Border(1).BorderColor(travelokaBlue)
                                        .Padding(15).Column(col =>
                                        {
                                            col.Item().Text("Thời gian kết thúc").FontSize(10).Bold().FontColor(darkText);
                                            col.Item().PaddingTop(5).Text(firstTicket.EndTime.ToString("dd MMM yyyy"))
                                                .FontSize(14).Bold().FontColor(darkText);
                                            col.Item().PaddingTop(3).Row(r =>
                                            {
                                                r.ConstantItem(20).Text("🕐").FontSize(12);
                                                r.RelativeItem().PaddingLeft(5).Text(firstTicket.EndTime.ToString("HH:mm"))
                                                    .FontSize(12).FontColor(travelokaBlue);
                                            });
                                        });
                                });
                            }

                            // Table header
                            contentCol.Item().PaddingTop(30).Background(lightGray).Padding(12)
                                .Text("THÔNG TIN VÉ CHI TIẾT").FontSize(11).Bold().FontColor(darkText);

                            // Ticket details table
                            foreach (var ticket in tickets)
                            {
                                contentCol.Item().Border(1).BorderColor(borderGray).Column(ticketCol =>
                                {
                                    // Ticket row
                                    ticketCol.Item().Background(Colors.White).Padding(15).Row(ticketRow =>
                                    {
                                        // Left: Ticket info
                                        ticketRow.RelativeItem().Column(infoCol =>
                                        {
                                            infoCol.Item().Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Loại vé:").FontSize(10).FontColor(mediumText);
                                                r.RelativeItem().Text(ticket.TicketType).FontSize(11).Bold().FontColor(darkText);
                                            });
                                            infoCol.Item().PaddingTop(8).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Khách:").FontSize(10).FontColor(mediumText);
                                                r.RelativeItem().Text(ticket.CustomerName).FontSize(11).Bold().FontColor(darkText);
                                            });
                                            infoCol.Item().PaddingTop(8).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Mã vé:").FontSize(10).FontColor(mediumText);
                                                r.RelativeItem().Text(ticket.TicketCode).FontSize(10).FontFamily("Courier New").FontColor(darkText);
                                            });
                                            infoCol.Item().PaddingTop(8).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Giá vé:").FontSize(10).FontColor(mediumText);
                                                r.RelativeItem().Text($"{ticket.Price:N0} VND").FontSize(11).Bold().FontColor(darkText);
                                            });
                                        });

                                        // Right: QR Code
                                        ticketRow.ConstantItem(120).AlignMiddle().Column(qrCol =>
                                        {
                                            qrCol.Item().Width(100).Height(100).Border(1).BorderColor(borderGray).Padding(5).Element(qr =>
                                            {
                                                if (qrImages[ticket.TicketCode].Any())
                                                    qr.Image(qrImages[ticket.TicketCode]).FitArea();
                                                else
                                                    qr.AlignCenter().AlignMiddle().Text("QR N/A").FontSize(9).FontColor(mediumText);
                                            });
                                        });
                                    });
                                });
                            }

                            // Notes section
                            contentCol.Item().PaddingTop(30).Column(notesCol =>
                            {
                                notesCol.Item().Text("LƯU Ý QUAN TRỌNG!").FontSize(12).Bold().FontColor(darkText);

                                notesCol.Item().PaddingTop(10).Column(listCol =>
                                {
                                    listCol.Item().PaddingBottom(5).Row(r =>
                                    {
                                        r.ConstantItem(15).Text("•").FontSize(11).FontColor(darkText);
                                        r.RelativeItem().Text("Vui lòng đến sớm 15-30 phút để hoàn tất thủ tục check-in")
                                            .FontSize(10).FontColor(mediumText);
                                    });
                                    listCol.Item().PaddingBottom(5).Row(r =>
                                    {
                                        r.ConstantItem(15).Text("•").FontSize(11).FontColor(darkText);
                                        r.RelativeItem().Text("Khi nhận phòng, bạn cần cung cấp CMND/CCCD. Vui lòng mang theo các giấy tờ cần thiết dưới dạng bản cứng.")
                                            .FontSize(10).FontColor(mediumText);
                                    });
                                    listCol.Item().PaddingBottom(5).Row(r =>
                                    {
                                        r.ConstantItem(15).Text("•").FontSize(11).FontColor(darkText);
                                        r.RelativeItem().Text("Mang theo giấy tờ tùy thân hợp lệ và vé điện tử")
                                            .FontSize(10).FontColor(mediumText);
                                    });
                                    listCol.Item().PaddingBottom(5).Row(r =>
                                    {
                                        r.ConstantItem(15).Text("•").FontSize(11).FontColor(darkText);
                                        r.RelativeItem().Text("Liên hệ ngay nếu có bất kỳ thắc mắc nào")
                                            .FontSize(10).FontColor(mediumText);
                                    });
                                });
                            });
                        });

                        // Footer
                        mainCol.Item().PaddingTop(20).PaddingHorizontal(25).PaddingBottom(25).Column(footerCol =>
                        {
                            footerCol.Item().LineHorizontal(1).LineColor(borderGray);
                            footerCol.Item().PaddingTop(15).Row(r =>
                            {
                                r.RelativeItem().Text("© AIEvent - Nền tảng đặt vé sự kiện").FontSize(9).FontColor(mediumText);
                                r.ConstantItem(200).AlignRight().Text("📱 Xuất trình mã QR khi tham dự").FontSize(9).FontColor(mediumText);
                            });
                        });
                    });
                });
            });

            return pdf.GeneratePdf();
        }

    }
}
