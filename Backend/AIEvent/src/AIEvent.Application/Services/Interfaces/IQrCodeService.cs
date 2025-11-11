namespace AIEvent.Application.Services.Interfaces
{
    public interface IQrCodeService
    {
        Dictionary<string, byte[]> GenerateQrBytes(List<string> contents);
    }
}
