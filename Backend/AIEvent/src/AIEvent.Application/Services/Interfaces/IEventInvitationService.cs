using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventInvitationService
    {
        Task<Result> InviteFriendsAsync(Guid eventId, Guid userId, InviteFriendRequest request);
        Task<Result> ConfirmInvitationAsync(Guid invitationId, Guid userId, ConfirmInvitationRequest request);
        Task<Result<BasePaginated<InviteFriendResponse>>> GetInviteFriendsByStatusAsync(Guid userId, InvitationStatus? status, int pageNumber, int pageSize);
    }
}
