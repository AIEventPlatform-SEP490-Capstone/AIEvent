using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Tag
{
    public class CreateTagRequest
    {
        [Required]
        public required string NameTag { get; set; }
    }
}
