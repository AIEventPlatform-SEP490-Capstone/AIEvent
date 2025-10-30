using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICloudinaryService _cloudinaryService;

        public UserService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ICloudinaryService loudinaryService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cloudinaryService = loudinaryService;
        }

        public async Task<Result<UserDetailResponse>> GetUserByIdAsync(Guid userId)
        {
            if(userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            var user = await _unitOfWork.UserRepository
                                        .GetByIdAsync(userId, true);
            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            if (!user.IsActive || user.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("User account is inactive", ErrorCodes.NotFound);

            var userResponse = _mapper.Map<UserDetailResponse>(user);

            var joinedEventsTask = await _unitOfWork.BookingRepository
                                            .Query()
                                            .AsNoTracking()
                                            .Where(b => b.UserId == userId && b.Status == BookingStatus.Completed)
                                            .CountAsync();

            var favoriteEventsTask = await _unitOfWork.FavoriteEventRepository
                                            .Query()
                                            .AsNoTracking()
                                            .Where(fe => fe.UserId == userId)
                                            .CountAsync();
            return Result<UserDetailResponse>.Success(userResponse);
        }

        public async Task<Result> UpdateUserAsync(Guid userId, UpdateUserRequest request)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            
            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            if (!user.IsActive || user.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("User account is inactive", ErrorCodes.NotFound);

            _mapper.Map(request, user);

            if(request.AvatarImg != null && request.AvatarImg.Length > 0)
                user.AvatarImgUrl = await _cloudinaryService.UploadImageAsync(request.AvatarImg);

            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<BasePaginated<UserResponse>>> GetAllUsersAsync(int pageNumber, int pageSize, string? email, string? name, string? role)
        {
            IQueryable<User> userQuery = _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .OrderByDescending(s => s.CreatedAt);

            if (!string.IsNullOrEmpty(email))
            {
                userQuery = userQuery.Where(u => u.Email!.Contains(email));
            }

            if (!string.IsNullOrEmpty(name))
            {
                userQuery = userQuery.Where(u => u.FullName!.Contains(name));
            }

            if (!string.IsNullOrEmpty(role))
            {
                var roleData = await _unitOfWork.RoleRepository.Query()
                    .AsNoTracking()
                    .Select(r => new { r.Id, r.Name, r.IsDeleted })
                    .FirstOrDefaultAsync(r => r.Name == role && !r.IsDeleted);
                if (roleData == null)
                    return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
                userQuery = userQuery.Where(u => u.RoleId == roleData.Id);
            }

            int totalCount = await userQuery.CountAsync();

            var result = await userQuery
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<UserResponse>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new BasePaginated<UserResponse>(result, totalCount, pageNumber, pageSize);
        }


        public async Task<Result> BanUserAsync(Guid userId, string id)
        {
            if (!Guid.TryParse(id, out var Id))
                return ErrorResponse.FailureResult("Invalid ticket ID format", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.Query()
                .FirstOrDefaultAsync(u => u.Id == Id && !u.IsDeleted && u.IsActive);

            if(user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            user.SetDeleted(userId.ToString());
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}
