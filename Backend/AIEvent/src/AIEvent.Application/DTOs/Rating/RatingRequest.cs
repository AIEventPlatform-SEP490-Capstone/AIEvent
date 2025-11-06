using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Rating
{
    public class RatingRequest
    {
        [Range(1, 5)] 
        public byte RatingScore { get; set; }
        public string? Comment { get; set; }
    }
}
