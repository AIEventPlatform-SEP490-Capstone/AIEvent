using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class EventInvitationService : IEventInvitationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHangfireJobService _hangfireJobService;
        private readonly INotificationService _notificationService;

        public EventInvitationService(IUnitOfWork unitOfWork, IHangfireJobService hangfireJobService, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _hangfireJobService = hangfireJobService;
            _notificationService = notificationService;
        }

        public async Task<Result> InviteFriendsAsync(Guid eventId, Guid userId, InviteFriendRequest request)
        {
            if (request.InvitedUserIds == null || !request.InvitedUserIds.Any())
                return ErrorResponse.FailureResult("No invited users provided.", ErrorCodes.InvalidInput);

            var userInviter = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if(userInviter == null || userInviter.IsDeleted)
                return ErrorResponse.FailureResult("User not found.", ErrorCodes.NotFound);

            var eventEntity = await _unitOfWork.EventRepository
                                        .Query()
                                        .FirstOrDefaultAsync(e => e.Id == eventId 
                                                                && e.Status == EventStatus.Approved
                                                                && e.Publish == true);
            if (eventEntity == null)
                return ErrorResponse.FailureResult("Event not found.", ErrorCodes.NotFound);

            if (eventEntity.StartTime < DateTime.UtcNow)
                return ErrorResponse.FailureResult("Cannot invite users to past events.", ErrorCodes.InvalidInput);

            var friendIds = await _unitOfWork.FriendshipRepository
                                    .Query()
                                    .Where(f => f.Status == FriendshipStatus.Accepted &&
                                            (f.SenderId == userId || f.ReceiverId == userId))
                                    .Select(f => f.SenderId == userId ? f.ReceiverId : f.SenderId)
                                    .ToListAsync(); 

            var invitedUsers = await _unitOfWork.UserRepository
                .Query()
                .Where(u => request.InvitedUserIds.Contains(u.Id)
                                        && friendIds.Contains(u.Id)
                                        && !u.IsDeleted)
                .ToListAsync();

            if (!invitedUsers.Any())
                return ErrorResponse.FailureResult("No valid users found to invite.", ErrorCodes.InvalidInput);

            var existingInvitedIds = await _unitOfWork.EventInvitationRepository
                .Query()
                .Where(ei => ei.EventId == eventId
                            && ei.InviterId == userId
                            && request.InvitedUserIds.Contains(ei.InvitedUserId!.Value)
                            && !ei.IsDeleted)
                .Select(ei => ei.InvitedUserId!.Value)
                .ToListAsync();

            var usersToInvite = invitedUsers
                .Where(u => !existingInvitedIds.Contains(u.Id))
                .ToList();

            var invitations = new List<EventInvitation>();
            var firstImage = !string.IsNullOrEmpty(eventEntity.ImgListEvent) ? eventEntity.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() : string.Empty;

            foreach (var user in usersToInvite)
            {
                invitations.Add(new EventInvitation
                {
                    EventId = eventId,
                    InviterId = userId,
                    Status = InvitationStatus.Pending,
                    InvitedUserId = user.Id,
                    Message = request.Message,
                });

                if (user.IsEmailNotificationEnabled == true && !string.IsNullOrEmpty(user.Email))
                {
                    var dto = new InviteFriendEmail
                    {
                        InvitedUserId = user.Id,
                        InvitedUserEmail = user.Email!,
                        InvitedUserFullName = user.FullName ?? user.Email!,
                        InviterId = userInviter.Id,
                        InviterFullName = userInviter.FullName ?? "Người dùng",
                        EventId = eventEntity.Id,
                        EventTitle = eventEntity.Title,
                        EventFirstImage = firstImage,
                        Message = request.Message
                    };
                    BackgroundJob.Enqueue(() => _hangfireJobService.EnqueueInviteEmail(dto));
                }
 
                var notificationRequest = new CreateNotificationRequest
                {
                    UserId = user.Id,
                    Title = "Lời mời tham gia sự kiện",
                    Message = $"<strong>{userInviter.FullName ?? "Người dùng"}</strong> đã mời bạn tham gia sự kiện <strong>{eventEntity.Title}</strong>.{(string.IsNullOrEmpty(request.Message) ? "" : $" \"{request.Message}\"")}",
                    Type = NotificationType.EventInvitation, 
                    EventId = eventEntity.Id,
                    ImageUrl = firstImage
                };

                await _notificationService.CreateNotificationAsync(notificationRequest);
            }

            await _unitOfWork.EventInvitationRepository.AddRangeAsync(invitations);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> ConfirmInvitationAsync(Guid invitationId, Guid userId, ConfirmInvitationRequest request)
        {
            var invitedUser = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (invitedUser == null || invitedUser.IsDeleted)
                return ErrorResponse.FailureResult("User does not exist.", ErrorCodes.Unauthorized);

            var invitation = await _unitOfWork.EventInvitationRepository
                .Query()
                .Include(i => i.Event)
                .Include(i => i.Inviter) 
                .FirstOrDefaultAsync(i => i.Id == invitationId
                                         && i.InvitedUserId == userId
                                         && !i.IsDeleted);

            if (invitation == null)
                return ErrorResponse.FailureResult("The invitation does not exist or you do not have permission.", ErrorCodes.NotFound);

         

            if (invitation.Inviter == null || invitation.Inviter.IsDeleted)
                return ErrorResponse.FailureResult("The invite sender does not exist.", ErrorCodes.NotFound);
            if (request.Status == ConfirmStatus.Approved)
                invitation.Status = InvitationStatus.Accepted;
            else
                invitation.Status = InvitationStatus.Rejected;

            invitation.RespondedAt = DateTime.UtcNow;

            var firstImage = !string.IsNullOrEmpty(invitation.Event.ImgListEvent) ? invitation.Event.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() : string.Empty;

            if (invitation.Inviter?.IsEmailNotificationEnabled == true &&
                !string.IsNullOrWhiteSpace(invitation.Inviter?.Email))
            {
                var dto = new ConfirmInvitationEmail
                {
                    InviterId = invitation.Inviter.Id,
                    InviterEmail = invitation.Inviter.Email!,
                    InviterFullName = invitation.Inviter.FullName ?? "Người dùng",
                    InvitedUserId = invitedUser.Id,
                    InvitedUserFullName = invitedUser.FullName ?? "Người dùng",
                    EventId = invitation.Event.Id,
                    EventTitle = invitation.Event.Title,
                    EventFirstImage = firstImage,
                    Message = invitation.Message,
                    Status = request.Status
                };
                BackgroundJob.Enqueue(() => _hangfireJobService.EnqueueConfirmEmail(dto));
            }

            if (invitation.InviterId != Guid.Empty)
            {
                var action = request.Status == ConfirmStatus.Approved ? "chấp nhận" : "từ chối";
                var notificationRequest = new CreateNotificationRequest
                {
                    UserId = invitation.InviterId,
                    Title = request.Status == ConfirmStatus.Approved 
                        ? "Lời mời đã được chấp nhận" 
                        : "Lời mời đã bị từ chối",
                    Message = $"<strong>{invitedUser.FullName ?? "Người dùng"}</strong> đã <strong>{action}</strong> lời mời tham gia sự kiện <strong>{invitation.Event.Title}</strong>.",
                    Type = request.Status == ConfirmStatus.Approved 
                        ? NotificationType.EventInvitationAccepted 
                        : NotificationType.EventInvitationRejected, 
                    EventId = invitation.Event.Id,
                    ImageUrl = firstImage
                };

                await _notificationService.CreateNotificationAsync(notificationRequest);
            }

            await _unitOfWork.EventInvitationRepository.UpdateAsync(invitation);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<BasePaginated<InviteFriendResponse>>> GetInviteFriendsByStatusAsync(Guid userId, InvitationStatus? status, int pageNumber, int pageSize)
        {
            IQueryable<EventInvitation> eventInvitations = _unitOfWork.EventInvitationRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(ei => (ei.InvitedUserId == userId || ei.InviterId == userId)
                                                        && ei.IsDeleted == false);

            if (status != null || status.HasValue)
                eventInvitations = eventInvitations
                                .Where(e => e.Status == status);

            int totalCount = await eventInvitations.CountAsync();

            var result = await eventInvitations
                .OrderByDescending(e => e.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(ei => new InviteFriendResponse
                {
                    InvitationId = ei.Id,
                    EventId = ei.EventId,
                    EventTitle = ei.Event.Title,
                    EventImage = !string.IsNullOrEmpty(ei.Event.ImgListEvent)
                    ? ei.Event.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                    : null,
                    InviterId = ei.InviterId,
                    InvitedUserId  = ei.InvitedUserId,
                    InviteName = ei.Inviter.FullName ?? "Người dùng",
                    InviteEmail = ei.Inviter.Email ?? "Người dùng",
                    InvitedUserName = ei.InvitedUser!.FullName ?? "Người dùng",
                    InvitedUserEmail = ei.InvitedUser.Email ?? "Người dùng",
                    Message = ei.Message,
                    Status = ei.Status!.Value,
                    CreatedAt = ei.CreatedAt,
                    RespondedAt = ei.RespondedAt
                })
                .ToListAsync();

            return new BasePaginated<InviteFriendResponse>(result, totalCount, pageNumber, pageSize);
        }
    }
}
