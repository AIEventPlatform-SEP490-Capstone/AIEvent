using AIEvent.Application.Services.Interfaces;
using QRCoder;
using Microsoft.AspNetCore.Http;
using System.Collections.Concurrent;

namespace AIEvent.Application.Services.Implements
{
    public class QrCodeService : IQrCodeService
    {
        private readonly ICloudinaryService _cloudinaryService;

        public QrCodeService(ICloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

        public async Task<(Dictionary<string, byte[]> Bytes, Dictionary<string, string> Urls)> GenerateQrBytesAndUrlsAsync(List<string> contents)
        {
            var qrBytesDict = new Dictionary<string, byte[]>();
            var qrFiles = new List<(string Content, IFormFile File)>();

            foreach (var content in contents)
            {
                using var generator = new QRCodeGenerator();
                using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);

                // ✅ Dùng ImageSharp renderer thay vì Bitmap
                var qrCode = new PngByteQRCode(data);
                var bytes = qrCode.GetGraphic(20);

                qrBytesDict[content] = bytes;

                var fileStream = new MemoryStream(bytes);
                var file = new FormFile(fileStream, 0, bytes.Length, "qr", $"qr_{Guid.NewGuid():N}.png")
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "image/png"
                };
                qrFiles.Add((content, file));
            }

            var urls = new ConcurrentDictionary<string, string>();
            var uploadTasks = qrFiles.Select(async item =>
            {
                var url = await _cloudinaryService.UploadImageAsync(item.File);
                if (!string.IsNullOrEmpty(url))
                    urls[item.Content] = url;
            });

            await Task.WhenAll(uploadTasks);
            return (qrBytesDict, urls.ToDictionary());
        }
    }
}
