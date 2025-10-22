using AIEvent.Application.Services.Interfaces;
using QRCoder;
using System.Drawing.Imaging;
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

            // Generate QR codes and store bytes
            foreach (var content in contents)
            {
                using var qrGenerator = new QRCodeGenerator();
                using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
                using var qrCode = new QRCode(qrCodeData);
                using var bitmap = qrCode.GetGraphic(20);

                using var stream = new MemoryStream();
                bitmap.Save(stream, ImageFormat.Png);
                var bytes = stream.ToArray();
                qrBytesDict[content] = bytes;

                // Create IFormFile for Cloudinary upload
                var fileStream = new MemoryStream(bytes);
                var file = new FormFile(fileStream, 0, bytes.Length, "qr", $"qr_{Guid.NewGuid():N}.png")
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "image/png"
                };
                qrFiles.Add((content, file));
            }

            // Upload to Cloudinary concurrently
            var urls = new ConcurrentDictionary<string, string>();
            var uploadTasks = qrFiles.Select(async (item, index) =>
            {
                var url = await _cloudinaryService.UploadImageAsync(item.File);
                if (!string.IsNullOrEmpty(url))
                {
                    urls[item.Content] = url;
                }
            });
            await Task.WhenAll(uploadTasks);

            return (qrBytesDict, urls.ToDictionary());
        }
    }
}
