using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MimeKit;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class OrganizerServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly IOrganizerService _organizerService;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IHasherHelper> _mockHasherHelper;

        private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid OrganizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        public OrganizerServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();
            _mockMapper = new Mock<IMapper>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockEmailService = new Mock<IEmailService>();
            _mockHasherHelper = new Mock<IHasherHelper>();

            _organizerService = new OrganizerService(_mockUnitOfWork.Object,
                                                    _mockMapper.Object,
                                                    _mockTransactionHelper.Object,
                                                    _mockCloudinaryService.Object,
                                                    _mockEmailService.Object,
                                                    _mockHasherHelper.Object);
        }

        #region RegisterOrganizer

        // UTCID01: Valid request with all required fields, successful registration
        [Fact]
        public async Task UTCID01_RegisterOrganizerAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
        }

        // UTCID02: Empty userId (Guid.Empty)
        [Fact]
        public async Task UTCID02_RegisterOrganizerAsync_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var request = CreateValidRegisterOrganizerRequest();

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID03: Null request
        [Fact]
        public async Task UTCID03_RegisterOrganizerAsync_WithNullRequest_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            RegisterOrganizerRequest? request = null;

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID04: Request with validation errors - empty ContactName
        [Fact]
        public async Task UTCID04_RegisterOrganizerAsync_WithEmptyContactName_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ContactName = "";

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Contact name is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID05: Request with validation errors - empty ContactEmail
        [Fact]
        public async Task UTCID05_RegisterOrganizerAsync_WithEmptyContactEmail_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ContactEmail = "";

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Contact email is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID06: Request with validation errors - empty ContactPhone
        [Fact]
        public async Task UTCID06_RegisterOrganizerAsync_WithEmptyContactPhone_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ContactPhone = "";

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Contact phone is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID07: User not found
        [Fact]
        public async Task UTCID07_RegisterOrganizerAsync_WithUserNotFound_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                .ReturnsAsync((User)null!);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID08: Inactive user
        [Fact]
        public async Task UTCID08_RegisterOrganizerAsync_WithInactiveUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            var user = CreateInactiveUser(userId);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                .ReturnsAsync(user);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID09: Tax code already exists
        [Fact]
        public async Task UTCID09_RegisterOrganizerAsync_WithExistingTaxCode_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            var user = CreateActiveUser(userId);
            var existingOrganizer = CreateOrganizerWithTaxCode(request.TaxCode!);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                .ReturnsAsync(user);

            var organizerList = new List<OrganizerProfile> { existingOrganizer }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(false))
                .Returns(organizerList.Object);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Tax code already exists.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID10: Tax code is null (should skip validation)
        [Fact]
        public async Task UTCID10_RegisterOrganizerAsync_WithNullTaxCode_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.TaxCode = null;
            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
        }

        [Fact]
        public async Task UTCID11_RegisterOrganizerAsync_WithAllFiles_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ImgCompany = CreateMockFormFile();
            request.ImgFrontIdentity = CreateMockFormFile();
            request.ImgBackIdentity = CreateMockFormFile();
            request.ImgBusinessLicense = CreateMockFormFile();

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);
            SetupCloudinaryMocks("url1", "url2", "url3", "url4");

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
            VerifyCloudinaryUploads(4);
        }

        [Fact]
        public async Task UTCID12_RegisterOrganizerAsync_WithSomeFiles_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ImgCompany = CreateMockFormFile();
            request.ImgFrontIdentity = null;
            request.ImgBackIdentity = CreateMockFormFile();
            request.ImgBusinessLicense = null;

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);
            SetupCloudinaryMocks("url1", null, "url3", null);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
            VerifyCloudinaryUploads(2);
        }

        [Fact]
        public async Task UTCID13_RegisterOrganizerAsync_WithNoFiles_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ImgCompany = null;
            request.ImgFrontIdentity = null;
            request.ImgBackIdentity = null;
            request.ImgBusinessLicense = null;

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);
            SetupCloudinaryMocks(null, null, null, null);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
            VerifyCloudinaryUploads(0);
        }

        [Theory]
        [InlineData(OrganizationType.PrivateCompany)]
        [InlineData(OrganizationType.StateEnterprise)]
        [InlineData(OrganizationType.NonProfit)]
        [InlineData(OrganizationType.IndividualBusiness)]
        [InlineData(OrganizationType.Startup)]
        [InlineData(OrganizationType.CommunityClub)]
        [InlineData(OrganizationType.SchoolUniversity)]
        [InlineData(OrganizationType.Other)]
        public async Task UTCID14_RegisterOrganizerAsync_WithDifferentOrganizationTypes_ShouldReturnSuccess(OrganizationType organizationType)
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.OrganizationType = organizationType;

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
        }

        [Theory]
        [InlineData(EventFrequency.Weekly)]
        [InlineData(EventFrequency.Monthly)]
        [InlineData(EventFrequency.Quarterly)]
        [InlineData(EventFrequency.Yearly)]
        [InlineData(EventFrequency.Occasionally)]
        public async Task UTCID15_RegisterOrganizerAsync_WithDifferentEventFrequencies_ShouldReturnSuccess(EventFrequency eventFrequency)
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.EventFrequency = eventFrequency;

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
        }

        [Theory]
        [InlineData(EventSize.Small)]
        [InlineData(EventSize.Medium)]
        [InlineData(EventSize.Large)]
        [InlineData(EventSize.ExtraLarge)]
        public async Task UTCID16_RegisterOrganizerAsync_WithDifferentEventSizes_ShouldReturnSuccess(EventSize eventSize)
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.EventSize = eventSize;

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
        }

        [Theory]
        [InlineData(OrganizerType.Individual)]
        [InlineData(OrganizerType.Business)]
        public async Task UTCID17_RegisterOrganizerAsync_WithDifferentOrganizerTypes_ShouldReturnSuccess(OrganizerType organizerType)
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.OrganizerType = organizerType;

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
        }
        
        [Theory]
        [InlineData(EventExperienceLevel.Beginner)]
        [InlineData(EventExperienceLevel.Intermediate)]
        [InlineData(EventExperienceLevel.Experienced)]
        [InlineData(EventExperienceLevel.Expert)]
        public async Task UTCID18_RegisterOrganizerAsync_WithDifferentEventExperienceLevels_ShouldReturnSuccess(EventExperienceLevel eventExperienceLevel)
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.EventExperienceLevel = eventExperienceLevel;

            var user = CreateActiveUser(userId);
            var mappedOrganizer = CreateMappedOrganizer(userId, request);

            SetupSuccessfulMocks(user, mappedOrganizer);

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            VerifySuccessfulRegistration(mappedOrganizer);
        }

        [Fact]
        public async Task UTCID19_RegisterOrganizerAsync_WithEmptyContactEmail_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ContactEmail = "invalid-email";

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email format");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID06: Request with validation errors - empty ContactPhone
        [Fact]
        public async Task UTCID20_RegisterOrganizerAsync_WithEmptyContactPhone_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = CreateValidRegisterOrganizerRequest();
            request.ContactPhone = "invalid-phone";

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid phone number format");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // Helper methods
        private RegisterOrganizerRequest CreateValidRegisterOrganizerRequest()
        {
            return new RegisterOrganizerRequest
            {
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Business,
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
        }

        private User CreateActiveUser(Guid userId)
        {
            return new User
            {
                Id = userId,
                Email = "user@example.com",
                FullName = "Test User",
                IsActive = true
            };
        }

        private User CreateInactiveUser(Guid userId)
        {
            return new User
            {
                Id = userId,
                Email = "user@example.com",
                FullName = "Test User",
                IsActive = false
            };
        }

        private OrganizerProfile CreateMappedOrganizer(Guid userId, RegisterOrganizerRequest request)
        {
            return new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrganizationType = request.OrganizationType,
                EventFrequency = request.EventFrequency,
                EventSize = request.EventSize,
                OrganizerType = request.OrganizerType,
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
                CompanyDescription = request.CompanyDescription
            };
        }

        private OrganizerProfile CreateOrganizerWithTaxCode(string taxCode)
        {
            return new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                TaxCode = taxCode,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Business,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Existing User",
                ContactEmail = "existing@company.com",
                ContactPhone = "+84901234567",
                Address = "123 Business Street"
            };
        }

        private Microsoft.AspNetCore.Http.IFormFile CreateMockFormFile()
        {
            var mockFile = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
            mockFile.Setup(f => f.Length).Returns(1024);
            mockFile.Setup(f => f.FileName).Returns("test.jpg");
            mockFile.Setup(f => f.ContentType).Returns("image/jpeg");
            return mockFile.Object;
        }

        private void SetupSuccessfulMocks(User user, OrganizerProfile mappedOrganizer)
        {
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true))
                .ReturnsAsync(user);

            var emptyOrganizerList = new List<OrganizerProfile>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(false))
                .Returns(emptyOrganizerList.Object);

            _mockMapper.Setup(x => x.Map<OrganizerProfile>(It.IsAny<RegisterOrganizerRequest>()))
                .Returns(mappedOrganizer);

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.AddAsync(It.IsAny<OrganizerProfile>()));
        }

        private void SetupCloudinaryMocks(string? url1, string? url2, string? url3, string? url4)
        {
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile>()))
                .ReturnsAsync(url1);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile>()))
                .ReturnsAsync(url2);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile>()))
                .ReturnsAsync(url3);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile>()))
                .ReturnsAsync(url4);
        }

        private void VerifySuccessfulRegistration(OrganizerProfile mappedOrganizer)
        {
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(mappedOrganizer.UserId, true), Times.Once());
            _mockMapper.Verify(x => x.Map<OrganizerProfile>(It.IsAny<RegisterOrganizerRequest>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.AddAsync(It.IsAny<OrganizerProfile>()), Times.Once());
        }

        private void VerifyCloudinaryUploads(int expectedCount)
        {
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(It.IsAny<Microsoft.AspNetCore.Http.IFormFile>()),
                Times.Exactly(expectedCount));
        }
        #endregion

        #region ConfirmBecomeOrganizer

        [Fact]
        public async Task UTCID01_ConfirmBecomeOrganizerAsync_WithEmptyIds_ShouldReturnFailure()
        {
            // Arrange
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(Guid.Empty, Guid.Empty, new ConfirmRequest { Status = ConfirmStatus.Approve, Reason = null });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID02_ConfirmBecomeOrganizerAsync_ProfileNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profileId, new ConfirmRequest { Status = ConfirmStatus.Approve ,Reason = null});

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer profile not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID03_ConfirmBecomeOrganizerAsync_ProfileAlreadyConfirmed_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();
            profile.Status = ConfirmStatus.Approve; // already confirmed

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, new ConfirmRequest { Status = ConfirmStatus.Approve, Reason = null });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Profile already confirmed");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID04_ConfirmBecomeOrganizerAsync_Approve_Success_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();
            var role = new Role { Id = Guid.NewGuid(), Name = "Organizer" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()));

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { role }.AsQueryable().BuildMockDbSet().Object);

            _mockHasherHelper.Setup(x => x.Hash(It.IsAny<string>(), It.IsAny<int>()))
                .Returns("hashedPassword");
            _mockUnitOfWork.Setup(x => x.UserRepository.AddAsync(It.IsAny<User>()));

            _mockEmailService.Setup(x => x.SendEmailAsync(profile.ContactEmail!, It.IsAny<MimeMessage>()))
                .ReturnsAsync(Result.Success());

            var request = new ConfirmRequest { Status = ConfirmStatus.Approve , Reason = null };

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.UpdateAsync(It.Is<OrganizerProfile>(p => p.Id == profile.Id && p.Status == ConfirmStatus.Approve && p.ConfirmBy == userId.ToString())), Times.Once());
            _mockUnitOfWork.Verify(x => x.RoleRepository.Query(It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Hash(It.IsAny<string>(), It.IsAny<int>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.UserRepository.AddAsync(It.Is<User>(u => u.Email == profile.ContactEmail && u.LinkedUserId == profile.UserId && u.RoleId == role.Id)), Times.Once());
            _mockEmailService.Verify(x => x.SendEmailAsync(profile.ContactEmail!, It.IsAny<MimeMessage>()), Times.Once());
        }

        [Fact]
        public async Task UTCID05_ConfirmBecomeOrganizerAsync_Approve_RoleNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()));

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role>().AsQueryable().BuildMockDbSet().Object);

            var request = new ConfirmRequest { Status = ConfirmStatus.Approve , Reason = null };

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found role");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID06_ConfirmBecomeOrganizerAsync_Approve_SendEmailFailed_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();
            var role = new Role { Id = Guid.NewGuid(), Name = "Organizer" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()));

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { role }.AsQueryable().BuildMockDbSet().Object);

            _mockHasherHelper.Setup(x => x.Hash(It.IsAny<string>(), It.IsAny<int>()))
                .Returns("hashedPassword");
            _mockUnitOfWork.Setup(x => x.UserRepository.AddAsync(It.IsAny<User>()));

            _mockEmailService.Setup(x => x.SendEmailAsync(profile.ContactEmail!, It.IsAny<MimeMessage>()))
                .ReturnsAsync(ErrorResponse.FailureResult("Email send failed", ErrorCodes.InternalServerError));

            var request = new ConfirmRequest { Status = ConfirmStatus.Approve, Reason = null };

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to send email");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
        }

        [Fact]
        public async Task UTCID07_ConfirmBecomeOrganizerAsync_Reject_WithoutReason_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()));
             
            var request = new ConfirmRequest { Status = ConfirmStatus.Reject ,Reason = null };

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Need reason to reject application");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID08_ConfirmBecomeOrganizerAsync_Reject_SendEmailFailed_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()));

            _mockEmailService.Setup(x => x.SendEmailAsync(profile.ContactEmail!, It.IsAny<MimeMessage>()))
                .ReturnsAsync(ErrorResponse.FailureResult("Email send failed", ErrorCodes.InternalServerError));

            var request = new ConfirmRequest { Status = ConfirmStatus.Reject , Reason = "Missing documents" };

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to send rejection email");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
        }

        [Fact]
        public async Task UTCID09_ConfirmBecomeOrganizerAsync_Reject_Success_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()));

            _mockEmailService.Setup(x => x.SendEmailAsync(profile.ContactEmail!, It.IsAny<MimeMessage>()))
                .ReturnsAsync(Result.Success());

            var request = new ConfirmRequest { Status = ConfirmStatus.Reject, Reason = "Thông tin không hợp lệ" };

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.UpdateAsync(It.Is<OrganizerProfile>(p => p.Id == profile.Id && p.Status == ConfirmStatus.Reject && p.ConfirmBy == userId.ToString())), Times.Once());
            _mockEmailService.Verify(x => x.SendEmailAsync(profile.ContactEmail!, It.IsAny<MimeMessage>()), Times.Once());
        }

        [Fact]
        public async Task UTCID10_ConfirmBecomeOrganizerAsync_WithEmptyUserIdOnly_ShouldReturnFailure()
        {
            // Arrange
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(Guid.Empty, Guid.NewGuid(), new ConfirmRequest { Status = ConfirmStatus.Approve, Reason = null });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID11_ConfirmBecomeOrganizerAsync_WithEmptyOrganizerProfileIdOnly_ShouldReturnFailure()
        {
            // Arrange
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(Guid.Empty, Guid.NewGuid(), new ConfirmRequest { Status = ConfirmStatus.Approve, Reason = null });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID12_ConfirmBecomeOrganizerAsync_WithDeletedProfile_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();
            profile.IsDeleted = true; // Profile is deleted

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, new ConfirmRequest { Status = ConfirmStatus.Approve, Reason = null });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer profile not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // Branch Coverage Tests - Different Status Values
        [Fact]
        public async Task UTCID13_ConfirmBecomeOrganizerAsync_WithRejectedStatus_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var profile = CreateOrganizerProfileNeedConfirm();
            profile.Status = ConfirmStatus.Reject; // Already rejected

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, profile.Id, new ConfirmRequest { Status = ConfirmStatus.Approve, Reason = null });

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Profile already confirmed");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        private OrganizerProfile CreateOrganizerProfileNeedConfirm()
        {
            return new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Business,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "John Doe",
                ContactEmail = "john.doe@company.com",
                ContactPhone = "+84901234567",
                Address = "123 Business Street",
                CompanyName = "ABC Event Company",
                Status = ConfirmStatus.NeedConfirm,
                IsDeleted = false
            };
        }

        #endregion


        #region GetOrganizerById

        [Fact]
        public async Task UTCID01_GetOrganizerByIdAsync_WithValidId_ShouldReturnSuccess()
        {
            // Arrange
            var profile = CreateOrganizerProfileNeedConfirm();
            var id = profile.Id;
            var profiles = new List<OrganizerProfile> { profile }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(profiles.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerDetailResponse>()
                   .ForMember(d => d.OrganizerId, o => o.MapFrom(s => s.Id))
                   .ForMember(d => d.UserRegisterInfo, o => o.Ignore());
            });

            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerByIdAsync(id);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.OrganizerId.Should().Be(id);
        }

        [Fact]
        public async Task UTCID02_GetOrganizerByIdAsync_WithEmptyId_ShouldReturnInvalidInput()
        {
            // Act
            var result = await _organizerService.GetOrganizerByIdAsync(Guid.Empty);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID03_GetOrganizerByIdAsync_NotFound_ShouldReturnNotFound()
        {
            // Arrange
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile>().AsQueryable().BuildMockDbSet().Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerDetailResponse>()
                   .ForMember(d => d.OrganizerId, o => o.MapFrom(s => s.Id))
                   .ForMember(d => d.UserRegisterInfo, o => o.Ignore());
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerByIdAsync(Guid.NewGuid());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }
        #endregion

        #region GetOrganizer
        [Fact]
        public async Task UTCID01_GetOrganizerAsync_WithNeedApproveNull_ShouldReturnAllNonDeletedPaged()
        {
            // Arrange
            var profiles = new List<OrganizerProfile>
            {
                CreateProfileWith(status: ConfirmStatus.NeedConfirm, createdAtOffsetDays: 1),
                CreateProfileWith(status: ConfirmStatus.Approve, createdAtOffsetDays: 2),
                CreateProfileWith(status: ConfirmStatus.Reject, createdAtOffsetDays: 3)
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(profiles.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerResponse>()
                   .ForMember(d => d.Id, o => o.MapFrom(s => s.Id.ToString()));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerAsync(pageNumber: 1, pageSize: 2, needApprove: null);

            // Assert
            result.Value.Should().NotBeNull();
            result.Value!.Items.Count.Should().Be(2);
            result.Value!.TotalItems.Should().Be(3);
        }

        [Fact]
        public async Task UTCID02_GetOrganizerAsync_WithNeedApproveTrue_ShouldFilterNeedConfirm()
        {
            // Arrange
            var profiles = new List<OrganizerProfile>
            {
                CreateProfileWith(status: ConfirmStatus.NeedConfirm, createdAtOffsetDays: 1),
                CreateProfileWith(status: ConfirmStatus.Approve, createdAtOffsetDays: 2),
                CreateProfileWith(status: ConfirmStatus.NeedConfirm, createdAtOffsetDays: 3),
                CreateProfileWith(status: ConfirmStatus.Reject, createdAtOffsetDays: 4)
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(profiles.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerResponse>()
                   .ForMember(d => d.Id, o => o.MapFrom(s => s.Id.ToString()));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerAsync(pageNumber: 1, pageSize: 10, needApprove: true);

            // Assert
            result.Value!.Items.Count.Should().Be(2);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.Items.All(i => i.Id is string).Should().BeTrue();
        }

        [Fact]
        public async Task UTCID03_GetOrganizerAsync_WithNeedApproveFalse_ShouldReturnAllNonDeleted()
        {
            // Arrange
            var profiles = new List<OrganizerProfile>
            {
                CreateProfileWith(status: ConfirmStatus.NeedConfirm, createdAtOffsetDays: 1),
                CreateProfileWith(status: ConfirmStatus.Approve, createdAtOffsetDays: 2)
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(profiles.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerResponse>()
                   .ForMember(d => d.Id, o => o.MapFrom(s => s.Id.ToString()));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerAsync(pageNumber: 1, pageSize: 10, needApprove: false);

            // Assert
            result.Value!.Items.Count.Should().Be(2);
            result.Value!.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task UTCID04_GetOrganizerAsync_ShouldExcludeDeletedProfiles()
        {
            // Arrange
            var profiles = new List<OrganizerProfile>
            {
                CreateProfileWith(status: ConfirmStatus.NeedConfirm, createdAtOffsetDays: 1, deleted: false),
                CreateProfileWith(status: ConfirmStatus.Approve, createdAtOffsetDays: 2, deleted: true),
                CreateProfileWith(status: ConfirmStatus.Reject, createdAtOffsetDays: 3, deleted: false)
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(profiles.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerResponse>()
                   .ForMember(d => d.Id, o => o.MapFrom(s => s.Id.ToString()));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerAsync(pageNumber: 1, pageSize: 10, needApprove: null);

            // Assert
            result.Value!.Items.Count.Should().Be(2);
            result.Value!.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task UTCID05_GetOrganizerAsync_Boundary_Page1Size1_ShouldReturnFirstItem()
        {
            // Arrange
            var p1 = CreateProfileWith(createdAtOffsetDays: 2);
            var p2 = CreateProfileWith(createdAtOffsetDays: 1);
            var profiles = new List<OrganizerProfile> { p2, p1 } // unordered input
                .AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(profiles.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerResponse>()
                   .ForMember(d => d.Id, o => o.MapFrom(s => s.Id.ToString()));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerAsync(pageNumber: 1, pageSize: 1, needApprove: null);

            // Assert
            result.Value!.Items.Count.Should().Be(1);
            result.Value!.Items.First().Id.Should().Be(p2.Id.ToString()); // ordered by CreatedAt ascending
            result.Value!.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task UTCID06_GetOrganizerAsync_Boundary_Page2Size1_ShouldReturnSecondItem()
        {
            // Arrange
            var p1 = CreateProfileWith(createdAtOffsetDays: 1);
            var p2 = CreateProfileWith(createdAtOffsetDays: 2);
            var profiles = new List<OrganizerProfile> { p1, p2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(profiles.Object);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerResponse>()
                   .ForMember(d => d.Id, o => o.MapFrom(s => s.Id.ToString()));
            });
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);

            // Act
            var result = await _organizerService.GetOrganizerAsync(pageNumber: 2, pageSize: 1, needApprove: null);

            // Assert
            result.Value!.Items.Count.Should().Be(1);
            result.Value!.Items.First().Id.Should().Be(p2.Id.ToString());
            result.Value!.TotalItems.Should().Be(2);
        }
        #endregion

        private OrganizerProfile CreateProfileWith(ConfirmStatus status = ConfirmStatus.NeedConfirm, int createdAtOffsetDays = 0, bool deleted = false)
        {
            return new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Business,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test",
                ContactEmail = "contact@example.com",
                ContactPhone = "+84123456789",
                Address = "Address",
                CompanyName = "Company",
                Status = status,
                CreatedAt = DateTime.UtcNow.AddDays(createdAtOffsetDays),
                DeletedAt = deleted ? DateTime.UtcNow : null
            };
        }

        #region GetOrganizerProfile
        [Fact]
        public async Task UTCID01_GetOrganizerProfileAsync_ShouldReturnUserNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            var userId = UserId;

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User>().AsQueryable().BuildMock()); 

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found.");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID02_GetOrganizerProfileAsync_ShouldReturnUserNotFound_WhenUserIsDeleted()
        {
            // Arrange
            var userId = UserId;
            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = true, IsActive = true }
            };

            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found.");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID03_GetOrganizerProfileAsync_ShouldReturnUserNotFound_WhenUserIsInactive()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = false }
            };

            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found.");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID04_GetOrganizerProfileAsync_ShouldReturnOrganizerNotFound_WhenOrganizerDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var organizers = new List<OrganizerProfile>().AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(organizers);

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID05_GetOrganizerProfileAsync_ShouldReturnOrganizerNotFound_WhenOrganizerNotApproved()
        {
            // Arrange
            var userId = UserId;

            // User tồn tại, hợp lệ
            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            // Organizer tồn tại nhưng chưa được duyệt
            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    UserId = userId,
                    Address = "ABC",
                    ContactEmail = "test@gmail.com",
                    ContactName = "Test",
                    ContactPhone = "1234567890",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Pending,
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID06_GetOrganizerProfileAsync_ShouldReturnOrganizerNotFound_WhenOrganizerRejected()
        {
            // Arrange
            var userId = UserId;

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            // Organizer tồn tại nhưng bị từ chối (Reject)
            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    UserId = userId,
                    Address = "ABC",
                    ContactEmail = "test@gmail.com",
                    ContactName = "Test",
                    ContactPhone = "1234567890",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Reject
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID07_GetOrganizerProfileAsync_ShouldReturnSuccess_WhenOrganizerApproved()
        {
            // Arrange
            var userId = UserId;

            // User hợp lệ
            var users = new List<User>
            {
                new User
                {
                    Id = userId,
                    FullName = "John Doe",
                    Email = "john@example.com",
                    PhoneNumber = "0123456789",
                    IsDeleted = false,
                    IsActive = true
                }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            // Organizer hợp lệ và đã được duyệt
            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    UserId = userId,
                    Address = "123 Street",
                    ContactEmail = "org@example.com",
                    ContactName = "Organizer Name",
                    ContactPhone = "0987654321",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Approve,
                    IsDeleted = false,

                    Website = "https://org.com",
                    UrlFacebook = "https://facebook.com/org",
                    UrlInstagram = "https://instagram.com/org",
                    UrlLinkedIn = "https://linkedin.com/org",
                    ExperienceDescription = "Experienced event host",
                    IdentityNumber = "123456789",
                    CompanyName = "Event Company",
                    TaxCode = "TAX123",
                    CompanyDescription = "Professional organizer",
                    ImgCompany = "img_company.png",
                    ImgFrontIdentity = "front.png",
                    ImgBackIdentity = "back.png",
                    ImgBusinessLicense = "license.png",

                    User = users.First()
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerDetailResponse>()
                   .ForMember(d => d.OrganizerId, o => o.MapFrom(s => s.Id))
                   .ForMember(d => d.UserRegisterInfo, o => o.Ignore());
            });

            var realMapper = mapperConfig.CreateMapper();
            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);
            _mockMapper.Setup(m => m.Map<OrganizerDetailResponse>(It.IsAny<OrganizerProfile>()))
                .Returns((OrganizerProfile org) =>
                {
                    var mapped = realMapper.Map<OrganizerDetailResponse>(org);
                    mapped.UserRegisterInfo = new UserOrganizerResponse
                    {
                        Id = org.User.Id.ToString(),
                        Email = org.User.Email!,
                        FullName = org.User.FullName!,
                        PhoneNumber = org.User.PhoneNumber
                    };
                    return mapped;
                });

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();
            result.Value.Should().NotBeNull();

            var response = result.Value!;
            response.OrganizerId.Should().Be(OrganizerId);
            response.ContactName.Should().Be("Organizer Name");
            response.ContactEmail.Should().Be("org@example.com");
            response.ContactPhone.Should().Be("0987654321");
            response.Address.Should().Be("123 Street");

            response.UserRegisterInfo.Should().NotBeNull();
            response.UserRegisterInfo.Id.Should().Be(userId.ToString());
            response.UserRegisterInfo.Email.Should().Be("john@example.com");
            response.UserRegisterInfo.FullName.Should().Be("John Doe");
            response.UserRegisterInfo.PhoneNumber.Should().Be("0123456789");
        }

        [Fact]
        public async Task UTCID08_GetOrganizerProfileAsync_ShouldReturnOrganizerNotFound_WhenOrganizerDeleted()
        {
            // Arrange
            var userId = UserId;

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            // Organizer tồn tại nhưng đã bị xóa (IsDeleted = true)
            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    UserId = userId,
                    Address = "ABC",
                    ContactEmail = "test@gmail.com",
                    ContactName = "Test",
                    ContactPhone = "1234567890",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Approve,
                    IsDeleted = true
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.GetOrganizerProfileAsync(userId);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        #endregion

        #region UpdateOrganizerProfile
        [Fact]
        public async Task UTCID01_UpdateOrganizerProfileAsync_ShouldReturnNotFound_WhenProfileDoesNotExist()
        {
            // Arrange
            var userId = UserId;

            var request = new UpdateOrganizerProfileRequest
            {
                ContactName = "Test Contact",
                Address = "123 Test St",
                Website = "https://test.com",
                ImgCompany = null
            };

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var organizers = new List<OrganizerProfile>();
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.UpdateOrganizerProfileAsync(userId, request);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never); // không gọi khi profile null
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID02_UpdateOrganizerProfileAsync_ShouldReturnNotFound_WhenUserInactive()
        {
            // Arrange
            var userId = UserId;

            var request = new UpdateOrganizerProfileRequest
            {
                ContactName = "Test Contact",
                Address = "123 Test St",
                Website = "https://test.com",
                ImgCompany = null
            };

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = false } // inactive
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    User = users[0],
                    UserId = userId,
                    Address = "ABC",
                    ContactEmail = "test@gmail.com",
                    ContactName = "Test",
                    ContactPhone = "1234567890",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Approve,
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.UpdateOrganizerProfileAsync(userId, request);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never); // không gọi UserRepository query trực tiếp
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found.");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID03_UpdateOrganizerProfileAsync_ShouldReturnNotFound_WhenProfileIsDeleted()
        {
            // Arrange
            var userId = UserId;

            var request = new UpdateOrganizerProfileRequest
            {
                ContactName = "Test Contact",
                Address = "123 Test St",
                Website = "https://test.com",
                ImgCompany = null
            };

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true } 
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    User = users[0],      
                    UserId = userId,
                    Address = "ABC",
                    ContactEmail = "test@gmail.com",
                    ContactName = "Test",
                    ContactPhone = "1234567890",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Approve,
                    IsDeleted = true       
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();

            _mockUnitOfWork
                .Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.UpdateOrganizerProfileAsync(userId, request);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never); 
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID04_UpdateOrganizerProfileAsync_ShouldReturnSuccess_WhenRequestFieldsAreAllNull()
        {
            // Arrange
            var userId = UserId;

            var request = new UpdateOrganizerProfileRequest
            {
                ContactName = null,
                Address = null,
                Website = null,
                UrlFacebook = null,
                UrlInstagram = null,
                UrlLinkedIn = null,
                ExperienceDescription = null,
                CompanyDescription = null,
                OrganizationType = null,
                EventFrequency = null,
                EventSize = null,
                OrganizerType = null,
                EventExperienceLevel = null,
                ImgCompany = null
            };

            var users = new List<User>
            {
                new User
                {
                    Id = userId,
                    FullName = "John Doe",
                    Email = "john@example.com",
                    PhoneNumber = "0123456789",
                    IsDeleted = false,
                    IsActive = true
                }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var originalProfile = new OrganizerProfile
            {
                Id = OrganizerId,
                User = users[0],
                UserId = userId,
                ContactName = "Old Contact",
                Address = "Old Address",
                ContactEmail = "test@gmail.com",
                Website = "https://old.com",
                ContactPhone = "1234567890",
                UrlFacebook = "https://facebook.com/old",
                UrlInstagram = "https://instagram.com/old",
                UrlLinkedIn = "https://linkedin.com/old",
                ExperienceDescription = "Old experience",
                CompanyDescription = "Old company",
                OrganizationType = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizerType = 0,
                EventExperienceLevel = 0,
                ImgCompany = "old_img_url",
                Status = ConfirmStatus.Approve,
                IsDeleted = false
            };

            var organizers = new List<OrganizerProfile> { originalProfile };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            _mockCloudinaryService.Setup(c => c.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync((string?)null);

            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()))
                .ReturnsAsync((OrganizerProfile p) => p);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerDetailResponse>()
                   .ForMember(d => d.OrganizerId, o => o.MapFrom(s => s.Id));
            });
            var realMapper = mapperConfig.CreateMapper();

            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);
            _mockMapper.Setup(m => m.Map<OrganizerDetailResponse>(It.IsAny<OrganizerProfile>()))
                .Returns((OrganizerProfile org) =>
                {
                    var mapped = realMapper.Map<OrganizerDetailResponse>(org);
                    mapped.UserRegisterInfo = new UserOrganizerResponse
                    {
                        Id = org.User.Id.ToString(),
                        Email = org.User.Email!,
                        FullName = org.User.FullName!,
                        PhoneNumber = org.User.PhoneNumber
                    };
                    return mapped;
                });

            // Act
            var result = await _organizerService.UpdateOrganizerProfileAsync(userId, request);

            // Assert
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);
            _mockCloudinaryService.Verify(
                c => c.UploadImageAsync(It.Is<IFormFile>(f => f != null)), Times.Never);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();

            var updatedProfile = result.Value as OrganizerDetailResponse;
            updatedProfile.Should().NotBeNull();
            updatedProfile!.ContactName.Should().Be("Old Contact");
            updatedProfile.Address.Should().Be("Old Address");
            updatedProfile.Website.Should().Be("https://old.com");
            updatedProfile.UrlFacebook.Should().Be("https://facebook.com/old");
            updatedProfile.UrlInstagram.Should().Be("https://instagram.com/old");
            updatedProfile.UrlLinkedIn.Should().Be("https://linkedin.com/old");
            updatedProfile.ExperienceDescription.Should().Be("Old experience");
            updatedProfile.CompanyDescription.Should().Be("Old company");
            updatedProfile.OrganizationType.Should().Be(0);
            updatedProfile.EventFrequency.Should().Be(0);
            updatedProfile.EventSize.Should().Be(0);
            updatedProfile.OrganizerType.Should().Be(0);
            updatedProfile.EventExperienceLevel.Should().Be(0);
            updatedProfile.ImgCompany.Should().Be("old_img_url");
            updatedProfile.UserRegisterInfo.Should().NotBeNull();
            updatedProfile.UserRegisterInfo.Id.Should().Be(userId.ToString());
            updatedProfile.UserRegisterInfo.Email.Should().Be("john@example.com");
            updatedProfile.UserRegisterInfo.FullName.Should().Be("John Doe");
            updatedProfile.UserRegisterInfo.PhoneNumber.Should().Be("0123456789");
        }

        [Fact]
        public async Task UTCID05_UpdateOrganizerProfileAsync_ShouldReturnSuccess_WhenRequestFieldsAllHaveValues_ImgCompanyNull()
        {
            // Arrange
            var userId = UserId;

            var request = new UpdateOrganizerProfileRequest
            {
                ContactName = "New Contact",
                Address = "456 New Street",
                Website = "https://new.com",
                UrlFacebook = "https://facebook.com/new",
                UrlInstagram = "https://instagram.com/new",
                UrlLinkedIn = "https://linkedin.com/new",
                ExperienceDescription = "New experience",
                CompanyDescription = "New company",
                OrganizationType = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizerType = 0,
                EventExperienceLevel = 0,
                ImgCompany = null 
            };

            var users = new List<User>
            {
                new User
                {
                    Id = userId,
                    FullName = "John Doe",
                    Email = "john@example.com",
                    PhoneNumber = "0123456789",
                    IsDeleted = false,
                    IsActive = true
                }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var originalProfile = new OrganizerProfile
            {
                Id = OrganizerId,
                User = users[0],
                UserId = userId,
                ContactName = "Old Contact",
                Address = "Old Address",
                Website = "https://old.com",
                ContactEmail = "test@gmail.com",
                ContactPhone = "0987654321",
                UrlFacebook = "https://facebook.com/old",
                UrlInstagram = "https://instagram.com/old",
                UrlLinkedIn = "https://linkedin.com/old",
                ExperienceDescription = "Old experience",
                CompanyDescription = "Old company",
                OrganizationType = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizerType = 0,
                EventExperienceLevel = 0,
                ImgCompany = "old_img_url",
                Status = ConfirmStatus.Approve,
                IsDeleted = false
            };

            var organizers = new List<OrganizerProfile> { originalProfile };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            _mockCloudinaryService.Setup(c => c.UploadImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync((string?)null);

            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()))
                .ReturnsAsync((OrganizerProfile p) => p);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<OrganizerProfile, OrganizerDetailResponse>()
                   .ForMember(d => d.OrganizerId, o => o.MapFrom(s => s.Id));
            });
            var realMapper = mapperConfig.CreateMapper();

            _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(mapperConfig);
            _mockMapper.Setup(m => m.Map<OrganizerDetailResponse>(It.IsAny<OrganizerProfile>()))
                .Returns((OrganizerProfile org) =>
                {
                    var mapped = realMapper.Map<OrganizerDetailResponse>(org);
                    mapped.UserRegisterInfo = new UserOrganizerResponse
                    {
                        Id = org.User.Id.ToString(),
                        Email = org.User.Email!,
                        FullName = org.User.FullName!,
                        PhoneNumber = org.User.PhoneNumber
                    };
                    return mapped;
                });

            // Act
            var result = await _organizerService.UpdateOrganizerProfileAsync(userId, request);

            // Assert
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);
            _mockCloudinaryService.Verify(
                c => c.UploadImageAsync(It.Is<IFormFile>(f => f != null)), Times.Never);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();

            var updatedProfile = result.Value as OrganizerDetailResponse;
            updatedProfile.Should().NotBeNull();

            updatedProfile!.ContactName.Should().Be("New Contact");
            updatedProfile.Address.Should().Be("456 New Street");
            updatedProfile.Website.Should().Be("https://new.com");
            updatedProfile.UrlFacebook.Should().Be("https://facebook.com/new");
            updatedProfile.UrlInstagram.Should().Be("https://instagram.com/new");
            updatedProfile.UrlLinkedIn.Should().Be("https://linkedin.com/new");
            updatedProfile.ExperienceDescription.Should().Be("New experience");
            updatedProfile.CompanyDescription.Should().Be("New company");
            updatedProfile.OrganizationType.Should().Be(0);
            updatedProfile.EventFrequency.Should().Be(0);
            updatedProfile.EventSize.Should().Be(0);
            updatedProfile.OrganizerType.Should().Be(0);
            updatedProfile.EventExperienceLevel.Should().Be(0);
            updatedProfile.ImgCompany.Should().Be("old_img_url");
            updatedProfile.UserRegisterInfo.Should().NotBeNull();
            updatedProfile.UserRegisterInfo.Id.Should().Be(userId.ToString());
            updatedProfile.UserRegisterInfo.Email.Should().Be("john@example.com");
            updatedProfile.UserRegisterInfo.FullName.Should().Be("John Doe");
            updatedProfile.UserRegisterInfo.PhoneNumber.Should().Be("0123456789");
        }

        [Fact]
        public async Task UTCID06_UpdateOrganizerProfileAsync_ShouldReturnNotFound_WhenProfileStatusIsReject()
        {
            // Arrange
            var userId = UserId;

            var request = new UpdateOrganizerProfileRequest
            {
                ContactName = "Test Contact",
                Address = "123 Test St",
                Website = "https://test.com",
                ImgCompany = null
            };

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    User = users[0],
                    UserId = userId,
                    Address = "ABC",
                    ContactEmail = "test@gmail.com",
                    ContactName = "Test",
                    ContactPhone = "1234567890",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Reject, // Reject
                    IsDeleted = false
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.UpdateOrganizerProfileAsync(userId, request);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID07_UpdateOrganizerProfileAsync_ShouldReturnNotFound_WhenProfileStatusIsPending()
        {
            // Arrange
            var userId = UserId;

            var request = new UpdateOrganizerProfileRequest
            {
                ContactName = "Test Contact",
                Address = "123 Test St",
                Website = "https://test.com",
                ImgCompany = null
            };

            var users = new List<User>
            {
                new User { Id = userId, IsDeleted = false, IsActive = true }
            };
            var mockUserQueryable = users.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(mockUserQueryable);

            var organizers = new List<OrganizerProfile>
            {
                new OrganizerProfile
                {
                    Id = OrganizerId,
                    User = users[0],
                    UserId = userId,
                    Address = "ABC",
                    ContactEmail = "test@gmail.com",
                    ContactName = "Test",
                    ContactPhone = "1234567890",
                    EventExperienceLevel = 0,
                    EventFrequency = 0,
                    EventSize = 0,
                    OrganizationType = 0,
                    OrganizerType = 0,
                    Status = ConfirmStatus.Pending, // Pending
                    IsDeleted = false
                }
            };
            var mockOrganizerQueryable = organizers.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.OrganizerProfileRepository.Query(false))
                .Returns(mockOrganizerQueryable);

            // Act
            var result = await _organizerService.UpdateOrganizerProfileAsync(userId, request);

            // Assert
            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Never);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.Query(false), Times.Once);
            _mockUnitOfWork.Verify(u => u.OrganizerProfileRepository.UpdateAsync(It.IsAny<OrganizerProfile>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or not approved yet");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }
        #endregion
    }
}
