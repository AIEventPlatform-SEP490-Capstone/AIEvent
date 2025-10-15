namespace AIEvent.Application.Services.Interfaces
{
    public interface IQrCodeService
    {
        Task<string> GenerateQrCodeAsync(string content);
    }
}
