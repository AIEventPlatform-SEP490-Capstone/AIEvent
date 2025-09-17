using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Base
{
    public abstract class BaseEntity
    {
        protected BaseEntity()
        {
            Id = Guid.NewGuid().ToString("N");
            IsDeleted = false;
        }

        [Key]
        public string Id { get; private set; }

        public string? CreatedBy { get; private set; }
        public string? UpdatedBy { get; private set; }
        public string? DeletedBy { get; private set; }

        public DateTimeOffset CreatedAt { get; private set; }
        public DateTimeOffset? UpdatedAt { get; private set; }
        public DateTimeOffset? DeletedAt { get; private set; }
        public bool IsDeleted { get; private set; }

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
