using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Rating
{
    public class RatingResponse
    {
        public string? UserName { get; set; } 
        public byte RatingScore { get; set; }
        public string? Comment { get; set; }
        public DateTimeOffset CreateAt { get; set; }    
    }
}
