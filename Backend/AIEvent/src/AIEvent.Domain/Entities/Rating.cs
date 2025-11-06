using AIEvent.Domain.Base;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Entities
{
    public class Rating : BaseEntity
    {
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        [Range(1, 5)]
        public byte RatingScore { get; set; }
        public string? Comment { get; set; }
        public virtual Event Event { get; set; } = default!;
        public virtual User User { get; set; } = default!;
    }
}
