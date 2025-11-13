using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace AIEvent.Domain.Entities
{
    [BsonIgnoreExtraElements]
    public class ChatLog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
        
        [BsonElement("UserId")]
        public Guid UserId { get; set; }
        
        [BsonElement("Prompt")]
        public string Prompt { get; set; } = default!;
        
        [BsonElement("Response")]
        public string Response { get; set; } = default!;
        
        [BsonElement("Session")]
        public Guid Session { get; set; }
        
        [BsonElement("SessionName")]
        public string? SessionName { get; set; }
        
        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
