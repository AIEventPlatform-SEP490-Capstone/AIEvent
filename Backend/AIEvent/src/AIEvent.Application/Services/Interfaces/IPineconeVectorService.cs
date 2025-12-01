using AIEvent.Application.DTOs.PineconeVector;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPineconeVectorService
    {
        Task UpsertVectorAsync(string id, float[] values, bool isUser, Dictionary<string, object>? metadata = null);
        Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarAsync(float[] vector, bool isUser, int topK = 5);
        Task UpsertVectorAsync(IEnumerable<PineconeVector> vectors, bool isUser);
        Task DeleteVectorAsync(string id, bool isUser);
        Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarFriendAsync(
            float[] vector,
            bool isUser,
            int topK = 5,
            List<string>? excludeIds = null);
        Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarFriendInEventAsync(
            float[] vector,
            bool isUser,
            int topK = 5,
            List<string>? excludeIds = null,
            List<string>? includeIds = null);
    }
}
