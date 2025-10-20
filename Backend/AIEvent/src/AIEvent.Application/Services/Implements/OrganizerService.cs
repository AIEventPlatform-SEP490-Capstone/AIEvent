using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using System.ComponentModel.DataAnnotations;
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
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (userId == Guid.Empty || request == null)
                    return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
                var context = new ValidationContext(request);
                var resultErrors = new List<ValidationResult>();
                bool isValid = Validator.TryValidateObject(request, context, resultErrors, true);
                if (!isValid)
                {
                    var messages = string.Join("; ", resultErrors.Select(r => r.ErrorMessage));
                    return ErrorResponse.FailureResult(messages, ErrorCodes.InvalidInput);
                }
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
                await _unitOfWork.OrganizerProfileRepository.AddAsync(organizer);
                return Result.Success();
            });
        }

        public async Task<Result<List<OrganizerResponse>>> GetOrganizerAsync(int page = 1, int pageSize = 10)
        {
            var organizers = await _unitOfWork.OrganizerProfileRepository
                .Query()
                .Include(o => o.User)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<OrganizerResponse>(_mapper.ConfigurationProvider)
                .ToListAsync();
            if (organizers == null)
                return ErrorResponse.FailureResult("Organizer code already exists.", ErrorCodes.InvalidInput);

            return Result<List<OrganizerResponse>>.Success(organizers);
        }

        public async Task<Result<OrganizerResponse>> GetOrganizerByIdAsync(string id)
        {
            var organizers = await _unitOfWork.OrganizerProfileRepository
                .Query()
                .AsNoTracking()
                .Include(o => o.User)
                .ProjectTo<OrganizerResponse>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync(o => o.OrganizerId == Guid.Parse(id));
            if (organizers == null)
                return ErrorResponse.FailureResult("Organizer code already exists.", ErrorCodes.InvalidInput);

            return Result<OrganizerResponse>.Success(organizers);
        }

        public async Task<Result<OrganizerResponse>> GetOrgNeedApproveByIdAsync(string id)
        {
            if (!Guid.TryParse(id, out var organizerId))
            {
                return ErrorResponse.FailureResult("Invalid Guid format", ErrorCodes.InvalidInput);
            }

            var organizer = await _unitOfWork.OrganizerProfileRepository
                .Query()
                .AsNoTracking()
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == organizerId && !o.IsDeleted && o.Status == ConfirmStatus.NeedConfirm);

            if (organizer == null)
            {
                return ErrorResponse.FailureResult("Organizer can not found or is deleted", ErrorCodes.InvalidInput);
            }
                
            OrganizerResponse organizerResponse = _mapper.Map<OrganizerResponse>(organizer);

            return Result<OrganizerResponse>.Success(organizerResponse);
        }

        public async Task<Result<BasePaginated<ListOrganizerNeedApprove>>> GetListOrganizerNeedApprove(int pageNumber, int pageSize)
        {
            IQueryable<OrganizerProfile> query = _unitOfWork.OrganizerProfileRepository
                .Query()
                .AsNoTracking()
                .Where(p => !p.DeletedAt.HasValue && p.Status == ConfirmStatus.NeedConfirm); ;

            var totalCount = await query.CountAsync();

            var result = await query
                .OrderBy(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ListOrganizerNeedApprove
                {
                    Id = p.Id.ToString(),
                    OrganizationType = p.OrganizationType,
                    CompanyName = p.CompanyName,
                    ContactEmail = p.ContactEmail,
                    ContactPhone = p.ContactPhone,
                    Address = p.Address,
                    ImgCompany = p.ImgCompany,
                })
                .ToListAsync();

            return new BasePaginated<ListOrganizerNeedApprove>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> ConfirmBecomeOrganizerAsync(Guid userId, Guid organizerProfileId, ConfirmRequest request, string? reason)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
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
                    if(string.IsNullOrEmpty(reason))
                        return ErrorResponse.FailureResult("Need reason to reject application", ErrorCodes.InvalidInput);

                    var sb = new StringBuilder()
                        .AppendLine($"<p>Xin chào {profile.ContactName},</p>")
                        .AppendLine($"<p>Rất tiếc, hồ sơ đăng ký tổ chức của bạn <strong>{profile.CompanyName ?? profile.ContactName}</strong> đã <b>không được phê duyệt</b>.</p>")
                        .AppendLine($"<p><b>Lý do:</b> {reason ?? "Không có lý do cụ thể."}</p>")
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
    }
}
