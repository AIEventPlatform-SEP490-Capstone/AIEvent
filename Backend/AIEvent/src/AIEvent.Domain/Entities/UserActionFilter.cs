namespace AIEvent.Domain.Entities
{
    public partial class UserActionFilter
    {
        public Guid Id { get; set; }
        public Guid UserActionId { get; set; }
        public required string Field { get; set; } = string.Empty;
        public required string Value { get; set; } = string.Empty;

        public UserAction UserAction { get; set; } = null!;
    }
}
