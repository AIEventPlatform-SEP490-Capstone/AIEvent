namespace AIEvent.Application.Services.Interfaces
{
    public interface IVoyageEmbeddingService
    {
        Task<float[]> GetEmbeddingAsync(string input);
    }
}
