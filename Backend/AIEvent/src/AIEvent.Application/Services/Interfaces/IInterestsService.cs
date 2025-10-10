using AIEvent.Application.DTOs.Interest;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IInterestsService
    {
        public Task<Result<BasePaginated<InterestResponse>>> GetInterestAsync(int pageNumber, int pageSize);
        Task<Result> UpdateInterestAsync(string id, InterestRequest request);
        Task<Result> DeleteInterestAsync(string id);
        Task<Result> CreateInterestAsync(InterestRequest request);
    }
}
