using AIEvent.Application.Services.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace AIEvent.Application.Services.Implements
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        private readonly string _name;
        private readonly string _key;
        private readonly string _secret;
        public CloudinaryService(IConfiguration configuration)
        {
            var cloudinarySettings = configuration.GetSection("Cloudinary");

            _name = cloudinarySettings["CloudName"] ?? throw new ArgumentNullException("Name is not configured");
            _key = cloudinarySettings["Key"] ?? throw new ArgumentNullException("Key is not configured");
            _secret = cloudinarySettings["Secret"] ?? throw new ArgumentNullException("Secret is not configured");
            _cloudinary = new Cloudinary(new Account(_name,_key, _secret));
        }

        public async Task<string?> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;
            using (var stream = file.OpenReadStream())
            {
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Transformation = new Transformation()
                                            .Width(500)
                                            .Height(500)
                                            .Crop("auto")
                                            .Gravity("auto")
                };
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                return uploadResult.SecureUrl.ToString();
            }
        }

    }
}
