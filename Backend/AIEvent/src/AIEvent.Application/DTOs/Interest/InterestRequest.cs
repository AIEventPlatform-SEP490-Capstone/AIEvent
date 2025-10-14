
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Interest
{
    public class InterestRequest
    {
        [Required]
        public required string InterestName { get; set; }
    }
}
