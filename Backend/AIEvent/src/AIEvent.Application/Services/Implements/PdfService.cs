using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Collections.Concurrent;

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
        public byte[]? QrBytes { get; set; }
    }

    public interface IPdfService
    {
        Task<byte[]> GenerateTicketsPdfAsync(List<TicketForPdf> tickets, string eventName, string buyer, string email);
    }

    public class PdfService : IPdfService
    {
        public PdfService()
        {
        }

        public async Task<byte[]> GenerateTicketsPdfAsync(List<TicketForPdf> tickets, string eventName, string buyer, string email)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var qrImages = new ConcurrentDictionary<string, byte[]>();
            await Task.WhenAll(tickets.Select(async ticket =>
            {
                qrImages[ticket.TicketCode] = ticket.QrBytes ?? Array.Empty<byte>();
            }));

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(0);
                    page.Size(PageSizes.A4);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontColor(Color.FromHex("#3c3c3c")).FontFamily("Arial"));

                    page.Content().Column(mainCol =>
                    {
                        // Header
                        mainCol.Item().Background(Colors.White).Padding(25).Row(headerRow =>
                        {
                            headerRow.RelativeItem().Column(col =>
                            {
                                col.Item().Text("Vé Sự Kiện").FontSize(28).Bold().FontColor(Color.FromHex("#3c3c3c"));
                            });

                            headerRow.ConstantItem(200).AlignRight().AlignMiddle().Element(logoContainer =>
                            {
                                logoContainer.Container()
                                    .Background(Colors.White)
                                    .Padding(10)
                                    .AlignCenter()
                                    .Text("AIEvent")
                                    .FontSize(24)
                                    .Bold()
                                    .FontFamily("Helvetica")
                                    .FontColor(Color.FromHex("#0194f3"));
                            });
                        });

                        mainCol.Item().PaddingHorizontal(25).LineHorizontal(1).LineColor(Color.FromHex("#e0e0e0"));

                        // Main content
                        mainCol.Item().Padding(25).Column(contentCol =>
                        {
                            // Order info
                            contentCol.Item().Column(orderCol =>
                            {
                                orderCol.Item().PaddingTop(12).Column(col =>
                                {
                                    col.Item().Text("Đặt vé thành công bởi").FontSize(10).FontColor(Color.FromHex("#686868"));
                                    col.Item().PaddingTop(3).Text("AIEvent").FontSize(12).SemiBold().FontColor(Color.FromHex("#3c3c3c"));
                                });
                            });

                            // Event details
                            contentCol.Item().PaddingTop(30).Column(eventCol =>
                            {
                                eventCol.Item().Row(r =>
                                {
                                    r.RelativeItem().Text(eventName).FontSize(16).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                    r.ConstantItem(80).AlignRight().Text("⭐⭐").FontSize(12);
                                });

                                if (tickets.Any())
                                {
                                    var firstTicket = tickets.First();
                                    eventCol.Item().PaddingTop(8).Text(firstTicket.Address)
                                        .FontSize(11).FontColor(Color.FromHex("#686868"));

                                    eventCol.Item().PaddingTop(12).Column(contactCol =>
                                    {
                                        contactCol.Item().Row(r =>
                                        {
                                            r.ConstantItem(100).Text("Email:").FontSize(10).FontColor(Color.FromHex("#686868"));
                                            r.RelativeItem().Text(email).FontSize(10).FontColor(Color.FromHex("#3c3c3c"));
                                        });
                                        contactCol.Item().PaddingTop(5).Row(r =>
                                        {
                                            r.ConstantItem(100).Text("Khách hàng:").FontSize(10).FontColor(Color.FromHex("#686868"));
                                            r.RelativeItem().Text(buyer).FontSize(10).FontColor(Color.FromHex("#0194f3"));
                                        });
                                    });
                                }
                            });

                            // Warning banner
                            contentCol.Item().PaddingTop(20).Background(Color.FromHex("#fffbeb"))
                                .Border(1).BorderColor(Color.FromHex("#ffc107"))
                                .Padding(12).Row(r =>
                                {
                                    r.ConstantItem(25).AlignMiddle().Text("⚠️").FontSize(16);
                                    r.RelativeItem().PaddingLeft(8).AlignMiddle()
                                        .Text("Vui lòng đảm bảo rằng bạn đã nắm rõ thời gian tổ chức sự kiện.")
                                        .FontSize(10).FontColor(Color.FromHex("#856404"));
                                });

                            // Event time
                            if (tickets.Any())
                            {
                                var firstTicket = tickets.First();
                                contentCol.Item().PaddingTop(20).Row(timeRow =>
                                {
                                    timeRow.RelativeItem().Border(1).BorderColor(Color.FromHex("#0194f3"))
                                        .Padding(15).Column(col =>
                                        {
                                            col.Item().Text("Thời gian bắt đầu").FontSize(10).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                            col.Item().PaddingTop(5).Text(firstTicket.StartTime.ToString("dd MMM yyyy"))
                                                .FontSize(14).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                            col.Item().PaddingTop(3).Row(r =>
                                            {
                                                r.ConstantItem(20).Text("🕐").FontSize(12);
                                                r.RelativeItem().PaddingLeft(5).Text(firstTicket.StartTime.ToString("HH:mm"))
                                                    .FontSize(12).FontColor(Color.FromHex("#0194f3"));
                                            });
                                        });

                                    timeRow.ConstantItem(30);

                                    timeRow.RelativeItem().Border(1).BorderColor(Color.FromHex("#0194f3"))
                                        .Padding(15).Column(col =>
                                        {
                                            col.Item().Text("Thời gian kết thúc").FontSize(10).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                            col.Item().PaddingTop(5).Text(firstTicket.EndTime.ToString("dd MMM yyyy"))
                                                .FontSize(14).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                            col.Item().PaddingTop(3).Row(r =>
                                            {
                                                r.ConstantItem(20).Text("🕐").FontSize(12);
                                                r.RelativeItem().PaddingLeft(5).Text(firstTicket.EndTime.ToString("HH:mm"))
                                                    .FontSize(12).FontColor(Color.FromHex("#0194f3"));
                                            });
                                        });
                                });
                            }

                            // Table header
                            contentCol.Item().PaddingTop(30).Background(Color.FromHex("#f5f5f5")).Padding(12)
                                .Text("THÔNG TIN VÉ CHI TIẾT").FontSize(11).Bold().FontColor(Color.FromHex("#3c3c3c"));

                            // Ticket details table
                            foreach (var ticket in tickets)
                            {
                                contentCol.Item().Border(1).BorderColor(Color.FromHex("#e0e0e0")).Column(ticketCol =>
                                {
                                    ticketCol.Item().Background(Colors.White).Padding(15).Row(ticketRow =>
                                    {
                                        ticketRow.RelativeItem().Column(infoCol =>
                                        {
                                            infoCol.Item().Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Loại vé:").FontSize(10).FontColor(Color.FromHex("#686868"));
                                                r.RelativeItem().Text(ticket.TicketType).FontSize(11).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                            });
                                            infoCol.Item().PaddingTop(8).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Khách:").FontSize(10).FontColor(Color.FromHex("#686868"));
                                                r.RelativeItem().Text(ticket.CustomerName).FontSize(11).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                            });
                                            infoCol.Item().PaddingTop(8).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Mã vé:").FontSize(10).FontColor(Color.FromHex("#686868"));
                                                r.RelativeItem().Text(ticket.TicketCode).FontSize(10).FontFamily("Courier New").FontColor(Color.FromHex("#3c3c3c"));
                                            });
                                            infoCol.Item().PaddingTop(8).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Giá vé:").FontSize(10).FontColor(Color.FromHex("#686868"));
                                                r.RelativeItem().Text($"{ticket.Price:N0} VND").FontSize(11).Bold().FontColor(Color.FromHex("#3c3c3c"));
                                            });
                                        });

                                        ticketRow.ConstantItem(120).AlignMiddle().Column(qrCol =>
                                        {
                                            qrCol.Item().Width(100).Height(100).Border(1).BorderColor(Color.FromHex("#e0e0e0")).Padding(5).Element(qr =>
                                            {
                                                if (qrImages[ticket.TicketCode].Any())
                                                    qr.Image(qrImages[ticket.TicketCode]).FitArea();
                                                else
                                                    qr.AlignCenter().AlignMiddle().Text("QR N/A").FontSize(9).FontColor(Color.FromHex("#686868"));
                                            });
                                        });
                                    });
                                });
                            }

                            // Notes
                            contentCol.Item().PaddingTop(30).Column(notesCol =>
                            {
                                notesCol.Item().Text("LƯU Ý QUAN TRỌNG!").FontSize(12).Bold().FontColor(Color.FromHex("#3c3c3c"));

                                notesCol.Item().PaddingTop(10).Column(listCol =>
                                {
                                    listCol.Item().PaddingBottom(5).Row(r =>
                                    {
                                        r.ConstantItem(15).Text("•").FontSize(11).FontColor(Color.FromHex("#3c3c3c"));
                                        r.RelativeItem().Text("Vui lòng đến sớm 15-30 phút để hoàn tất thủ tục check-in")
                                            .FontSize(10).FontColor(Color.FromHex("#686868"));
                                    });
                                    listCol.Item().PaddingBottom(5).Row(r =>
                                    {
                                        r.ConstantItem(15).Text("•").FontSize(11).FontColor(Color.FromHex("#3c3c3c"));
                                        r.RelativeItem().Text("Mang theo giấy tờ tùy thân hợp lệ và vé điện tử")
                                            .FontSize(10).FontColor(Color.FromHex("#686868"));
                                    });
                                    listCol.Item().PaddingBottom(5).Row(r =>
                                    {
                                        r.ConstantItem(15).Text("•").FontSize(11).FontColor(Color.FromHex("#3c3c3c"));
                                        r.RelativeItem().Text("Liên hệ ngay nếu có bất kỳ thắc mắc nào")
                                            .FontSize(10).FontColor(Color.FromHex("#686868"));
                                    });
                                });
                            });
                        });

                        // Footer
                        mainCol.Item().PaddingTop(20).PaddingHorizontal(25).PaddingBottom(25).Column(footerCol =>
                        {
                            footerCol.Item().LineHorizontal(1).LineColor(Color.FromHex("#e0e0e0"));
                            footerCol.Item().PaddingTop(15).Row(r =>
                            {
                                r.RelativeItem().Text("© AIEvent - Nền tảng đặt vé sự kiện").FontSize(9).FontColor(Color.FromHex("#686868"));
                                r.ConstantItem(200).AlignRight().Text("📱 Xuất trình mã QR khi tham dự").FontSize(9).FontColor(Color.FromHex("#686868"));
                            });
                        });
                    });
                });
            });

            return pdf.GeneratePdf();
        }

    }
}
