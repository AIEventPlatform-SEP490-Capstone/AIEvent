using AIEvent.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AIEvent.Domain.Entities
{
    public partial class UserInterest
    {
        [Required]
        public Guid InterestId { get; set; }
        public Interest Interest { get; set; } = default!;
        
        [Required]
        public Guid UserId { get; set; }
        public AppUser User { get; set; } = default!;
    }
}
