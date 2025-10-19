using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.Services.Implements
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IHasherHelper _hasherHelper;

        public UserService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ICloudinaryService loudinaryService,
            IHasherHelper hasherHelper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cloudinaryService = loudinaryService;
            _hasherHelper = hasherHelper;
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

            return Result<UserDetailResponse>.Success(userResponse);
        }

        public async Task<Result> UpdateUserAsync(Guid userId, UpdateUserRequest request)
        {
            if (userId == Guid.Empty || request == null)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            var context = new ValidationContext(request);
            var results = new List<ValidationResult>();
            bool isValid = Validator.TryValidateObject(request, context, results, true);
            if (!isValid)
            {
                var messages = string.Join("; ", results.Select(r => r.ErrorMessage));
                return ErrorResponse.FailureResult(messages, ErrorCodes.InvalidInput);
            }
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

        public async Task<Result<BasePaginated<UserResponse>>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 10)
        {
            IQueryable<User> userQuery = _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .OrderByDescending(s => s.CreatedAt);

            int totalCount = await userQuery.CountAsync();

            var result = await userQuery
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<UserResponse>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new BasePaginated<UserResponse>(result, totalCount, pageNumber, pageSize);
        }


        public async Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            if (userId == Guid.Empty || request == null)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            var context = new ValidationContext(request);
            var results = new List<ValidationResult>();
            bool isValid = Validator.TryValidateObject(request, context, results, true);
            if (!isValid)
            {
                var messages = string.Join("; ", results.Select(r => r.ErrorMessage));
                return ErrorResponse.FailureResult(messages, ErrorCodes.InvalidInput);
            }
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.Unauthorized);

            if (!user.IsActive || user.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("User account is inactive", ErrorCodes.Unauthorized);

            if (!_hasherHelper.Verify(request.CurrentPassword, user.PasswordHash!))
                return ErrorResponse.FailureResult("Old password not true", ErrorCodes.InvalidInput);
            if (_hasherHelper.Verify(request.NewPassword, user.PasswordHash!))
                return ErrorResponse.FailureResult("New password cannot be the same as current password", ErrorCodes.InvalidInput);

            user.PasswordHash = _hasherHelper.Hash(request.NewPassword);
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }
    }
}
