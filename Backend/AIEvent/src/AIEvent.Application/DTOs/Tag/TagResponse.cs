namespace AIEvent.Application.DTOs.Tag
{
    public class TagResponse
    {
        public required string TagId { get; set; }
        public required string TagName { get; set; }
        public DateTimeOffset? CreatedDate { get; set; }
        public DateTimeOffset? UpdatedDate { get; set; }
        public int QuantityUsed { get; set; }
    }
}
