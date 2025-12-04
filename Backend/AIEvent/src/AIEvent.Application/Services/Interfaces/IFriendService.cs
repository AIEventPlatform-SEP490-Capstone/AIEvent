using AIEvent.Application.DTOs.Friend;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IFriendService
    {
        Task<Result> AddFriendRequestAsync(Guid id, string userId);
        Task<Result> RespondFriendRequestAsync(string id, Guid userId, bool isAccepted);
        Task<Result<BasePaginated<ListAddFriendRequest>>> GetFriendInvitationsAsync(Guid userId, int pageNumber, int pageSize);
        Task<Result<BasePaginated<ListFriendResponse>>> GetListFriendAsync(Guid userId, int pageNumber, int pageSize, FriendshipStatus status);
        Task<Result<BasePaginated<ListFriendResponse>>> SearchFriendsAsync(Guid userId, string keyword, int pageNumber, int pageSize);
        Task<Result> DeleteFriendAsync(Guid userId, string id);
        Task<Result<FriendProfileResponse>> GetFriendProfileAsync(Guid userId, string id);
        Task<Result> BlockFriendAsync(Guid userId, string id);
        Task<Result> UnBlockFriendAsync(Guid userId, string id);
        Task<Result<List<FriendLocationResponse>>> GetFriendLocationAsync(Guid userId, int radius, double latitude, double longitude);
    }
}
