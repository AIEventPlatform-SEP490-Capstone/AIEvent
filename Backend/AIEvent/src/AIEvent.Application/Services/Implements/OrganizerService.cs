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

namespace AIEvent.Application.Services.Implements
{
    public class OrganizerService : IOrganizerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ITransactionHelper _transactionHelper;
        private readonly ICloudinaryService _cloudinaryService;

        public OrganizerService(IUnitOfWork unitOfWork, IMapper mapper, 
            ITransactionHelper transactionHelper, ICloudinaryService cloudinaryService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _transactionHelper = transactionHelper;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<Result> RegisterOrganizerAsync(Guid userId,RegisterOrganizerRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
                if (user == null || !user.IsActive)
                {
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
                }

                if (!string.IsNullOrEmpty(request.TaxCode))
                {
                    var exists = await _unitOfWork.OrganizerProfileRepository.Query()
                        .AnyAsync(t => t.TaxCode == request.TaxCode);

                    if (exists)
                    {
                        return ErrorResponse.FailureResult("Tax code already exists.", ErrorCodes.InvalidInput);
                    }
                }

                var organizer = _mapper.Map<OrganizerProfile>(request);
                if (organizer == null)
                {
                    return ErrorResponse.FailureResult("Failed to map organizer profile", ErrorCodes.InternalServerError);
                }

                var uploadTasks = new List<Task<string?>>();

                uploadTasks.Add(request.ImgBackIdentity != null
                    ? _cloudinaryService.UploadImageAsync(request.ImgBackIdentity)
                    : Task.FromResult<string?>(null));

                uploadTasks.Add(request.ImgCompany != null
                    ? _cloudinaryService.UploadImageAsync(request.ImgCompany)
                    : Task.FromResult<string?>(null));

                uploadTasks.Add(request.ImgFrontIdentity != null
                    ? _cloudinaryService.UploadImageAsync(request.ImgFrontIdentity)
                    : Task.FromResult<string?>(null));

                uploadTasks.Add(request.ImgBusinessLicense != null
                    ? _cloudinaryService.UploadImageAsync(request.ImgBusinessLicense)
                    : Task.FromResult<string?>(null));

                var results = await Task.WhenAll(uploadTasks);
                organizer.ImgBackIdentity = results[0];
                organizer.ImgCompany = results[1];
                organizer.ImgFrontIdentity = results[2];
                organizer.ImgBusinessLicense = results[3];

                organizer.UserId = userId;
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

        public async Task<Result> ConfirmBecomeOrganizerAsync(Guid userId, string id, ConfirmRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (!Guid.TryParse(id, out var organizerId))
                    return ErrorResponse.FailureResult("Invalid Guid format", ErrorCodes.InvalidInput);

                var organizer = await _unitOfWork.OrganizerProfileRepository
                    .Query()
                    .FirstOrDefaultAsync(o => o.Id == organizerId && !o.IsDeleted && o.Status == ConfirmStatus.NeedConfirm);

                if (organizer == null)
                    return ErrorResponse.FailureResult("Can not found Organizer profile", ErrorCodes.NotFound);

                var organizerUser = await _unitOfWork.UserRepository
                                                     .Query()
                                                     .Include(u => u.Role)
                                                     .FirstOrDefaultAsync(u => u.Id == organizer.UserId);
                if (organizerUser == null)
                    return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

                if (organizerUser.Role == null)
                    return ErrorResponse.FailureResult("Role not valid", ErrorCodes.NotFound);

                if (organizerUser.Role.Name.Contains("Organizer"))
                    return ErrorResponse.FailureResult("User is already an Organizer", ErrorCodes.InvalidInput);

                if (request.Status == ConfirmStatus.Approve)
                {
                    var organizerRoleId = await _unitOfWork.RoleRepository.Query().FirstOrDefaultAsync(r => r.Name.Equals("Organizer"));
                    if(organizerRoleId == null)
                    {
                        return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
                    }
                    organizerUser.RoleId = organizerRoleId.Id;
                }

                organizer.Status = request.Status;
                organizer.ConfirmAt = DateTime.UtcNow;
                organizer.ConfirmBy = userId.ToString();
                await _unitOfWork.UserRepository.UpdateAsync(organizerUser);
                await _unitOfWork.OrganizerProfileRepository.UpdateAsync(organizer);

                return Result.Success();
            });
        }

        public async Task<Result<OrganizerResponse>> GetOrganizerProfileAsync(Guid userId)
        {
            var userExists = await _unitOfWork.UserRepository.Query()
                .AsNoTracking()
                .AnyAsync(u => u.Id == userId && !u.IsDeleted);
            if (!userExists)
                return ErrorResponse.FailureResult("User not found.", ErrorCodes.NotFound);

            var organizer = await _unitOfWork.OrganizerProfileRepository
                .Query()
                .AsNoTracking()
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.UserId == userId && !o.IsDeleted && o.Status == ConfirmStatus.Approve);

            if (organizer == null)
                return ErrorResponse.FailureResult("Organizer not found or not approved yet", ErrorCodes.NotFound);

            OrganizerResponse response = _mapper.Map<OrganizerResponse>(organizer);

            return Result<OrganizerResponse>.Success(response);
        }

    }
}
