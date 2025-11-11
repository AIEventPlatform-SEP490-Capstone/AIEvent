using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Services.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Collections.Concurrent;

namespace AIEvent.Application.Services.Implements
{
    public class PdfService : IPdfService
    {
        public PdfService()
        {
        }

        public async Task<byte[]> GenerateTicketsPdfAsync(List<TicketForPdf> tickets, string eventName, string buyer, string email)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var qrImages = new ConcurrentDictionary<string, byte[]>();
            foreach (var ticket in tickets)
            {
                qrImages[ticket.TicketCode] = ticket.QrBytes ?? Array.Empty<byte>();
            }

            await Task.CompletedTask;

            var pdf = Document.Create(container =>
            {
                // Tạo mỗi vé riêng lẻ
                foreach (var ticket in tickets)
                {
                    container.Page(page =>
                    {
                        page.Margin(0);
                        page.Size(PageSizes.A4.Landscape().Width, 400);
                        page.PageColor(Colors.White);
                        page.DefaultTextStyle(x => x.FontSize(12).FontColor(Colors.Black).FontFamily("Arial"));

                        page.Content().Row(mainRow =>
                        {
                            // Phần BÊN TRÁI - Ảnh sự kiện (fill không gian)
                            mainRow.RelativeItem(1).Background(Color.FromHex("#f5f5f5")).Column(leftCol =>
                            {
                                if (ticket.EventImageBytes != null && ticket.EventImageBytes.Any())
                                {
                                    // Image căn giữa với background màu xám nhạt
                                    leftCol.Item().ExtendVertical().AlignCenter().AlignMiddle().Image(ticket.EventImageBytes).FitArea();
                                }
                                else
                                {
                                    // Placeholder nếu không có ảnh
                                    leftCol.Item().ExtendVertical().AlignCenter().AlignMiddle().Column(col =>
                                    {
                                        col.Item().Text("EVENT").FontSize(36).Bold().FontColor(Colors.Grey.Medium);
                                        col.Item().Text("IMAGE").FontSize(36).Bold().FontColor(Colors.Grey.Medium);
                                    });
                                }
                            });

                            // Đường kẻ dọc ngăn cách
                            mainRow.ConstantItem(3).Background(Color.FromHex("#e0e0e0"));

                            // Phần BÊN PHẢI - Thông tin vé
                            mainRow.RelativeItem(2).PaddingVertical(8).PaddingHorizontal(35).Column(rightCol =>
                            {
                                // Category tag
                                rightCol.Item().Row(tagRow =>
                                {
                                    tagRow.AutoItem().Background(Color.FromHex("#f0f0f0"))
                                        .PaddingVertical(3)
                                        .PaddingHorizontal(8)
                                        .Text(ticket.EventCategory.ToUpper())
                                        .FontSize(10)
                                        .Bold()
                                        .FontColor(Color.FromHex("#666666"))
                                        .LetterSpacing(1);

                                    tagRow.RelativeItem();

                                    // Địa chỉ bên phải
                                    tagRow.AutoItem().Column(locCol =>
                                    {
                                        locCol.Item().AlignRight().Text("📍 " + ticket.Address)
                                            .FontSize(10)
                                            .FontColor(Color.FromHex("#666666"));
                                    });
                                });

                                // Tên sự kiện
                                rightCol.Item().PaddingTop(8).Text(eventName)
                                    .FontSize(36)
                                    .Bold()
                                    .FontColor(Colors.Black);

                                // Các thông tin thời gian và giá vé trong các hộp
                                rightCol.Item().PaddingTop(8).Row(infoRow =>
                                {
                                    // Ngày
                                    infoRow.AutoItem().Border(2).BorderColor(Colors.Black)
                                        .PaddingVertical(8)
                                        .PaddingHorizontal(14)
                                        .Text(ticket.StartTime.ToString("MMM dd").ToUpper())
                                        .FontSize(14)
                                        .Bold()
                                        .FontColor(Colors.Black);

                                    infoRow.ConstantItem(10);

                                    // Giờ
                                    infoRow.AutoItem().Border(2).BorderColor(Colors.Black)
                                        .PaddingVertical(8)
                                        .PaddingHorizontal(14)
                                        .Text(ticket.StartTime.ToString("hh:mm tt").ToUpper())
                                        .FontSize(14)
                                        .Bold()
                                        .FontColor(Colors.Black);

                                    infoRow.ConstantItem(10);

                                    // Giá
                                    infoRow.AutoItem().Border(2).BorderColor(Colors.Black)
                                        .PaddingVertical(8)
                                        .PaddingHorizontal(14)
                                        .Text($"PRICE: {ticket.Price:N0} VND")
                                        .FontSize(14)
                                        .Bold()
                                        .FontColor(Colors.Black);
                                });

                                // Thông tin chi tiết vé
                                rightCol.Item().PaddingTop(6).Background(Color.FromHex("#f8f8f8"))
                                    .Padding(8)
                                    .Text("THÔNG TIN VÉ CHI TIẾT")
                                    .FontSize(10)
                                    .Bold()
                                    .FontColor(Color.FromHex("#666666"))
                                    .LetterSpacing(1);

                                rightCol.Item().Border(1).BorderColor(Color.FromHex("#e0e0e0"))
                                    .Padding(10).Row(detailRow =>
                                    {
                                        // Cột thông tin bên trái
                                        detailRow.RelativeItem().Column(infoCol =>
                                        {
                                            infoCol.Item().Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Loại vé:").FontSize(10).FontColor(Color.FromHex("#666666"));
                                                r.RelativeItem().Text(ticket.TicketType).FontSize(11).Bold().FontColor(Colors.Black);
                                            });

                                            infoCol.Item().PaddingTop(6).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Khách:").FontSize(10).FontColor(Color.FromHex("#666666"));
                                                r.RelativeItem().Text(ticket.CustomerName).FontSize(11).Bold().FontColor(Colors.Black);
                                            });

                                            infoCol.Item().PaddingTop(6).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Mã vé:").FontSize(10).FontColor(Color.FromHex("#666666"));
                                                r.RelativeItem().Text(ticket.TicketCode)
                                                    .FontSize(10)
                                                    .FontFamily("Courier New")
                                                    .FontColor(Color.FromHex("#333333"));
                                            });

                                            infoCol.Item().PaddingTop(6).Row(r =>
                                            {
                                                r.ConstantItem(80).Text("Giá vé:").FontSize(10).FontColor(Color.FromHex("#666666"));
                                                r.RelativeItem().Text($"{ticket.Price:N0} VND").FontSize(11).Bold().FontColor(Colors.Black);
                                            });
                                        });

                                        // QR code bên phải
                                        detailRow.ConstantItem(110).AlignMiddle().Column(qrCol =>
                                        {
                                            qrCol.Item().Width(100).Height(100).Border(2).BorderColor(Colors.Black)
                                                .Padding(5).Element(qr =>
                                                {
                                                    if (qrImages[ticket.TicketCode].Any())
                                                        qr.Image(qrImages[ticket.TicketCode]).FitArea();
                                                    else
                                                        qr.AlignCenter().AlignMiddle().Text("QR").FontSize(12).FontColor(Color.FromHex("#999999"));
                                                });
                                        });
                                    });

                                // Lưu ý quan trọng
                                rightCol.Item().PaddingTop(6).Column(notesCol =>
                                {
                                    notesCol.Item().Text("LƯU Ý QUAN TRỌNG").FontSize(11).Bold().FontColor(Colors.Black);

                                    notesCol.Item().PaddingTop(3).Column(listCol =>
                                    {
                                        listCol.Item().PaddingBottom(2).Row(r =>
                                        {
                                            r.ConstantItem(12).Text("•").FontSize(11).FontColor(Colors.Black);
                                            r.RelativeItem().Text("Vui lòng đến sớm 15-30 phút để hoàn tất thủ tục check-in")
                                                .FontSize(9).FontColor(Color.FromHex("#666666"));
                                        });

                                        listCol.Item().PaddingBottom(2).Row(r =>
                                        {
                                            r.ConstantItem(12).Text("•").FontSize(11).FontColor(Colors.Black);
                                            r.RelativeItem().Text("Mang theo giấy tờ tùy thân hợp lệ và mã QR của vé điện tử")
                                                .FontSize(9).FontColor(Color.FromHex("#666666"));
                                        });

                                        listCol.Item().Row(r =>
                                        {
                                            r.ConstantItem(12).Text("•").FontSize(11).FontColor(Colors.Black);
                                            r.RelativeItem().Text("Liên hệ ngay tại hotline: +84 337 252 208 nếu có bất kỳ thắc mắc nào")
                                                .FontSize(9).FontColor(Color.FromHex("#666666"));
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            });

            return pdf.GeneratePdf();
        }
    }
}