using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Hubs;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IHasherHelper _hasherHelper;
        private readonly IEmailService _emailService;
        private readonly IHangfireJobService _hangfireJobService;

        public UserService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ICloudinaryService loudinaryService,
            IHasherHelper hasherHelper,
            IEmailService emailService,
            IHangfireJobService hangfireJobService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cloudinaryService = loudinaryService;
            _hasherHelper = hasherHelper;
            _emailService = emailService;
            _hangfireJobService = hangfireJobService;
        }

        public async Task<Result<UserDetailResponse>> GetUserByIdAsync(Guid userId)
        {
            if(userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            var user = await _unitOfWork.UserRepository
                                        .GetByIdAsync(userId, true);
            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            if (!user.IsActive)
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

            await _hangfireJobService.EnqueueUserEmbeddingJobAsync(user.Id);

            return Result.Success();
        }

        public async Task<Result<BasePaginated<UserResponse>>> GetAllUsersAsync(int pageNumber, int pageSize, string? email, string? name, string? role)
        {
            var roleAdmin = await _unitOfWork.RoleRepository
                .Query()
                .AsNoTracking()
                .Select(r => new { r.Id, r.Name, r.IsDeleted })
                .FirstOrDefaultAsync(r => r.Name == "Admin" && !r.IsDeleted);
            if (roleAdmin == null)
                return ErrorResponse.FailureResult("Role Admin not found", ErrorCodes.NotFound);

            IQueryable<User> userQuery = _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .Where(u => u.IsActive && !u.IsDeleted && u.Id != roleAdmin.Id)
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
                return ErrorResponse.FailureResult("Invalid ID format", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.Query()
                .FirstOrDefaultAsync(u => u.Id == Id && !u.IsDeleted && u.IsActive && u.Id != userId);

            if(user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            user.SetDeleted(userId.ToString());
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> UnBanUserAsync(string id)
        {
            if (!Guid.TryParse(id, out var Id))
                return ErrorResponse.FailureResult("Invalid ID format", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.Query()
                .FirstOrDefaultAsync(u => u.Id == Id && u.IsDeleted && u.IsActive);

            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            user.IsDeleted = false;
            user.DeletedAt = null;
            user.DeletedBy = null;

            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<BasePaginated<UserResponse>>> GetAllUsersBannedAsync(int pageNumber, int pageSize, string? email, string? name, string? role)
        {
            IQueryable<User> userQuery = _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .Where(u => u.IsActive && u.IsDeleted)
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

        public async Task<Result> CreateManagerAccountAsync(CreateAccountRequest request)
        {
            try
            {
                var existingUser = await _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Select(u => new 
                    { 
                        u.IsActive, 
                        u.IsDeleted, 
                        u.PhoneNumber, 
                        u.Email
                    })
                    .FirstOrDefaultAsync(u => (u.Email == request.Email || u.PhoneNumber == request.PhoneNumber) &&
                                               !u.IsDeleted && u.IsActive);

                if (existingUser != null)
                {
                    if(existingUser.Email == request.Email)
                    {
                        return ErrorResponse.FailureResult("Email is already existing", ErrorCodes.InvalidInput);
                    }
                    else
                    {
                        return ErrorResponse.FailureResult("PhoneNumber is already existing", ErrorCodes.InvalidInput);
                    }
                }

                var role = await _unitOfWork.RoleRepository
                    .Query()
                    .AsNoTracking()
                    .Select(r => new {r.Id,  r.Name, r.IsDeleted})
                    .FirstOrDefaultAsync(r => r.Name == "Manager" && !r.IsDeleted);
                if (role == null)
                {
                    return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
                }

                User newManager = new()
                {
                    RoleId = role.Id,
                    FullName = request.FullName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    Address = request.Address,
                    IsActive = true,
                };
                newManager.PasswordHash = _hasherHelper.Hash(request.Password);

                if (request.Image != null && request.Image.Length > 0)
                    newManager.AvatarImgUrl = await _cloudinaryService.UploadImageAsync(request.Image);

                await _unitOfWork.UserRepository.AddAsync(newManager);
                await _unitOfWork.SaveChangesAsync();

                var sb = new StringBuilder()
                            .AppendLine($"<p>Xin chào {request.FullName},</p>")
                            .AppendLine($"<p>Hồ sơ đăng ký quản lí nền tảng AIEvent của bạn đã được <b>khởi tạo thành công</b>.</p>")
                            .AppendLine("<p>Thông tin đăng nhập của bạn là:</p>")
                            .AppendLine("<ul>")
                            .AppendLine($"<li>Email: <b>{request.Email}</b></li>")
                            .AppendLine($"<li>Mật khẩu: <b>{request.Password}</b></li>")
                            .AppendLine("</ul>")
                            .AppendLine("<p>Vui lòng đăng nhập và thực hiện <b>đổi mật khẩu ngay</b> sau khi truy cập để đảm bảo an toàn.</p>")
                            .AppendLine("<p>Trân trọng,<br/>Đội ngũ AIEvent</p>");

                MimeMessage msg = new()
                {
                    Subject = "Tài khoản Quản Trị Viên nền tảng AIEvent của bạn đã được tạo!",
                    Body = new TextPart("html") { Text = sb.ToString() }
                };

                var emailResult = await _emailService.SendEmailAsync(request.Email, msg);
                if (!emailResult.IsSuccess)
                    return ErrorResponse.FailureResult("Failed to send rejection email", ErrorCodes.InternalServerError);

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error : {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result> CreateStaffAccountAsync(Guid userId, CreateAccountRequest request)
        {
            try
            {
                var existingUser = await _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Select(u => new
                    {
                        u.IsActive,
                        u.IsDeleted,
                        u.PhoneNumber,
                        u.Email
                    })
                    .FirstOrDefaultAsync(u => (u.Email == request.Email || u.PhoneNumber == request.PhoneNumber) &&
                                               !u.IsDeleted && u.IsActive);

                if (existingUser != null)
                {
                    if (existingUser.Email == request.Email)
                    {
                        return ErrorResponse.FailureResult("Email is already existing", ErrorCodes.InvalidInput);
                    }
                    else
                    {
                        return ErrorResponse.FailureResult("PhoneNumber is already existing", ErrorCodes.InvalidInput);
                    }
                }

                var organizer = await _unitOfWork.OrganizerProfileRepository
                    .Query()
                    .AsNoTracking()
                    .Select(o => new {o.Id, o.UserId, o.IsDeleted, o.Status, o.CompanyName})
                    .FirstOrDefaultAsync(o => o.UserId == userId && !o.IsDeleted && o.Status == OrganizerProfileStatus.Approved);
                if (organizer == null)
                    return ErrorResponse.FailureResult("OrganizerProfile not found", ErrorCodes.NotFound);

                var role = await _unitOfWork.RoleRepository
                    .Query()
                    .AsNoTracking()
                    .Select(r => new { r.Id, r.Name, r.IsDeleted })
                    .FirstOrDefaultAsync(r => r.Name == "Staff" && !r.IsDeleted);
                if (role == null)
                    return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);

                User newStaff = new()
                {
                    RoleId = role.Id,
                    FullName = request.FullName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    Address = request.Address,
                    IsActive = true,
                };
                newStaff.PasswordHash = _hasherHelper.Hash(request.Password);

                if (request.Image != null && request.Image.Length > 0)
                    newStaff.AvatarImgUrl = await _cloudinaryService.UploadImageAsync(request.Image);

                await _unitOfWork.UserRepository.AddAsync(newStaff);

                StaffProfile staffProfile = new()
                {
                    UserId = newStaff.Id,
                    OrganizerProfileId = organizer.Id,
                };
                await _unitOfWork.StaffProfileRepository.AddAsync(staffProfile);

                await _unitOfWork.SaveChangesAsync();

                var sb = new StringBuilder()
                            .AppendLine($"<p>Xin chào {request.FullName},</p>")
                            .AppendLine($"<p>Hồ sơ đăng ký nhân viên tổ chức <b>{organizer.CompanyName}</b> nền tảng AIEvent của bạn đã được <b>tạo thành công</b>.</p>")
                            .AppendLine("<p>Thông tin đăng nhập của bạn là:</p>")
                            .AppendLine("<ul>")
                            .AppendLine($"<li>Email: <b>{request.Email}</b></li>")
                            .AppendLine($"<li>Mật khẩu: <b>{request.Password}</b></li>")
                            .AppendLine("</ul>")
                            .AppendLine("<p>Vui lòng giữ <b> bảo mật và không để lộ </b> thông tin ra ngoài dẫn đến các sự cố không muốn.</p>")
                            .AppendLine("<p>Nền tảng không <b> chịu bất kỳ trách nhiệm </b> nào cho trường hợp thông tin bị rò rỉ hoặc không nhớ thông tin.</p>")
                            .AppendLine("<p>Trân trọng,<br/>Đội ngũ AIEvent</p>");

                MimeMessage msg = new()
                {
                    Subject = "Tài khoản nhân viên nền tảng AIEvent của bạn đã tạo",
                    Body = new TextPart("html") { Text = sb.ToString() }
                };

                var emailResult = await _emailService.SendEmailAsync(request.Email, msg);
                if (!emailResult.IsSuccess)
                    return ErrorResponse.FailureResult("Failed to send rejection email", ErrorCodes.InternalServerError);

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error : {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<BasePaginated<AccountResponse>>> GetAllStaffAsync(int pageNumber, int pageSize, string? email, string? name, Guid userId)
        {
            IQueryable<User> userQuery = _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .Where(u => u.IsActive && !u.IsDeleted && u.Role.Name == "Staff" && u.StaffProfile!.OrganizerProfile.UserId == userId)
                .OrderByDescending(s => s.CreatedAt);

            if (!string.IsNullOrEmpty(email))
            {
                userQuery = userQuery.Where(u => u.Email!.Contains(email));
            }

            if (!string.IsNullOrEmpty(name))
            {
                userQuery = userQuery.Where(u => u.FullName!.Contains(name));
            }

            int totalCount = await userQuery.CountAsync();

            var result = await userQuery
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AccountResponse
                {
                    Id = u.Id,
                    Name = u.FullName!,
                    Email = u.Email!,
                    PhoneNumber = u.PhoneNumber!,
                    Image = u.AvatarImgUrl,
                })
                .ToListAsync();

            return new BasePaginated<AccountResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> BanStaffAsync(Guid userId, string id)
        {
            try
            {
                if (!Guid.TryParse(id, out var Id))
                    return ErrorResponse.FailureResult("Invalid ID format", ErrorCodes.InvalidInput);

                var user = await _unitOfWork.UserRepository.Query()
                    .Include(u => u.StaffProfile)
                        .ThenInclude(s => s!.OrganizerProfile)
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == Id && !u.IsDeleted && u.IsActive &&
                                              u.Role.Name == "Staff" &&
                                              u.StaffProfile!.OrganizerProfile.UserId == userId);

                if (user == null)
                    return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

                user.SetDeleted(userId.ToString());
                await _unitOfWork.UserRepository.UpdateAsync(user);
                await _unitOfWork.SaveChangesAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error : {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result> TurnOnOffLocationAsync(Guid userId, bool action)
        {
            try
            {
                var user = await _unitOfWork.UserRepository
                    .Query()
                    .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);

                if (user == null)
                    return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

                user.IsTurnOnLocation = action;

                await _unitOfWork.UserRepository.UpdateAsync(user);
                await _unitOfWork.SaveChangesAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error : {ex.Message}", ErrorCodes.InternalServerError);
            }
        }
    }
}
