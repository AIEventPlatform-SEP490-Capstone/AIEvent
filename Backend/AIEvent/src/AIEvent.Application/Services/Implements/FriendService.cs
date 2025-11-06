using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Friend;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class FriendService : IFriendService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public FriendService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<Result> AddFriendRequestAsync(Guid id, string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var receiverId))
                    return ErrorResponse.FailureResult("Invalid Guid format.", ErrorCodes.InvalidInput);

                if (id == receiverId)
                    return ErrorResponse.FailureResult("You cannot send a friend request to yourself.", ErrorCodes.InvalidInput);

                var existingFriendship = await _unitOfWork.FriendshipRepository.Query()
                    .Where(f =>
                        (f.SenderId == id && f.ReceiverId == receiverId) ||
                        (f.SenderId == receiverId && f.ReceiverId == id))
                    .AsNoTracking()
                    .Select(f => new { f.Status })
                    .FirstOrDefaultAsync();

                if (existingFriendship != null)
                {
                    return existingFriendship.Status switch
                    {
                        FriendshipStatus.Pending => ErrorResponse.FailureResult("Friend request already sent.", ErrorCodes.InvalidInput),
                        FriendshipStatus.Accepted => ErrorResponse.FailureResult("You are already friends.", ErrorCodes.InvalidInput),
                        FriendshipStatus.Blocked => ErrorResponse.FailureResult("You cannot send a friend request to this user.", ErrorCodes.InvalidInput),
                        _ => ErrorResponse.FailureResult("Friendship already exists.", ErrorCodes.InvalidInput)
                    };
                }

                var receiverExists = await _unitOfWork.UserRepository.Query()
                    .Where(u => u.Id == receiverId && !u.IsDeleted && u.IsActive)
                    .AsNoTracking()
                    .Select(u => u.Id)
                    .AnyAsync()
                    .ConfigureAwait(false);

                if (!receiverExists)
                    return ErrorResponse.FailureResult("Receiver not found.", ErrorCodes.NotFound);

                var friendship = new Friendship
                {
                    SenderId = id,
                    ReceiverId = receiverId,
                    Status = FriendshipStatus.Pending
                };

                await _unitOfWork.FriendshipRepository.AddAsync(friendship).ConfigureAwait(false);
                await _unitOfWork.SaveChangesAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Failed to send friend request: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result> RespondFriendRequestAsync(string id, Guid userId, bool isAccepted)
        {
            try
            {
                if (!Guid.TryParse(id, out var friendshipId))
                    return ErrorResponse.FailureResult("Invalid Guid format.", ErrorCodes.InvalidInput);

                var friendship = await _unitOfWork.FriendshipRepository
                    .Query()
                    .FirstOrDefaultAsync(f => f.Id == friendshipId && !f.IsDeleted);

                if (friendship == null)
                    return ErrorResponse.FailureResult("Friend request not found", ErrorCodes.NotFound);

                if (friendship.ReceiverId != userId)
                    return ErrorResponse.FailureResult("You are not authorized to respond to this request", ErrorCodes.PermissionDenied);

                if (friendship.Status != FriendshipStatus.Pending)
                    return ErrorResponse.FailureResult("This friend request has already been processed", ErrorCodes.InvalidInput);

                friendship.Status = isAccepted ? FriendshipStatus.Accepted : FriendshipStatus.Rejected;

                await _unitOfWork.FriendshipRepository.UpdateAsync(friendship);
                await _unitOfWork.SaveChangesAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Failed to respond to friend request: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<BasePaginated<ListAddFriendRequest>>> GetFriendInvitationsAsync(Guid userId, int pageNumber, int pageSize) 
        { 
            IQueryable<Friendship> query = _unitOfWork.FriendshipRepository
                .Query()
                .AsNoTracking()
                .Where(x => x.ReceiverId == userId && x.Status == FriendshipStatus.Pending)
                .OrderByDescending(x => x.CreatedAt); 
            
            int totalCount = await query.CountAsync(); 
            
            var invitations = await query.Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new ListAddFriendRequest 
                { 
                    Id = x.Id, 
                    SenderName = x.Sender.FullName!, 
                    SenderAvatar = x.Sender.AvatarImgUrl, 
                    SentDate = x.CreatedAt, 
                })
                .ToListAsync(); 

            return Result<BasePaginated<ListAddFriendRequest>>.Success(new BasePaginated<ListAddFriendRequest>(invitations, totalCount, pageNumber, pageSize)); 
        }

        public async Task<Result<BasePaginated<ListFriendResponse>>> GetListFriendAsync(Guid userId, int pageNumber, int pageSize)
        {
            try
            {
                var baseQuery = _unitOfWork.FriendshipRepository
                    .Query()
                    .AsNoTracking()
                    .Where(f => f.Status == FriendshipStatus.Accepted &&
                               (f.SenderId == userId || f.ReceiverId == userId));

                int totalCount = await baseQuery.CountAsync();

                var friendList = await baseQuery
                    .OrderByDescending(f => f.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(f => new
                    {
                        FriendId = f.SenderId == userId ? f.ReceiverId : f.SenderId,
                        FriendName = f.SenderId == userId ? f.Receiver.FullName : f.Sender.FullName,
                        Image = f.SenderId == userId ? f.Receiver.AvatarImgUrl : f.Sender.AvatarImgUrl,
                        District = f.SenderId == userId ? f.Receiver.District : f.Sender.District,
                        InterestsJson = f.SenderId == userId ? f.Receiver.UserInterestsJson : f.Sender.UserInterestsJson
                    })
                    .ToListAsync();

                var friendIds = friendList.Select(x => x.FriendId).ToList();

                var commonEventCounts = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => e.Bookings.Any(b => b.UserId == userId) &&
                                e.Bookings.Any(b => friendIds.Contains(b.UserId)))
                    .SelectMany(e => e.Bookings
                        .Where(b => friendIds.Contains(b.UserId))
                        .Select(b => b.UserId))
                    .GroupBy(uid => uid)
                    .Select(g => new { FriendId = g.Key, EventCount = g.Count() })
                    .ToDictionaryAsync(x => x.FriendId, x => x.EventCount);

                var resultData = friendList.Select(f => new ListFriendResponse
                {
                    Id = f.FriendId,
                    FriendName = f.FriendName!,
                    Image = f.Image,
                    District = f.District,
                    InterestsJson = f.InterestsJson,
                    EventNumber = commonEventCounts.TryGetValue(f.FriendId, out int count) ? count : 0
                }).ToList();

                var result = new BasePaginated<ListFriendResponse>(resultData, totalCount, pageNumber, pageSize);

                return Result<BasePaginated<ListFriendResponse>>.Success(result);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Failed to load friends: {ex.Message}",ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<BasePaginated<ListFriendResponse>>> SearchFriendsAsync(Guid userId, string keyword, int pageNumber, int pageSize)
        {
            try
            {
                keyword = keyword.Trim().ToLower();

                var existingFriendIds = await _unitOfWork.FriendshipRepository
                    .Query()
                    .AsNoTracking()
                    .Where(f =>
                        (f.SenderId == userId || f.ReceiverId == userId) &&
                        f.Status == FriendshipStatus.Accepted)
                    .Select(f => f.SenderId == userId ? f.ReceiverId : f.SenderId)
                    .ToListAsync();

                var baseQuery = _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Where(u => u.IsActive && !u.IsDeleted && u.Id != userId)
                    .Where(u =>
                        !existingFriendIds.Contains(u.Id) &&
                        (
                            (u.FullName != null && u.FullName.ToLower().Contains(keyword)) ||
                            (u.Email != null && u.Email.ToLower().Contains(keyword))
                        ));

                int totalCount = await baseQuery.CountAsync();

                var users = await baseQuery
                    .OrderBy(u => u.FullName)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new ListFriendResponse
                    {
                        Id = u.Id,
                        FriendName = u.FullName!,
                        Image = u.AvatarImgUrl,
                        District = u.District,
                        InterestsJson = u.UserInterestsJson,
                        EventNumber = 0 
                    })
                    .ToListAsync();

                var result = new BasePaginated<ListFriendResponse>(users, totalCount, pageNumber, pageSize);

                return Result<BasePaginated<ListFriendResponse>>.Success(result);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Failed to search friends: {ex.Message}",ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result> DeleteFriendAsync(Guid userId, string id)
        {
            if (!Guid.TryParse(id, out var friendId))
                return ErrorResponse.FailureResult("Invalid Guid format.", ErrorCodes.InvalidInput);

            var friendship = await _unitOfWork.FriendshipRepository
                .Query()
                .FirstOrDefaultAsync(f =>
                    ((f.SenderId == userId && f.ReceiverId == friendId) ||
                     (f.SenderId == friendId && f.ReceiverId == userId)) &&
                    f.Status == FriendshipStatus.Accepted);

            if (friendship == null)
            {
                return ErrorResponse.FailureResult("Friend not found", ErrorCodes.NotFound);
            }

            await _unitOfWork.FriendshipRepository.DeleteAsync(friendship);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<FriendProfileResponse>> GetFriendProfileAsync(Guid userId, string id)
        {
            if (!Guid.TryParse(id, out var friendId))
                return ErrorResponse.FailureResult("Invalid Guid format.", ErrorCodes.InvalidInput);

            // Kiểm tra quan hệ bạn bè
            var isFriend = await _unitOfWork.FriendshipRepository
                .Query()
                .AsNoTracking()
                .AnyAsync(f =>
                    f.Status == FriendshipStatus.Accepted &&
                    ((f.SenderId == userId && f.ReceiverId == friendId) ||
                     (f.SenderId == friendId && f.ReceiverId == userId)));

            if (!isFriend)
                return ErrorResponse.FailureResult("Friendship not found", ErrorCodes.NotFound);

            // Lấy thông tin bạn bè
            var friend = await _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == friendId && u.IsActive);

            if (friend == null)
                return ErrorResponse.FailureResult("Friend not found", ErrorCodes.NotFound);

            // Map sang response
            var response = _mapper.Map<FriendProfileResponse>(friend);

            // Lấy danh sách sự kiện chung (chỉ select thô)
            var eventData = await _unitOfWork.EventRepository
                .Query()
                .AsNoTracking()
                .Where(e =>
                    e.Bookings.Any(b => b.UserId == userId) &&
                    e.Bookings.Any(b => b.UserId == friendId))
                .Select(e => new
                {
                    e.Title,
                    e.Address,
                    e.StartTime,
                    e.ImgListEvent
                })
                .ToListAsync();

            // Sau khi truy vấn, xử lý parse JSON ở bộ nhớ
            response.ListCommonEvent = eventData.Select(e => new CommonEvent
            {
                EventName = e.Title,
                Address = e.Address,
                Date = e.StartTime,
                EventImage = ParseFirstImageFromJson(e.ImgListEvent)
            }).ToList();

            return Result<FriendProfileResponse>.Success(response);
        }

        private string? ParseFirstImageFromJson(string? imgListJson)
        {
            if (string.IsNullOrWhiteSpace(imgListJson))
                return null;

            try
            {
                var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(imgListJson);
                return list?.FirstOrDefault();
            }
            catch
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(imgListJson);
                    if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                        return doc.RootElement[0].GetString();
                }
                catch { }
            }
            return null;
        }

    }
}
