namespace AIEvent.Domain.Base
{
    public abstract class BaseEntity
    {
        protected BaseEntity()
        {
            Id = Guid.NewGuid().ToString("N");
            IsDeleted = false;
        }
        public string Id { get; private set; }

        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public string? DeletedBy { get; set; }

        public DateTimeOffset CreatedTime { get; private set; }
        public DateTimeOffset? UpdatedTime { get; private set; }
        public DateTimeOffset? DeletedTime { get; private set; }
        public bool IsDeleted { get; private set; }

        public void SetCreated(string userId)
        {
            CreatedBy = userId;
            CreatedTime = DateTimeOffset.Now;
        }
        public void SetUpdated(string userId)
        {
            UpdatedBy = userId;
            UpdatedTime = DateTimeOffset.Now;
        }
        public void SetDeleted(string userId)
        {
            IsDeleted = true;
            DeletedBy = userId;
            DeletedTime = DateTimeOffset.Now;
        }
    }
}
