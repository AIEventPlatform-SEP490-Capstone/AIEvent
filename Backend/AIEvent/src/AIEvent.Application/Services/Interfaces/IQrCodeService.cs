namespace AIEvent.Application.Services.Interfaces
{
    public interface IQrCodeService
    {
        Task<(Dictionary<string, byte[]> Bytes, Dictionary<string, string> Urls)> GenerateQrBytesAndUrlsAsync(List<string> contents);
    }
}
