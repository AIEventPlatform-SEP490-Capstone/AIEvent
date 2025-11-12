using AIEvent.Application.DTOs.AIRecommendation;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPineconeVectorService
    {
        Task UpsertVectorAsync(string id, float[] values, Dictionary<string, object>? metadata = null);
        Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarAsync(float[] vector, int topK = 5);
        Task UpsertVectorAsync(IEnumerable<PineconeVector> vectors);
        Task DeleteVectorAsync(string id);
    }
}
