using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using System.Security.Cryptography;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class OrganizerService : IOrganizerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ITransactionHelper _transactionHelper;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IEmailService _emailService;
        private readonly IHasherHelper _hasherHelper;
        public OrganizerService(IUnitOfWork unitOfWork, IMapper mapper, 
            ITransactionHelper transactionHelper, ICloudinaryService cloudinaryService, IEmailService emailService, IHasherHelper hasherHelper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _transactionHelper = transactionHelper;
            _cloudinaryService = cloudinaryService;
            _emailService = emailService;
            _hasherHelper = hasherHelper;
        }

        public async Task<Result> RegisterOrganizerAsync(Guid userId,RegisterOrganizerRequest request)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);

            if (user == null || !user.IsActive)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            if (!string.IsNullOrEmpty(request.TaxCode))
            {
                var exists = await _unitOfWork.OrganizerProfileRepository.Query()
                    .AnyAsync(t => t.TaxCode == request.TaxCode);

                if (exists)
                    return ErrorResponse.FailureResult("Tax code already exists.", ErrorCodes.InvalidInput);
            }

            var organizer = _mapper.Map<OrganizerProfile>(request);
            organizer.UserId = userId;
            organizer.Status = ConfirmStatus.NeedConfirm;
            if (organizer == null)
                return ErrorResponse.FailureResult("Failed to map organizer profile", ErrorCodes.InternalServerError);

            var files = new[]
            {
                    request.ImgBackIdentity,
                    request.ImgCompany,
                    request.ImgFrontIdentity,
                    request.ImgBusinessLicense
                };

            var uploadTasks = files.Select(file =>
                file != null
                    ? _cloudinaryService.UploadImageAsync(file)
                    : Task.FromResult<string?>(null)
            ).ToList();

            var results = await Task.WhenAll(uploadTasks);
            organizer.ImgBackIdentity = results[0];
            organizer.ImgCompany = results[1];
            organizer.ImgFrontIdentity = results[2];
            organizer.ImgBusinessLicense = results[3];

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.OrganizerProfileRepository.AddAsync(organizer);
                return Result.Success();
            });
        }

        public async Task<Result<OrganizerDetailResponse>> GetOrganizerByIdAsync(Guid id)
        {
            if (id == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var organizers = await _unitOfWork.OrganizerProfileRepository
                .Query()
                .AsNoTracking()
                .ProjectTo<OrganizerDetailResponse>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync(o => o.OrganizerId == id);

            if (organizers == null)
                return ErrorResponse.FailureResult("Organizer not found.", ErrorCodes.NotFound);

            return Result<OrganizerDetailResponse>.Success(organizers);
        }

        public async Task<Result<BasePaginated<OrganizerResponse>>> GetOrganizerAsync(int pageNumber, int pageSize, bool? needApprove)
        {
            IQueryable<OrganizerProfile> query = _unitOfWork.OrganizerProfileRepository
                .Query()
                .AsNoTracking()
                .Where(p => !p.DeletedAt.HasValue);

            if(needApprove == true)
                query = query.Where(o => o.Status == ConfirmStatus.NeedConfirm);

            var totalCount = await query.CountAsync();

            var result = await query
                .OrderBy(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<OrganizerResponse>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new BasePaginated<OrganizerResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> ConfirmBecomeOrganizerAsync(Guid userId, Guid organizerProfileId, ConfirmRequest request)
        {
            if (userId == Guid.Empty || organizerProfileId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var profile = await _unitOfWork.OrganizerProfileRepository
                                            .Query()
                                            .Include(p => p.User)
                                            .FirstOrDefaultAsync(p => p.Id == organizerProfileId && !p.IsDeleted);

            if (profile == null)
                return ErrorResponse.FailureResult("Organizer profile not found", ErrorCodes.NotFound);

            if (profile.Status != ConfirmStatus.NeedConfirm)
                return ErrorResponse.FailureResult("Profile already confirmed", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                profile.Status = request.Status;
                profile.ConfirmAt = DateTime.UtcNow;
                profile.ConfirmBy = userId.ToString();
                await _unitOfWork.OrganizerProfileRepository.UpdateAsync(profile);

                if (request.Status == ConfirmStatus.Approve)
                {
                    var role = await _unitOfWork.RoleRepository
                                    .Query()
                                    .FirstOrDefaultAsync(r => r.Name == "Organizer");

                    if (role == null)
                        return ErrorResponse.FailureResult("Not found role", ErrorCodes.NotFound);
                    
                    var newOrganizerUser = new User
                    {
                        Email = profile.ContactEmail,
                        FullName = profile.ContactName,
                        Address = profile.Address,
                        RoleId = role.Id,
                        City = profile.Address,
                        IsActive = true,
                        LinkedUserId = profile.UserId,
                        PhoneNumber = profile.ContactPhone,
                        Wallet = new Wallet
                        {
                            Balance = 0
                        }
                    };
                    var plainPassword = GenerateSecureRandomPassword();
                    newOrganizerUser.PasswordHash = _hasherHelper.Hash(plainPassword);
                    await _unitOfWork.UserRepository.AddAsync(newOrganizerUser);

                    var sb = new StringBuilder()
                        .AppendLine($"<p>Xin chào {profile.ContactName},</p>")
                        .AppendLine($"<p>Hồ sơ đăng ký tổ chức của bạn <strong>{profile.CompanyName ?? profile.ContactName}</strong> đã được <b>chấp thuận</b>.</p>")
                        .AppendLine("<p>Thông tin đăng nhập của bạn:</p>")
                        .AppendLine("<ul>")
                        .AppendLine($"<li>Email: <b>{profile.ContactEmail}</b></li>")
                        .AppendLine($"<li>Mật khẩu: <b>{plainPassword}</b></li>")
                        .AppendLine("</ul>")
                        .AppendLine("<p>Vui lòng đăng nhập và <b>đổi mật khẩu ngay</b> sau khi truy cập để đảm bảo an toàn.</p>")
                        .AppendLine("<p>Trân trọng,<br/>Đội ngũ AIEvent</p>");

                    var msg = new MimeMessage
                    {
                        Subject = "Tài khoản tổ chức của bạn đã được chấp thuận",
                        Body = new TextPart("html") { Text = sb.ToString() }
                    };
                    var status = await _emailService.SendEmailAsync(profile.ContactEmail, msg);
                    if (!status.IsSuccess)
                        return ErrorResponse.FailureResult("Failed to send email", ErrorCodes.InternalServerError);
                }
                else
                {
                    if(string.IsNullOrEmpty(request.Reason))
                        return ErrorResponse.FailureResult("Need reason to reject application", ErrorCodes.InvalidInput);

                    var sb = new StringBuilder()
                        .AppendLine($"<p>Xin chào {profile.ContactName},</p>")
                        .AppendLine($"<p>Rất tiếc, hồ sơ đăng ký tổ chức của bạn <strong>{profile.CompanyName ?? profile.ContactName}</strong> đã <b>không được phê duyệt</b>.</p>")
                        .AppendLine($"<p><b>Lý do:</b> {request.Reason ?? "Không có lý do cụ thể."}</p>")
                        .AppendLine("<p>Nếu bạn cần thêm thông tin, vui lòng liên hệ đội ngũ hỗ trợ.</p>");


                    var msg = new MimeMessage
                    {
                        Subject = "Hồ sơ đăng ký tổ chức của bạn đã bị từ chối",
                        Body = new TextPart("html") { Text = sb.ToString() }
                    };

                    var emailResult = await _emailService.SendEmailAsync(profile.ContactEmail, msg);
                    if (!emailResult.IsSuccess)
                        return ErrorResponse.FailureResult("Failed to send rejection email", ErrorCodes.InternalServerError);
                }

                return Result.Success();
            });
        }

        private static string GenerateSecureRandomPassword(int length = 10)
        {
            const string validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
            var bytes = new byte[length];
            RandomNumberGenerator.Fill(bytes);

            return new string(bytes.Select(b => validChars[b % validChars.Length]).ToArray());
        }


        public async Task<Result<OrganizerDetailResponse>> GetOrganizerProfileAsync(Guid userId)
        {
            var userExists = await _unitOfWork.UserRepository.Query()
                .AsNoTracking()
                .AnyAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);
            if (!userExists)
                return ErrorResponse.FailureResult("User not found.", ErrorCodes.NotFound);

            var organizer = await _unitOfWork.OrganizerProfileRepository
                .Query()
                .AsNoTracking()
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.UserId == userId && !o.IsDeleted && o.Status == ConfirmStatus.Approve);

            if (organizer == null)
                return ErrorResponse.FailureResult("Organizer not found or not approved yet", ErrorCodes.NotFound);

            OrganizerDetailResponse response = _mapper.Map<OrganizerDetailResponse>(organizer);

            return Result<OrganizerDetailResponse>.Success(response);
        }


        public async Task<Result<object>> UpdateOrganizerProfileAsync(Guid userId, UpdateOrganizerProfileRequest request)
        {
            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var profile = await _unitOfWork.OrganizerProfileRepository
                .Query()
                .Include(o => o.User)
                .FirstOrDefaultAsync(x => x.UserId == userId && !x.IsDeleted && x.Status == ConfirmStatus.Approve);

            if (profile == null)
                return ErrorResponse.FailureResult("Organizer not found or not approved yet", ErrorCodes.NotFound);

            if (!profile.User.IsActive || profile.IsDeleted)
                return ErrorResponse.FailureResult("User not found.", ErrorCodes.NotFound);

            profile.ContactName = request.ContactName ?? profile.ContactName;
            profile.Address = request.Address ?? profile.Address;
            profile.Website = request.Website ?? profile.Website;
            profile.UrlFacebook = request.UrlFacebook ?? profile.UrlFacebook;
            profile.UrlInstagram = request.UrlInstagram ?? profile.UrlInstagram;
            profile.UrlLinkedIn = request.UrlLinkedIn ?? profile.UrlLinkedIn;
            profile.ExperienceDescription = request.ExperienceDescription ?? profile.ExperienceDescription;
            profile.CompanyDescription = request.CompanyDescription ?? profile.CompanyDescription;
            profile.OrganizationType = request.OrganizationType ?? profile.OrganizationType;
            profile.EventFrequency = request.EventFrequency ?? profile.EventFrequency;
            profile.EventSize = request.EventSize ?? profile.EventSize;
            profile.OrganizerType = request.OrganizerType ?? profile.OrganizerType;
            profile.EventExperienceLevel = request.EventExperienceLevel ?? profile.EventExperienceLevel;
            profile.ImgCompany = await _cloudinaryService.UploadImageAsync(request.ImgCompany!) ?? profile.ImgCompany;

            await _unitOfWork.OrganizerProfileRepository.UpdateAsync(profile);
            await _unitOfWork.SaveChangesAsync();

            OrganizerDetailResponse response = _mapper.Map<OrganizerDetailResponse>(profile);

            return Result<object>.Success(response);
        }

    }
}
