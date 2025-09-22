using Microsoft.AspNetCore.Http;

namespace AIEvent.Application.Services.Interfaces
{
    public interface ICloudinaryService
    {
        Task<string?> UploadImageAsync(IFormFile file);
    }
}
