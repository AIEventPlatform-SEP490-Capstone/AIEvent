using AIEvent.Application.Services.Interfaces;
using QRCoder;
using System.Drawing.Imaging;
using System.Drawing;
using Microsoft.AspNetCore.Http;

namespace AIEvent.Application.Services.Implements
{
    public class QrCodeService : IQrCodeService
    {
        private readonly ICloudinaryService _cloudinaryService;

        public QrCodeService(ICloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService; 
        }

        public async Task<string> GenerateQrCodeAsync(string content)
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new QRCode(qrCodeData);
            using Bitmap qrBitmap = qrCode.GetGraphic(20);

            using var stream = new MemoryStream();
            qrBitmap.Save(stream, ImageFormat.Png);
            stream.Position = 0;

            // Convert MemoryStream -> IFormFile để reuse CloudinaryService
            var file = new FormFile(stream, 0, stream.Length, "qr", $"ticket_qr_{Guid.NewGuid():N}.png")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/png"
            };

            var url = await _cloudinaryService.UploadImageAsync(file);
            return url!;
        }
    }
}
