using AIEvent.Application.Services.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using System.Text.RegularExpressions;

namespace AIEvent.Application.Services.Implements
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        public CloudinaryService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }

        public async Task DeleteImageAsync(string imgUrl)
        {
            if (string.IsNullOrWhiteSpace(imgUrl))
                return;

            var publicId = ExtractPublicIdFromUrl(imgUrl);
            if (string.IsNullOrEmpty(publicId))
                return;
            var deletionParams = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            };

            await _cloudinary.DestroyAsync(deletionParams);
        }

        private string? ExtractPublicIdFromUrl(string imgUrl)
        {
            try
            {
                var regex = new Regex(@"\/upload\/(?:v\d+\/)?(.+)\.\w+$");
                var match = regex.Match(imgUrl);
                return match.Success ? match.Groups[1].Value : null;
            }
            catch
            {
                return null;
            }
        }

        public async Task<string?> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;
            using (var stream = file.OpenReadStream())
            {
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "my_images",
                    Transformation = new Transformation()
                                            .Width(500)
                                            .Height(500)
                                            .Crop("fill")
                                            .Gravity("auto")
                };
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                return uploadResult.SecureUrl.ToString();
            }
        }

    }
}
