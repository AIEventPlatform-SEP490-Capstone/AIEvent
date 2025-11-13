namespace AIEvent.Application.DTOs.PineconeVector
{
    public class PineconeVector
    {
        public string Id { get; set; } = default!;
        public float[] Values { get; set; } = default!;
        public Dictionary<string, object>? Metadata { get; set; }
    }
}
