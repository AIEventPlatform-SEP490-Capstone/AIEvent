using AIEvent.Application.Services.Interfaces;
using QRCoder;

namespace AIEvent.Application.Services.Implements
{
    public class QrCodeService : IQrCodeService
    {
        public QrCodeService()
        {
        }

        public Dictionary<string, byte[]> GenerateQrBytes(List<string> contents)
        {
            var qrBytesDict = new Dictionary<string, byte[]>();

            foreach (var content in contents)
            {
                using var generator = new QRCodeGenerator();
                using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);

                var qrCode = new PngByteQRCode(data);
                var bytes = qrCode.GetGraphic(20);

                qrBytesDict[content] = bytes;
            }

            return qrBytesDict.ToDictionary(k => k.Key, v => v.Value);
        }
    }
}
