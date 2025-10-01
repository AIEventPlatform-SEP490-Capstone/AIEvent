using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class OrganizerService : IOrganizerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;
        private readonly ITransactionHelper _transactionHelper;
        private readonly ICloudinaryService _cloudinaryService;
        public OrganizerService(IUnitOfWork unitOfWork, UserManager<AppUser> userManager, IMapper mapper, ITransactionHelper transactionHelper, ICloudinaryService cloudinaryService)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _mapper = mapper;
            _transactionHelper = transactionHelper;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<Result> RegisterOrganizerAsync(Guid userId,RegisterOrganizerRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
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

        //public async Task<Result<List<OrganizerResponse>>> GetOrganizerAsync(int page = 1, int pageSize = 10)
        //{
        //    var organizers = await _unitOfWork.OrganizerProfileRepository
        //        .Query()
        //        .Include(o => o.OrganizerFieldAssignments)
        //            .ThenInclude(ofa => ofa.EventField)
        //        .Include(o => o.User)
        //        .ProjectTo<OrganizerResponse>(_mapper.ConfigurationProvider)
        //        .Skip((page - 1) * pageSize)
        //        .Take(pageSize)
        //        .ToListAsync();
        //    if(organizers == null)
        //        return ErrorResponse.FailureResult("Organizer code already exists.", ErrorCodes.InvalidInput);

        //    return Result<List<OrganizerResponse>>.Success(organizers);
        //}

        //public async Task<Result<OrganizerResponse>> GetOrganizerByIdAsync(string id)
        //{
        //    var organizers = await _unitOfWork.OrganizerProfileRepository
        //        .Query()
        //        .AsNoTracking()
        //        .Include(o => o.OrganizerFieldAssignments)
        //            .ThenInclude(ofa => ofa.EventField)
        //        .Include(o => o.User)
        //        .ProjectTo<OrganizerResponse>(_mapper.ConfigurationProvider)
        //        .FirstOrDefaultAsync(o => o.OrganizerId == Guid.Parse(id));
        //    if (organizers == null)
        //        return ErrorResponse.FailureResult("Organizer code already exists.", ErrorCodes.InvalidInput);

        //    return Result<OrganizerResponse>.Success(organizers);
        //}
    }
}
