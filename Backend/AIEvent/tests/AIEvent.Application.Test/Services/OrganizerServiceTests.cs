using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class OrganizerServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly IOrganizerService _organizerService;

        private static readonly Guid testId = Guid.Parse("a3f4a95e-27fb-4d32-b2c1-1f4a5c6e8d9b");

        public OrganizerServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();
            _mockMapper = new Mock<IMapper>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            var store = new Mock<IUserStore<AppUser>>();
            _mockUserManager = new Mock<UserManager<AppUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!
            );
            _organizerService = new OrganizerService(_mockUnitOfWork.Object,
                                                    _mockUserManager.Object,
                                                    _mockMapper.Object,
                                                    _mockTransactionHelper.Object,
                                                    _mockCloudinaryService.Object);
        }
        #region RegisterOrganizer

        [Fact]
        public async Task RegisterOrganizerAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new RegisterOrganizerRequest
            {
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "John Doe",
                ContactEmail = "john.doe@company.com",
                ContactPhone = "+84901234567",
                Address = "123 Business Street, District 1, Ho Chi Minh City",
                Website = "https://www.company.com",
                UrlFacebook = "https://facebook.com/company",
                UrlInstagram = "https://instagram.com/company",
                UrlLinkedIn = "https://linkedin.com/company/company",
                ExperienceDescription = "5 years of experience organizing corporate events and conferences",
                IdentityNumber = "123456789012",
                CompanyName = "ABC Event Company Ltd",
                TaxCode = "0123456789",
                CompanyDescription = "Professional event management company specializing in corporate events"
            };

            var user = new AppUser
            {
                Id = userId,
                Email = "user@example.com",
                UserName = "user@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var organizer = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
                Website = "https://www.govedu.vn",
                UrlFacebook = "https://facebook.com/govedu",
                UrlInstagram = "https://instagram.com/govedu",
                UrlLinkedIn = "https://linkedin.com/company/govedu",
                ExperienceDescription = "Recently started organizing educational workshops and government seminars.",
                IdentityNumber = "456789123456",
                CompanyName = "GovEdu Training Center",
                TaxCode = "5647382910",
                CompanyDescription = "Government-affiliated education and training center focusing on youth development programs.",
                User = new AppUser
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    UserName = "tranthi.b",
                    Email = "tranthi.b@govedu.vn",
                    PhoneNumber = "+84987654321"
                }
            };

            var mappedOrganizer = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = request.OrganizationType,
                OrganizerType = request.OrganizerType,
                EventFrequency = request.EventFrequency,
                EventSize = request.EventSize,
                EventExperienceLevel = request.EventExperienceLevel,
                ContactName = request.ContactName,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Address = request.Address,
                Website = request.Website,
                UrlFacebook = request.UrlFacebook,
                UrlInstagram = request.UrlInstagram,
                UrlLinkedIn = request.UrlLinkedIn,
                ExperienceDescription = request.ExperienceDescription,
                IdentityNumber = request.IdentityNumber,
                CompanyName = request.CompanyName,
                TaxCode = request.TaxCode,
                CompanyDescription = request.CompanyDescription,
                User = user
            };

            var emptyOrganizerList = new List<OrganizerProfile>{ organizer }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(false)).Returns(emptyOrganizerList.Object);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUserManager.Setup(x => x.FindByIdAsync(userId.ToString())).ReturnsAsync(user);

            _mockMapper.Setup(x => x.Map<OrganizerProfile>(request)).Returns(mappedOrganizer);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.AddAsync(mappedOrganizer));

            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task RegisterOrganizerAsync_WhenUserInactive_ShouldReturnUnauthorized()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new RegisterOrganizerRequest
            {
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "John Doe",
                ContactEmail = "john.doe@company.com",
                ContactPhone = "+84901234567",
                Address = "123 Business Street, District 1, Ho Chi Minh City",
                Website = "https://www.company.com",
                UrlFacebook = "https://facebook.com/company",
                UrlInstagram = "https://instagram.com/company",
                UrlLinkedIn = "https://linkedin.com/company/company",
                ExperienceDescription = "5 years of experience organizing corporate events and conferences",
                IdentityNumber = "123456789012",
                CompanyName = "ABC Event Company Ltd",
                TaxCode = "0123456789",
                CompanyDescription = "Professional event management company specializing in corporate events"
            };

            var user = new AppUser
            {
                Id = userId,
                Email = "user@example.com",
                UserName = "user@example.com",
                FullName = "Test User",
                IsActive = false
            };

            var organizer = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
                Website = "https://www.govedu.vn",
                UrlFacebook = "https://facebook.com/govedu",
                UrlInstagram = "https://instagram.com/govedu",
                UrlLinkedIn = "https://linkedin.com/company/govedu",
                ExperienceDescription = "Recently started organizing educational workshops and government seminars.",
                IdentityNumber = "456789123456",
                CompanyName = "GovEdu Training Center",
                TaxCode = "5647382910",
                CompanyDescription = "Government-affiliated education and training center focusing on youth development programs.",
                User = new AppUser
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    UserName = "tranthi.b",
                    Email = "tranthi.b@govedu.vn",
                    PhoneNumber = "+84987654321"
                }
            };

            var mappedOrganizer = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = request.OrganizationType,
                OrganizerType = request.OrganizerType,
                EventFrequency = request.EventFrequency,
                EventSize = request.EventSize,
                EventExperienceLevel = request.EventExperienceLevel,
                ContactName = request.ContactName,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Address = request.Address,
                Website = request.Website,
                UrlFacebook = request.UrlFacebook,
                UrlInstagram = request.UrlInstagram,
                UrlLinkedIn = request.UrlLinkedIn,
                ExperienceDescription = request.ExperienceDescription,
                IdentityNumber = request.IdentityNumber,
                CompanyName = request.CompanyName,
                TaxCode = request.TaxCode,
                CompanyDescription = request.CompanyDescription,
                User = user
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUserManager.Setup(x => x.FindByIdAsync(userId.ToString())).ReturnsAsync(user);

            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task RegisterOrganizerAsync_WhenTaxCodeAlreadyExists_ShouldReturnInvalidInput()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new RegisterOrganizerRequest
            {
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "John Doe",
                ContactEmail = "john.doe@company.com",
                ContactPhone = "+84901234567",
                Address = "123 Business Street, District 1, Ho Chi Minh City",
                Website = "https://www.company.com",
                UrlFacebook = "https://facebook.com/company",
                UrlInstagram = "https://instagram.com/company",
                UrlLinkedIn = "https://linkedin.com/company/company",
                ExperienceDescription = "5 years of experience organizing corporate events and conferences",
                IdentityNumber = "123456789012",
                CompanyName = "ABC Event Company Ltd",
                TaxCode = "0123456789",
                CompanyDescription = "Professional event management company specializing in corporate events"
            };

            var user = new AppUser
            {
                Id = userId,
                Email = "user@example.com",
                UserName = "user@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var organizer = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
                Website = "https://www.govedu.vn",
                UrlFacebook = "https://facebook.com/govedu",
                UrlInstagram = "https://instagram.com/govedu",
                UrlLinkedIn = "https://linkedin.com/company/govedu",
                ExperienceDescription = "Recently started organizing educational workshops and government seminars.",
                IdentityNumber = "456789123456",
                CompanyName = "GovEdu Training Center",
                TaxCode = "0123456789",
                CompanyDescription = "Government-affiliated education and training center focusing on youth development programs.",
                User = new AppUser
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    UserName = "tranthi.b",
                    Email = "tranthi.b@govedu.vn",
                    PhoneNumber = "+84987654321"
                }
            };

            var mappedOrganizer = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = request.OrganizationType,
                OrganizerType = request.OrganizerType,
                EventFrequency = request.EventFrequency,
                EventSize = request.EventSize,
                EventExperienceLevel = request.EventExperienceLevel,
                ContactName = request.ContactName,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Address = request.Address,
                Website = request.Website,
                UrlFacebook = request.UrlFacebook,
                UrlInstagram = request.UrlInstagram,
                UrlLinkedIn = request.UrlLinkedIn,
                ExperienceDescription = request.ExperienceDescription,
                IdentityNumber = request.IdentityNumber,
                CompanyName = request.CompanyName,
                TaxCode = request.TaxCode,
                CompanyDescription = request.CompanyDescription,
                User = user
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUserManager.Setup(x => x.FindByIdAsync(userId.ToString())).ReturnsAsync(user);

            var emptyOrganizerList = new List<OrganizerProfile> { organizer }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(false)).Returns(emptyOrganizerList.Object);


            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Tax code already exists.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task RegisterOrganizerAsync_WhenMapperReturnsNull_ShouldReturnInternalServerError()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new RegisterOrganizerRequest
            {
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "John Doe",
                ContactEmail = "john.doe@company.com",
                ContactPhone = "+84901234567",
                Address = "123 Business Street, District 1, Ho Chi Minh City",
                Website = "https://www.company.com",
                UrlFacebook = "https://facebook.com/company",
                UrlInstagram = "https://instagram.com/company",
                UrlLinkedIn = "https://linkedin.com/company/company",
                ExperienceDescription = "5 years of experience organizing corporate events and conferences",
                IdentityNumber = "123456789012",
                CompanyName = "ABC Event Company Ltd",
                TaxCode = "0123456789",
                CompanyDescription = "Professional event management company specializing in corporate events"
            };

            var user = new AppUser
            {
                Id = userId,
                Email = "user@example.com",
                UserName = "user@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var organizer = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
                Website = "https://www.govedu.vn",
                UrlFacebook = "https://facebook.com/govedu",
                UrlInstagram = "https://instagram.com/govedu",
                UrlLinkedIn = "https://linkedin.com/company/govedu",
                ExperienceDescription = "Recently started organizing educational workshops and government seminars.",
                IdentityNumber = "456789123456",
                CompanyName = "GovEdu Training Center",
                TaxCode = "5647382910",
                CompanyDescription = "Government-affiliated education and training center focusing on youth development programs.",
                User = new AppUser
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    UserName = "tranthi.b",
                    Email = "tranthi.b@govedu.vn",
                    PhoneNumber = "+84987654321"
                }
            };

            var emptyOrganizerList = new List<OrganizerProfile> { organizer }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(false)).Returns(emptyOrganizerList.Object);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());
            _mockUserManager.Setup(x => x.FindByIdAsync(userId.ToString())).ReturnsAsync(user);

            _mockMapper.Setup(x => x.Map<OrganizerProfile>(request));

            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to map organizer profile");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
        }
        #endregion


        //--------------------------ConfirmBecomeOrganizerAsync------------------------------------
        [Fact]
        public async Task ConfirmBecomeOrganizerAsync_InvalidGuid_ReturnsFailure()
        {
            _mockTransactionHelper
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(fn => fn());

            var result = await _organizerService.ConfirmBecomeOrganizerAsync(Guid.NewGuid(), "not-a-guid", new ConfirmRequest());

            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid Guid format");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }


        [Fact]
        public async Task ConfirmBecomeOrganizerAsync_UserNotFound_ReturnsFailure()
        {
            var organizer = new OrganizerProfile
            {
                Id = testId,
                UserId = Guid.NewGuid(),
                Status = OrganizerStatus.NeedConfirm,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
            };

            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(new List<OrganizerProfile> { organizer }.AsQueryable().BuildMockDbSet().Object);

            _mockUserManager.Setup(u => u.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((AppUser)null!);

            _mockTransactionHelper
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(fn => fn());

            var result = await _organizerService.ConfirmBecomeOrganizerAsync(Guid.NewGuid(), organizer.Id.ToString(), new ConfirmRequest { Status = OrganizerStatus.Approve });

            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }


        [Fact]
        public async Task ConfirmBecomeOrganizerAsync_UserDoesNotHaveOrganizerRole_AddRoleSucceeds_ReturnsSuccess()
        {
            var organizer = new OrganizerProfile
            {
                Id = testId,
                UserId = Guid.NewGuid(),
                Status = OrganizerStatus.NeedConfirm,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
            };
            var user = new AppUser { Id = organizer.UserId };

            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(new List<OrganizerProfile> { organizer }.AsQueryable().BuildMockDbSet().Object);
            _mockUserManager.Setup(u => u.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);
            _mockUserManager.Setup(u => u.GetRolesAsync(user)).ReturnsAsync(new List<string>());
            _mockUserManager.Setup(u => u.RemoveFromRolesAsync(user, It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(u => u.AddToRoleAsync(user, "Organizer"))
                .ReturnsAsync(IdentityResult.Success);
            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.UpdateAsync(organizer))
                .ReturnsAsync(organizer);


            _mockTransactionHelper
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(fn => fn());

            var result = await _organizerService.ConfirmBecomeOrganizerAsync(Guid.NewGuid(), organizer.Id.ToString(), new ConfirmRequest { Status = OrganizerStatus.Approve });

            result.IsSuccess.Should().BeTrue();
            organizer.Status.Should().Be(OrganizerStatus.Approve);
            organizer.ConfirmAt.Should().NotBeNull();
            organizer.ConfirmBy.Should().NotBeNull();
        }

        [Fact]
        public async Task ConfirmBecomeOrganizerAsync_UserAlreadyHasOrganizerRole_ReturnsFailure()
        {
            var organizer = new OrganizerProfile
            {
                Id = testId,
                UserId = Guid.NewGuid(),
                Status = OrganizerStatus.NeedConfirm,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
            };
            var user = new AppUser { Id = organizer.UserId };

            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(new List<OrganizerProfile> { organizer }.AsQueryable().BuildMockDbSet().Object);
            _mockUserManager.Setup(u => u.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);
            _mockUserManager.Setup(u => u.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Organizer" });
            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.UpdateAsync(organizer))
                .ReturnsAsync(organizer);

            _mockTransactionHelper
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(fn => fn());

            var result = await _organizerService.ConfirmBecomeOrganizerAsync(Guid.NewGuid(), organizer.Id.ToString(), new ConfirmRequest { Status = OrganizerStatus.Approve });

            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User is already an Organizer");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task ConfirmBecomeOrganizerAsync_ProfileAlreadyConfirmed_ReturnsFailure()
        {
            var organizer = new OrganizerProfile
            {
                Id = testId,
                UserId = Guid.NewGuid(),
                Status = OrganizerStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
            };

            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(new List<OrganizerProfile> { organizer }.AsQueryable().BuildMockDbSet().Object);

            _mockTransactionHelper
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(fn => fn());

            var result = await _organizerService
                .ConfirmBecomeOrganizerAsync(Guid.NewGuid(), organizer.Id.ToString(), new ConfirmRequest { Status = OrganizerStatus.Approve });

            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found Organizer profile");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task ConfirmBecomeOrganizerAsync_ProfileDeleted_ReturnsFailure()
        {
            var organizer = new OrganizerProfile
            {
                Id = testId,
                UserId = Guid.NewGuid(),
                Status = OrganizerStatus.NeedConfirm,
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Weekly,
                EventSize = EventSize.Small,
                EventExperienceLevel = EventExperienceLevel.Beginner,
                ContactName = "Tran Thi B",
                ContactEmail = "tranthi.b@govedu.vn",
                ContactPhone = "+84987654321",
                Address = "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City",
                IsDeleted = true,
            };

            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(new List<OrganizerProfile> { organizer }.AsQueryable().BuildMockDbSet().Object);

            _mockTransactionHelper
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(fn => fn());

            var result = await _organizerService
                .ConfirmBecomeOrganizerAsync(Guid.NewGuid(), organizer.Id.ToString(), new ConfirmRequest { Status = OrganizerStatus.Approve });

            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found Organizer profile");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

    }
}
