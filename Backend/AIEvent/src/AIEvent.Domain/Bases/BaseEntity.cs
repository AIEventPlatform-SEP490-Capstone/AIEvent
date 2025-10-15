using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Base
{
    public abstract class BaseEntity
    {
        protected BaseEntity()
        {
            Id = Guid.NewGuid();
            IsDeleted = false;
        }

        [Key]
        public Guid Id { get; set; }

        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public string? DeletedBy { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
        public DateTimeOffset? DeletedAt { get; set; }
        public bool IsDeleted { get; set; }

        public void SetCreated(string userId)
        {
            CreatedBy = userId;
            CreatedAt = DateTimeOffset.Now;
            UpdatedAt = DateTimeOffset.Now;
        }
        public void SetUpdated(string userId)
        {
            UpdatedBy = userId;
            UpdatedAt = DateTimeOffset.Now;
        }
        public void SetDeleted(string userId)
        {
            IsDeleted = true;
            DeletedBy = userId;
            DeletedAt = DateTimeOffset.Now;
        }
    }
}
